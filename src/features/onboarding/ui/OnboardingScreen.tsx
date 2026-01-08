import { useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { Pressable, Switch, View } from 'uniwind/components';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { Chip } from '@/shared/ui/Chip';
import { Screen } from '@/shared/ui/Screen';
import { Text } from '@/shared/ui/Text';
import { useAppState } from '@/providers/AppProvider';
import { DEFAULT_NIZORAL_DAYS } from '@/features/plan/domain/planService';
import { schedulePlanNotifications, requestNotificationPermission } from '@/features/notifications/domain/notificationService';
import { colors } from '@/design/tokens';
import { logError } from '@/features/logs/domain/logService';

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const timeToString = (date: Date) => format(date, 'HH:mm');

const stringToTime = (value: string) => {
  const [hour, minute] = value.split(':').map((part) => Number(part));
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
};

export const OnboardingScreen = () => {
  const router = useRouter();
  const { createPlan } = useAppState();
  const [startDate, setStartDate] = useState(new Date());
  const [washDays, setWashDays] = useState<number[]>(DEFAULT_NIZORAL_DAYS);
  const [morningTime, setMorningTime] = useState('08:30');
  const [eveningTime, setEveningTime] = useState('20:00');
  const [terbinafineEnabled, setTerbinafineEnabled] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showMorningPicker, setShowMorningPicker] = useState(false);
  const [showEveningPicker, setShowEveningPicker] = useState(false);

  const daySelectionHint = useMemo(() => {
    if (washDays.length === 3) {
      return 'Exactly 3 wash days locked for the first 21 days.';
    }
    return `Select ${3 - washDays.length} more day(s).`;
  }, [washDays.length]);

  const toggleDay = (day: number) => {
    if (washDays.includes(day)) {
      setWashDays(washDays.filter((value) => value !== day));
      return;
    }
    if (washDays.length >= 3) {
      return;
    }
    setWashDays([...washDays, day]);
  };

  const canSubmit = washDays.length === 3;

  const handleCreate = async () => {
    if (!canSubmit) {
      return;
    }
    try {
      const planInput = {
        startDate: format(startDate, 'yyyy-MM-dd'),
        nizoralDaysOfWeek: washDays,
        eveningTime,
        morningTime,
        terbinafineEnabled,
      };
      await createPlan(planInput);
      await requestNotificationPermission();
      await schedulePlanNotifications({
        ...planInput,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      router.replace('/(tabs)');
    } catch (error) {
      await logError(`Failed to create plan: ${String(error)}`);
    }
  };

  return (
    <Screen>
      <View className="gap-6 pt-6">
        <View className="gap-2">
          <Text variant="title">Hold, 30 days.</Text>
          <Text variant="body" className="text-muted">
            We start today. No waiting. No analysis until day 21.
          </Text>
        </View>

        <Card className="gap-4">
          <View className="gap-2">
            <Text variant="h3">Start date</Text>
            <Pressable
              className="border border-line rounded-pill px-4 py-2 bg-surface"
              onPress={() => setShowDatePicker(true)}
            >
              <Text variant="body">{format(startDate, 'EEE, MMM d')}</Text>
            </Pressable>
          </View>

          <View className="gap-2">
            <Text variant="h3">Wash days (3x/week)</Text>
            <View className="flex-row flex-wrap gap-2">
              {dayLabels.map((label, index) => (
                <Chip
                  key={label}
                  label={label}
                  selected={washDays.includes(index)}
                  onPress={() => toggleDay(index)}
                />
              ))}
            </View>
            <Text variant="small">{daySelectionHint}</Text>
          </View>

          <View className="gap-2">
            <Text variant="h3">Morning reminder</Text>
            <Pressable
              className="border border-line rounded-pill px-4 py-2 bg-surface"
              onPress={() => setShowMorningPicker(true)}
            >
              <Text variant="body">{morningTime}</Text>
            </Pressable>
          </View>

          <View className="gap-2">
            <Text variant="h3">Evening reminder</Text>
            <Pressable
              className="border border-line rounded-pill px-4 py-2 bg-surface"
              onPress={() => setShowEveningPicker(true)}
            >
              <Text variant="body">{eveningTime}</Text>
            </Pressable>
          </View>

          <View className="flex-row items-center justify-between">
            <View>
              <Text variant="h3">Terbinafine cream</Text>
              <Text variant="small">Toggle on once you have it.</Text>
            </View>
            <Switch
              value={terbinafineEnabled}
              onValueChange={setTerbinafineEnabled}
              trackColor={{ true: colors.accent, false: colors.line }}
            />
          </View>
        </Card>

        <Card className="gap-2">
          <Text variant="h3">No analysis until day 21</Text>
          <Text variant="small">
            Your only job is to complete today’s steps. Progress charts unlock later.
          </Text>
        </Card>

        <Button label="Create my plan" onPress={handleCreate} disabled={!canSubmit} />
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(_, selected) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (selected) {
              setStartDate(selected);
            }
          }}
        />
      )}

      {showMorningPicker && (
        <DateTimePicker
          value={stringToTime(morningTime)}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, selected) => {
            setShowMorningPicker(Platform.OS === 'ios');
            if (selected) {
              setMorningTime(timeToString(selected));
            }
          }}
        />
      )}

      {showEveningPicker && (
        <DateTimePicker
          value={stringToTime(eveningTime)}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, selected) => {
            setShowEveningPicker(Platform.OS === 'ios');
            if (selected) {
              setEveningTime(timeToString(selected));
            }
          }}
        />
      )}
    </Screen>
  );
};
