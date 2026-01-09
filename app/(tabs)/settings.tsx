import { useEffect, useMemo, useState } from 'react';

import { router } from 'expo-router';
import { Alert, Platform, View } from 'react-native';

import { Button } from '../../src/components/Button';
import { Screen } from '../../src/components/Screen';
import { AppText } from '../../src/components/AppText';
import { TimeField } from '../../src/components/TimeField';
import { ToggleRow } from '../../src/components/ToggleRow';
import { usePlan } from '../../src/features/plan/PlanProvider';
import { SectionHeader } from '../../src/components/SectionHeader';
import { parseTimeToDate, formatTime } from '../../src/utils/date';
import { DayOfWeekPicker } from '../../src/components/DayOfWeekPicker';
import { logError, logInfo } from '../../src/features/logs/logService';
import { deletePlan } from '../../src/features/plan/storage/planRepository';
import { buildBackupPayload, importBackup } from '../../src/storage/backup';
import { updatePlanWithRules } from '../../src/features/plan/domain/planService';
import { canEditDaysOfWeek, getDayIndex } from '../../src/features/plan/domain/planRules';
import { schedulePlanNotifications } from '../../src/features/notifications/notificationsService';

// Conditionally import native-only modules
let DateTimePicker: typeof import('@react-native-community/datetimepicker').default | null = null;
let Sharing: typeof import('expo-sharing') | null = null;
let FileSystem: typeof import('expo-file-system') | null = null;
let DocumentPicker: typeof import('expo-document-picker') | null = null;

if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
  Sharing = require('expo-sharing');
  FileSystem = require('expo-file-system');
  DocumentPicker = require('expo-document-picker');
}

type DateTimePickerEvent = {
  type: 'set' | 'dismissed';
  nativeEvent: { timestamp?: number };
};

