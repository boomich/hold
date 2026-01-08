import { useEffect, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Screen } from '../../src/components/Screen';
import { AppText } from '../../src/components/AppText';
import { SectionHeader } from '../../src/components/SectionHeader';
import { DayOfWeekPicker } from '../../src/components/DayOfWeekPicker';
import { TimeField } from '../../src/components/TimeField';
import { ToggleRow } from '../../src/components/ToggleRow';
import { Button } from '../../src/components/Button';
import { usePlan } from '../../src/features/plan/PlanProvider';
import { updatePlanWithRules } from '../../src/features/plan/domain/planService';
import { canEditDaysOfWeek, getDayIndex } from '../../src/features/plan/domain/planRules';
import { parseTimeToDate, formatTime } from '../../src/utils/date';
import { schedulePlanNotifications } from '../../src/features/notifications/notificationsService';
import { buildBackupPayload, importBackup } from '../../src/storage/backup';
import { logError, logInfo } from '../../src/features/logs/logService';
import { router } from 'expo-router';

export default function Settings() {
  const { plan, refresh } = usePlan();
  const [picker, setPicker] = useState<'morning' | 'evening' | null>(null);
  const [draftDays, setDraftDays] = useState<number[]>([]);

  if (!plan) {
    return (
      <Screen>
        <AppText variant="subtitle" className="mt-10">
          Loading plan...
        </AppText>
      </Screen>
    );
  }

  const today = useMemo(() => new Date(), []);
  useEffect(() => {
    setDraftDays(plan.nizoralDaysOfWeek);
  }, [plan.nizoralDaysOfWeek]);

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
      const uri = `${FileSystem.cacheDirectory}hold-backup-${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(uri, JSON.stringify(payload, null, 2));
      await Sharing.shareAsync(uri, { mimeType: 'application/json' });
      await logInfo('Backup exported');
    } catch (error) {
      await logError('Failed to export backup', error);
    }
  };

  const handleImport = async () => {
    Alert.alert('Import backup', 'This will replace the current data on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Import',
        style: 'destructive',
        onPress: async () => {
          try {
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

  return (
    <Screen>
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
          <ToggleRow label="Enabled" value={plan.terbinafineEnabled} onChange={handleTerbinafineToggle} />
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
        </View>

        {picker ? (
          <DateTimePicker
            value={parseTimeToDate(picker === 'morning' ? plan.morningTime : plan.eveningTime)}
            mode="time"
            display="spinner"
            onChange={handleTimeChange}
          />
        ) : null}
      </View>
    </Screen>
  );
}
