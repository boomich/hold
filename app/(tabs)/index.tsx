import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { AppText } from '../../src/components/AppText';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { SmallButton } from '../../src/components/SmallButton';
import { Banner } from '../../src/components/Banner';
import { usePlan } from '../../src/features/plan/PlanProvider';
import {
  getDayIndex,
  getNextWashDay,
  getTodayTasks,
  isScheduledWashDay,
} from '../../src/features/plan/domain/planRules';
import { formatDateISO, formatDayLabel, formatFriendlyDate } from '../../src/utils/date';
import {
  getCompletionsForDate,
  getCompletionsForRange,
  markComplete,
} from '../../src/features/completions/storage/completionRepository';
import { Task } from '../../src/features/plan/domain/types';
import { logError } from '../../src/features/logs/logService';
import {
  getNotificationPermissions,
} from '../../src/features/notifications/notificationsService';
import { subDays } from 'date-fns';

export default function Home() {
  const { plan } = usePlan();
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [missedWash, setMissedWash] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>(
    'undetermined'
  );

  const today = useMemo(() => new Date(), []);
  const todayISO = formatDateISO(today);

  const tasks = useMemo(() => (plan ? getTodayTasks(plan, today) : []), [plan, today]);
  const morningTasks = tasks.filter((task) => task.timeOfDay === 'morning');
  const eveningTasks = tasks.filter((task) => task.timeOfDay === 'evening');
  const latherTask = tasks.find((task) => task.taskType === 'NIZORAL_LATHER');

  const loadStatus = useCallback(async () => {
    if (!plan) {
      return;
    }
    try {
      const completions = await getCompletionsForDate(todayISO);
      setCompletedTasks(completions.map((item) => item.taskType));

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
  }, [plan, today, todayISO]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    getNotificationPermissions().then((status) => setPermissionStatus(status));
  }, []);

  const handleMark = async (task: Task) => {
    try {
      await markComplete(todayISO, task.taskType);
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

  const dayIndex = getDayIndex(plan.startDate, today);
  const nextWash = getNextWashDay(plan, today);
  const nextWashLabel = formatDayLabel(nextWash);

  return (
    <Screen>
      <View className="flex-1 pb-6">
        <View className="mt-6">
          <AppText variant="title">Day {dayIndex} of 30</AppText>
          <AppText variant="muted" className="mt-1">
            {formatFriendlyDate(today)}
          </AppText>
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
                label={completedTasks.includes(latherTask.taskType) ? 'Lather done' : 'Heel/fingers lather done'}
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