export default function Settings() {
  const { plan, refresh } = usePlan();
  const [picker, setPicker] = useState<'morning' | 'evening' | null>(null);
  const [draftDays, setDraftDays] = useState<number[]>([]);

  const today = useMemo(() => new Date(), []);
  useEffect(() => {
    if (plan) {
      setDraftDays(plan.nizoralDaysOfWeek);
    }
  }, [plan]);

  if (!plan) {
    return (
      <Screen>
        <AppText variant="subtitle" className="mt-10">
          Loading plan...
        </AppText>
      </Screen>
    );
  }

  const canEditDays = canEditDaysOfWeek(plan.startDate, today);
  const dayIndex = getDayIndex(plan.startDate, today);

  const handleTimeChange = async (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === 'dismissed' || !date) {
      setPicker(null);
      return;
    }
    const time = formatTime(date);
    const updates = picker === 'morning' ? { morningTime: time } : { eveningTime: time };
    try {
      const updated = await updatePlanWithRules(today, updates);
      if (updated) {
        await schedulePlanNotifications(updated);
        await refresh();
        await logInfo('Plan time updated');
      }
    } catch (error) {
      await logError('Failed to update plan time', error);
    } finally {
      setPicker(null);
    }
  };

  const handleDayToggle = (dayIndexToToggle: number) => {
    setDraftDays((prev) => {
      const exists = prev.includes(dayIndexToToggle);
      if (exists) {
        return prev.filter((day) => day !== dayIndexToToggle);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, dayIndexToToggle].sort();
    });
  };

  const handleSaveDays = async () => {
    if (draftDays.length !== 3) {
      return;
    }
    try {
      const updated = await updatePlanWithRules(today, { nizoralDaysOfWeek: draftDays });
      if (updated) {
        await schedulePlanNotifications(updated);
        await refresh();
        await logInfo('Plan days updated');
      }
    } catch (error) {
      await logError('Failed to update wash days', error);
    }
  };

  const handleTerbinafineToggle = async (value: boolean) => {
    try {
      const updated = await updatePlanWithRules(today, { terbinafineEnabled: value });
      if (updated) {
        await schedulePlanNotifications(updated);
        await refresh();
        await logInfo('Terbinafine toggle updated');
      }
    } catch (error) {
      await logError('Failed to update terbinafine', error);
    }
  };

  const handleExport = async () => {
    try {
      const payload = await buildBackupPayload();

      if (Platform.OS === 'web') {
        // Web: download as file
        const dataStr = JSON.stringify(payload, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hold-backup-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        await logInfo('Backup exported (web)');
        return;
      }

      if (FileSystem && Sharing) {
        const uri = `${FileSystem.cacheDirectory}hold-backup-${Date.now()}.json`;
        await FileSystem.writeAsStringAsync(uri, JSON.stringify(payload, null, 2));
        await Sharing.shareAsync(uri, { mimeType: 'application/json' });
        await logInfo('Backup exported');
      }
    } catch (error) {
      await logError('Failed to export backup', error);
    }
  };

  const handleImport = async () => {
    if (Platform.OS === 'web') {
      // Web: use file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        try {
          const content = await file.text();
          const payload = JSON.parse(content);
          await importBackup(payload);
          await refresh();
          await logInfo('Backup imported (web)');
        } catch (error) {
          await logError('Failed to import backup', error);
        }
      };
      input.click();
      return;
    }

    Alert.alert('Import backup', 'This will replace the current data on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Import',
        style: 'destructive',
        onPress: async () => {
          try {
            if (!DocumentPicker || !FileSystem) return;
            const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
            if (result.canceled || !result.assets?.[0]?.uri) {
              return;
            }
            const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
            const payload = JSON.parse(content);
            await importBackup(payload);
            await refresh();
            await logInfo('Backup imported');
          } catch (error) {
            await logError('Failed to import backup', error);
          }
        },
      },
    ]);
  };

  const clearData = async () => {
    await deletePlan();
    await logInfo('Data cleared');
    router.replace('/onboarding');
  };

  return (
    <Screen scrollable>
      <View className="flex-1 pb-8">
        <AppText variant="title" className="mt-6">
          Plan settings
        </AppText>
        <AppText variant="muted" className="mt-1">
          Small edits only until day 22.
        </AppText>

        <View className="mt-6">
          <SectionHeader title="Reminder times" subtitle="Adjustable anytime." />
          <View>
            <TimeField
              label="Morning"
              value={plan.morningTime}
              onPress={() => setPicker('morning')}
            />
            <View className="mt-3">
              <TimeField
                label="Evening"
                value={plan.eveningTime}
                onPress={() => setPicker('evening')}
              />
            </View>
          </View>
        </View>

        <View className="mt-6">
          <SectionHeader
            title="Wash days"
            subtitle={
              canEditDays
                ? 'Pick three days that stay steady.'
                : `Locked until day 22. You are on day ${dayIndex}.`
            }
          />
          <DayOfWeekPicker
            selectedDays={draftDays}
            onToggle={handleDayToggle}
            disabled={!canEditDays}
          />
          {!canEditDays ? (
            <AppText variant="muted" className="mt-2">
              The goal is to keep decisions off your plate for the first 21 days.
            </AppText>
          ) : null}
          {canEditDays ? (
            <View className="mt-3">
              <Button
                label="Save wash days"
                onPress={handleSaveDays}
                disabled={draftDays.length !== 3}
              />
            </View>
          ) : null}
        </View>

        <View className="mt-6">
          <SectionHeader title="Terbinafine" subtitle="Turn it on when you have it." />
          <ToggleRow
            label="Enabled"
            value={plan.terbinafineEnabled}
            onChange={handleTerbinafineToggle}
          />
        </View>

        <View className="mt-8">
          <SectionHeader title="iCloud backup" subtitle="Manual export/import via iCloud Drive." />
          <View className="mt-2">
            <Button label="Export backup" onPress={handleExport} />
            <View className="mt-3">
              <Button label="Import backup" variant="outline" onPress={handleImport} />
            </View>
          </View>
        </View>

        <View className="mt-8">
          <SectionHeader title="Diagnostics" subtitle="Quick access to logs." />
          <Button label="Open logs" variant="outline" onPress={() => router.push('/logs')} />
          <Button label="Clear Data" variant="outline" onPress={() => clearData()} />
        </View>

        {picker && Platform.OS !== 'web' && DateTimePicker ? (
          <DateTimePicker
            value={parseTimeToDate(picker === 'morning' ? plan.morningTime : plan.eveningTime)}
            mode="time"
            display="spinner"
            onChange={handleTimeChange}
          />
        ) : null}

        {picker && Platform.OS === 'web' ? (
          <View className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <View className="rounded-xl bg-white p-6">
              <AppText variant="subtitle" className="mb-4">
                Set {picker} time
              </AppText>
              <input
                type="time"
                defaultValue={picker === 'morning' ? plan.morningTime : plan.eveningTime}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value) {
                    handleTimeChange(
                      { type: 'set', nativeEvent: {} },
                      new Date(`2000-01-01T${value}:00`)
                    );
                  }
                }}
                style={{
                  fontSize: 18,
                  padding: 8,
                  borderRadius: 8,
                  border: '1px solid #ccc',
                }}
              />
              <View className="mt-4">
                <Button
                  label="Cancel"
                  variant="outline"
                  onPress={() => setPicker(null)}
                />
              </View>
            </View>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
