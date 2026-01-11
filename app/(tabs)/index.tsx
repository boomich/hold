import { useCallback, useEffect, useMemo, useState } from 'react';

import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Linking, View, Pressable } from 'react-native';
import { subDays, addDays, parseISO, isBefore, isAfter, startOfDay } from 'date-fns';

import { Card } from '../../src/components/Card';
import { colors } from '../../src/design/tokens';
import { Screen } from '../../src/components/Screen';
import { Button } from '../../src/components/Button';
import { Banner } from '../../src/components/Banner';
import { AppText } from '../../src/components/AppText';
import { Task } from '../../src/features/plan/domain/types';
import { logError } from '../../src/features/logs/logService';
import { usePlan } from '../../src/features/plan/PlanProvider';
import { SmallButton } from '../../src/components/SmallButton';
import { formatDateISO, formatDayLabel, formatFriendlyDate } from '../../src/utils/date';
import { getNotificationPermissions } from '../../src/features/notifications/notificationsService';

import {
  markComplete,
  getCompletionsForDate,
  getCompletionsForRange,
} from '../../src/features/completions/storage/completionRepository';

import {
  getDayIndex,
  getTodayTasks,
  getNextWashDay,
  isScheduledWashDay,
} from '../../src/features/plan/domain/planRules';

