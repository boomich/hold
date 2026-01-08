import { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, Switch, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { Chip } from '@/shared/ui/Chip';
import { Screen } from '@/shared/ui/Screen';
import { Text } from '@/shared/ui/Text';
import { colors } from '@/design/tokens';
import { useAppState } from '@/providers/AppProvider';
import { schedulePlanNotifications } from '@/features/notifications/domain/notificationService';
import { getExistingPlan } from '@/features/plan/domain/planService';
import { getCheckInsBetween } from '@/features/checkin/storage/checkinRepository';
import { getCompletionsBetween } from '@/features/tasks/storage/completionRepository';
import { logError } from '@/features/logs/domain/logService';

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const timeToString = (date: Date) => format(date, 'HH:mm');

const stringToTime = (value: string) => {
  const [hour, minute] = value.split(':').map((part) => Number(part));
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
};

export const SettingsScreen = () => {
  const router = useRouter();
  const { plan, updatePlan, dayIndex } = useAppState();
  const [showMorningPicker, setShowMorningPicker] = useState(false);
  const [showEveningPicker, setShowEveningPicker] = useState(false);

  const locked = dayIndex !== null && dayIndex <= 21;

  const washDaysLabel = useMemo(() => {
    if (!plan) {
      return '';
    }
    return plan.nizoralDaysOfWeek.map((day) => dayLabels[day]).join(', ');
  }, [plan]);

  if (!plan) {
    return (
      <Screen>
        <View className="pt-8">
          <Text variant="body">Loading settings...</Text>
        </View>
      </Screen>
    );
  }

  const handleUpdate = async (updates: Partial<typeof plan>) => {
    try {
      await updatePlan(updates);
      const refreshed = await getExistingPlan();
      if (refreshed) {
        await schedulePlanNotifications(refreshed);
      }
    } catch (error) {
      await logError(`Failed to update plan: ${String(error)}`);
      Alert.alert('Plan locked', String(error));
    }
  };

  const exportData = async () => {
    try {
      const start = format(new Date(plan.startDate), 'yyyy-MM-dd');
      const end = format(new Date(), 'yyyy-MM-dd');
      const completions = await getCompletionsBetween(start, end);
      const checkIns = await getCheckInsBetween(start, end);
      const payload = {
        plan,
        completions,
        checkIns,
        exportedAt: new Date().toISOString(),
      };
      const fileUri = `${FileSystem.cacheDirectory}hold-export.json`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(payload, null, 2));
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Export Hold data',
      });
    } catch (error) {
      await logError(`Failed to export data: ${String(error)}`);
      Alert.alert('Export failed', 'Please try again.');
    }
  };

  return (
    <Screen>
      <View className="gap-6 pt-6">
        <View className="gap-1">
          <Text variant="title">Plan settings</Text>
          <Text variant="small">Keep it steady for the first 21 days.</Text>
        </View>

        <Card className="gap-4">
          <View className="gap-2">
            <Text variant="h3">Wash days</Text>
            <View className="flex-row flex-wrap gap-2">
              {dayLabels.map((label, index) => (
                <Chip
                  key={label}
                  label={label}
                  selected={plan.nizoralDaysOfWeek.includes(index)}
                  onPress={() => {
                    if (locked) {
                      return;
                    }
                    const nextDays = plan.nizoralDaysOfWeek.includes(index)
                      ? plan.nizoralDaysOfWeek.filter((day) => day !== index)
                      : [...plan.nizoralDaysOfWeek, index];
                    if (nextDays.length > 3) {
                      return;
                    }
                    handleUpdate({ nizoralDaysOfWeek: nextDays });
                  }}
                />
              ))}
            </View>
            <Text variant="small">
              {locked
                ? 'Locked until day 22. Current: ' + washDaysLabel
                : 'Choose 3 fixed days.'}
            </Text>
          </View>

          <View className="gap-2">
            <Text variant="h3">Morning reminder</Text>
            <Pressable
              className="border border-line rounded-pill px-4 py-2 bg-surface"
              onPress={() => setShowMorningPicker(true)}
            >
              <Text variant="body">{plan.morningTime}</Text>
            </Pressable>
          </View>

          <View className="gap-2">
            <Text variant="h3">Evening reminder</Text>
            <Pressable
              className="border border-line rounded-pill px-4 py-2 bg-surface"
              onPress={() => setShowEveningPicker(true)}
            >
              <Text variant="body">{plan.eveningTime}</Text>
            </Pressable>
          </View>

          <View className="flex-row items-center justify-between">
            <View>
              <Text variant="h3">Terbinafine cream</Text>
              <Text variant="small">Turn on if you have it.</Text>
            </View>
            <Switch
              value={plan.terbinafineEnabled}
              onValueChange={(value) => handleUpdate({ terbinafineEnabled: value })}
              trackColor={{ true: colors.accent, false: colors.line }}
            />
          </View>
        </Card>

        <Card className="gap-3">
          <Text variant="h3">Cloud sync (optional)</Text>
          <Text variant="small">
            Save a snapshot to Files. Choose iCloud Drive when the share sheet opens.
          </Text>
          <Button label="Export data" variant="secondary" onPress={exportData} />
        </Card>

        <Card className="gap-3">
          <Text variant="h3">Diagnostics</Text>
          <Button label="Open logs" variant="ghost" onPress={() => router.push('/(tabs)/settings/logs')} />
        </Card>
      </View>

      {showMorningPicker && (
        <DateTimePicker
          value={stringToTime(plan.morningTime)}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, selected) => {
            setShowMorningPicker(Platform.OS === 'ios');
            if (selected) {
              handleUpdate({ morningTime: timeToString(selected) });
            }
          }}
        />
      )}

      {showEveningPicker && (
        <DateTimePicker
          value={stringToTime(plan.eveningTime)}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, selected) => {
            setShowEveningPicker(Platform.OS === 'ios');
            if (selected) {
              handleUpdate({ eveningTime: timeToString(selected) });
            }
          }}
        />
      )}
    </Screen>
  );
};
