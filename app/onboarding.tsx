import { useMemo, useState } from 'react';

import { View } from 'react-native';
import { router } from 'expo-router';

import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import DateTimePicker from '@react-native-community/datetimepicker';

import { Screen } from '../src/components/Screen';
import { Button } from '../src/components/Button';
import { AppText } from '../src/components/AppText';
import { TimeField } from '../src/components/TimeField';
import { ToggleRow } from '../src/components/ToggleRow';
import { usePlan } from '../src/features/plan/PlanProvider';
import { SectionHeader } from '../src/components/SectionHeader';
import { DayOfWeekPicker } from '../src/components/DayOfWeekPicker';
import { logError, logInfo } from '../src/features/logs/logService';
import { createPlan } from '../src/features/plan/storage/planRepository';
import { formatDateISO, formatTime, parseTimeToDate } from '../src/utils/date';

import {
  schedulePlanNotifications,
  requestNotificationPermissions,
} from '../src/features/notifications/notificationsService';

const defaultDays = [1, 3, 6];

export default function Onboarding() {
  const { refresh } = usePlan();
  const [startDate, setStartDate] = useState(new Date());
  const [selectedDays, setSelectedDays] = useState<number[]>(defaultDays);
  const [morningTime, setMorningTime] = useState('08:30');
  const [eveningTime, setEveningTime] = useState('20:00');
  const [terbinafineEnabled, setTerbinafineEnabled] = useState(false);
  const [picker, setPicker] = useState<'start' | 'morning' | 'evening' | null>(null);

  const canContinue = selectedDays.length === 3;

  const daySelectionHelp = useMemo(() => {
    if (selectedDays.length === 3) {
      return 'Locked in until day 22.';
    }
    return 'Pick exactly three wash days.';
  }, [selectedDays.length]);

  const onToggleDay = (dayIndex: number) => {
    setSelectedDays((prev) => {
      const exists = prev.includes(dayIndex);
      if (exists) {
        return prev.filter((day) => day !== dayIndex);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, dayIndex].sort();
    });
  };

  const handleTimeChange = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === 'dismissed' || !date) {
      setPicker(null);
      return;
    }
    const time = formatTime(date);
    if (picker === 'morning') {
      setMorningTime(time);
    }
    if (picker === 'evening') {
      setEveningTime(time);
    }
    if (picker === 'start') {
      setStartDate(date);
    }
    setPicker(null);
  };

  const handleCreate = async () => {
    try {
      const plan = {
        startDate: formatDateISO(startDate),
        nizoralDaysOfWeek: selectedDays,
        morningTime,
        eveningTime,
        terbinafineEnabled,
      };
      await createPlan(plan);
      const granted = await requestNotificationPermissions();
      if (granted) {
        await schedulePlanNotifications({
          ...plan,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      await logInfo('Plan created');
      await refresh();
      router.replace('/(tabs)');
    } catch (error) {
      await logError('Failed to create plan', error);
    }
  };

  return (
    <Screen scrollable>
      <View className="flex-1 pb-10">
        <AppText variant="title" className="mt-8">
          Hold keeps the plan simple.
        </AppText>
        <AppText variant="muted" className="mt-2">
          We start today. No waiting.
        </AppText>

        <View className="mt-8">
          <SectionHeader title="Start date" subtitle="Default is today." />
          <TimeField
            label="Start"
            value={formatDateISO(startDate)}
            onPress={() => setPicker('start')}
          />
        </View>

        <View className="mt-8">
          <SectionHeader title="Wash days" subtitle={daySelectionHelp} />
          <DayOfWeekPicker selectedDays={selectedDays} onToggle={onToggleDay} />
        </View>

        <View className="mt-8">
          <SectionHeader title="Reminder times" subtitle="Keep it steady." />
          <View>
            <TimeField
              label="Morning (terbinafine)"
              value={morningTime}
              onPress={() => setPicker('morning')}
            />
            <View className="mt-3">
              <TimeField
                label="Evening (wash)"
                value={eveningTime}
                onPress={() => setPicker('evening')}
              />
            </View>
          </View>
        </View>

        <View className="mt-8">
          <SectionHeader title="Terbinafine" subtitle="Turn it on when you have it." />
          <ToggleRow
            label="I have it"
            value={terbinafineEnabled}
            onChange={setTerbinafineEnabled}
          />
        </View>

        <View className="mt-8 rounded-2xl bg-sand px-5 py-4">
          <AppText variant="subtitle">No analysis until day 21.</AppText>
          <AppText variant="muted" className="mt-2">
            We keep the surface area tiny until the first three weeks are done.
          </AppText>
        </View>

        <View className="mt-8">
          <Button label="Create plan" onPress={handleCreate} disabled={!canContinue} />
        </View>
      </View>

      {picker ? (
        <DateTimePicker
          value={
            picker === 'start'
              ? startDate
              : parseTimeToDate(picker === 'morning' ? morningTime : eveningTime)
          }
          mode={picker === 'start' ? 'date' : 'time'}
          display="spinner"
          onChange={handleTimeChange}
        />
      ) : null}
    </Screen>
  );
}