export default function Home() {
  const { plan } = usePlan();
  const [missedWash, setMissedWash] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>(
    'undetermined'
  );
  // Normalize today to start of day for consistent comparisons
  const today = useMemo(() => startOfDay(new Date()), []);
  const todayISO = formatDateISO(today);

  // Initialize selectedDate normalized to start of day
  const [selectedDate, setSelectedDate] = useState<Date>(() => startOfDay(new Date()));
  const selectedDateISO = formatDateISO(selectedDate);

  // Calculate plan boundaries - normalize to start of day
  const planStartDate = useMemo(() => {
    if (!plan) return null;
    return startOfDay(parseISO(plan.startDate));
  }, [plan]);

  // Normalize selectedDate for comparisons
  const normalizedSelectedDate = useMemo(() => startOfDay(selectedDate), [selectedDate]);

  const canGoBack = useMemo(() => {
    if (!planStartDate) return false;
    // Can go back only if selected date is after plan start date (not equal)
    return isAfter(normalizedSelectedDate, planStartDate);
  }, [normalizedSelectedDate, planStartDate]);

  const canGoForward = useMemo(() => {
    // Can go forward only if selected date is before today (not equal to or after)
    return isBefore(normalizedSelectedDate, today);
  }, [normalizedSelectedDate, today]);

  const handlePreviousDay = () => {
    if (canGoBack) {
      setSelectedDate((prev) => startOfDay(subDays(prev, 1)));
    }
  };

  const handleNextDay = () => {
    if (canGoForward) {
      setSelectedDate((prev) => startOfDay(addDays(prev, 1)));
    }
  };

  const handleToday = () => {
    setSelectedDate(today);
  };

  const tasks = useMemo(
    () => (plan ? getTodayTasks(plan, normalizedSelectedDate) : []),
    [plan, normalizedSelectedDate]
  );
  const morningTasks = tasks.filter((task) => task.timeOfDay === 'morning');
  const eveningTasks = tasks.filter((task) => task.timeOfDay === 'evening');
  const latherTask = tasks.find((task) => task.taskType === 'NIZORAL_LATHER');

  const loadStatus = useCallback(async () => {
    if (!plan) return;

    try {
      const completions = await getCompletionsForDate(selectedDateISO);
      setCompletedTasks(completions.map((item) => item.taskType));

      // Check missed wash from today's perspective (not selected date)
      const rangeStart = formatDateISO(subDays(today, 7));
      const rangeCompletions = await getCompletionsForRange(rangeStart, todayISO);
      const completionMap = new Map<string, Set<string>>();
      rangeCompletions.forEach((entry) => {
        if (!completionMap.has(entry.date)) {
          completionMap.set(entry.date, new Set());
        }
        completionMap.get(entry.date)?.add(entry.taskType);
      });

      let missed = false;
      for (let offset = 1; offset <= 7; offset += 1) {
        const candidate = subDays(today, offset);
        if (isScheduledWashDay(plan, candidate)) {
          const candidateISO = formatDateISO(candidate);
          const tasksDone = completionMap.get(candidateISO);
          if (!tasksDone || !tasksDone.has('NIZORAL_WASH')) {
            missed = true;
          }
          break;
        }
      }
      setMissedWash(missed);
    } catch (error) {
      await logError('Failed to load completion status', error);
    }
  }, [plan, selectedDateISO, today, todayISO]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    getNotificationPermissions().then((status) => setPermissionStatus(status));
  }, []);

  const handleMark = async (task: Task) => {
    try {
      await markComplete(selectedDateISO, task.taskType);
      await loadStatus();
    } catch (error) {
      await logError('Failed to mark complete', error);
    }
  };

  if (!plan) {
    return (
      <Screen>
        <AppText variant="subtitle" className="mt-10">
          Loading your plan...
        </AppText>
      </Screen>
    );
  }

  const dayIndex = getDayIndex(plan.startDate, normalizedSelectedDate);
  const nextWash = getNextWashDay(plan, today);
  const nextWashLabel = formatDayLabel(nextWash);
  // Compare against actual current date (not memoized) for reliable "today" detection
  const actualTodayISO = formatDateISO(startOfDay(new Date()));
  const isViewingToday = selectedDateISO === actualTodayISO;
  const isViewingPast = isBefore(normalizedSelectedDate, today);

  return (
    <Screen scrollable>
      <View className="flex-1 pb-6">
        <View className="mt-6">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <AppText variant="title">Day {dayIndex} of 30</AppText>
              <AppText variant="muted" className="mt-1">
                {formatFriendlyDate(selectedDate)}
              </AppText>
            </View>
            {isViewingToday && (
              <Pressable onPress={handleToday} className="rounded-full bg-sand px-3 py-1.5">
                <AppText variant="caption" className="text-ink">
                  Today
                </AppText>
              </Pressable>
            )}
          </View>

          {/* Date Navigation */}
          <View className="mt-4 flex-row items-center justify-between rounded-xl bg-surface px-4 py-3">
            <Pressable
              onPress={handlePreviousDay}
              disabled={!canGoBack}
              className={`rounded-lg p-2 ${!canGoBack ? 'opacity-30' : ''}`}>
              <Feather name="chevron-left" size={20} color={canGoBack ? colors.ink : colors.clay} />
            </Pressable>

            <View className="flex-1 items-center">
              {isViewingPast && (
                <AppText variant="caption" className="text-inkMuted">
                  Viewing past day
                </AppText>
              )}
            </View>

            <Pressable
              onPress={handleNextDay}
              disabled={!canGoForward}
              className={`rounded-lg p-2 ${!canGoForward ? 'opacity-30' : ''}`}>
              <Feather
                name="chevron-right"
                size={20}
                color={canGoForward ? colors.ink : colors.clay}
              />
            </Pressable>
          </View>
        </View>

        {permissionStatus === 'denied' ? (
          <View className="mt-4">
            <Banner
              message="Notifications are off. Turn them on when you are ready."
              actionLabel="Enable"
              onAction={() => Linking.openSettings()}
            />
          </View>
        ) : null}

        <View className="mt-6">
          {morningTasks.length > 0 ? (
            <Card>
              <AppText variant="subtitle">Morning</AppText>
              {morningTasks.map((task) => (
                <View key={task.taskType} className="mt-3">
                  <AppText>{task.label}</AppText>
                  <AppText variant="muted" className="mt-1">
                    {task.scheduledTime}
                  </AppText>
                  <View className="mt-3">
                    <Button
                      onPress={() => handleMark(task)}
                      label={completedTasks.includes(task.taskType) ? 'Done' : 'Mark done'}
                      disabled={completedTasks.includes(task.taskType)}
                    />
                  </View>
                </View>
              ))}
            </Card>
          ) : null}
        </View>

        <View className="mt-4">
          {eveningTasks.length > 0 ? (
            <Card>
              <AppText variant="subtitle">Evening</AppText>
              {eveningTasks.map((task) => (
                <View key={task.taskType} className="mt-3">
                  <AppText>{task.label}</AppText>
                  <AppText variant="muted" className="mt-1">
                    {task.scheduledTime}
                  </AppText>
                  <View className="mt-3">
                    <Button
                      label={completedTasks.includes(task.taskType) ? 'Done' : 'Mark done'}
                      onPress={() => handleMark(task)}
                      disabled={completedTasks.includes(task.taskType)}
                    />
                  </View>
                </View>
              ))}
            </Card>
          ) : null}
        </View>

        <View className="mt-4 flex-row flex-wrap">
          {latherTask ? (
            <View className="mb-2 mr-2">
              <SmallButton
                label={
                  completedTasks.includes(latherTask.taskType)
                    ? 'Lather done'
                    : 'Heel/fingers lather done'
                }
                onPress={() => handleMark(latherTask)}
              />
            </View>
          ) : null}
          <View className="mb-2 mr-2">
            <SmallButton label="Add 10-sec note" onPress={() => router.push('/checkin')} />
          </View>
        </View>

        <View className="mt-5">
          <AppText variant="muted">Next scheduled wash: {nextWashLabel}</AppText>
          {missedWash ? (
            <AppText variant="muted" className="mt-1">
              Resume at the next scheduled wash day.
            </AppText>
          ) : null}
        </View>
      </View>
    </Screen>
  );
}
