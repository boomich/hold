import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Card } from '@/shared/ui/Card';
import { Screen } from '@/shared/ui/Screen';
import { Text } from '@/shared/ui/Text';
import { Button } from '@/shared/ui/Button';
import { Banner } from '@/shared/ui/Banner';
import { useAppState } from '@/providers/AppProvider';
import { formatDateKey, getNextWashDayLabel, getTodayTasks } from '@/features/plan/domain/planService';
import { TaskDue, TaskType } from '@/features/plan/domain/types';
import { getCompletionSet, markComplete, wasLastWashMissed } from '@/features/tasks/domain/completionService';
import { getNotificationPermissionStatus, openNotificationSettings } from '@/features/notifications/domain/notificationService';
import { logError } from '@/features/logs/domain/logService';

const taskLabels: Record<TaskType, string> = {
  NIZORAL_WASH: 'Nizoral wash (scalp + beard)',
  NIZORAL_LATHER: 'Heel/finger lather',
  TERBINAFINE: 'Terbinafine cream',
};

export const HomeScreen = () => {
  const router = useRouter();
  const { plan, dayIndex } = useAppState();
  const [completionSet, setCompletionSet] = useState<Set<TaskType>>(new Set());
  const [missedWash, setMissedWash] = useState(false);
  const [notificationsDenied, setNotificationsDenied] = useState(false);

  const loadStatus = useCallback(async () => {
    if (!plan) {
      return;
    }
    try {
      const todayKey = formatDateKey(new Date());
      const completions = await getCompletionSet(todayKey);
      setCompletionSet(completions);
      const missed = await wasLastWashMissed(plan, new Date());
      setMissedWash(missed);
      const permission = await getNotificationPermissionStatus();
      setNotificationsDenied(permission.status !== 'granted');
    } catch (error) {
      await logError(`Failed to load home status: ${String(error)}`);
    }
  }, [plan]);

  useFocusEffect(
    useCallback(() => {
      loadStatus();
    }, [loadStatus])
  );

  if (!plan || dayIndex === null) {
    return (
      <Screen>
        <View className="pt-8">
          <Text variant="body">Loading your plan...</Text>
        </View>
      </Screen>
    );
  }

  const todayTasks = getTodayTasks(plan, new Date());
  const morningTasks = todayTasks.filter((task) => task.slot === 'morning');
  const eveningTasks = todayTasks.filter((task) => task.slot === 'evening');
  const todayKey = formatDateKey(new Date());
  const hasScheduledTasks = morningTasks.length > 0 || eveningTasks.length > 0;

  const renderTaskCard = (title: string, tasks: TaskDue[]) => {
    if (!tasks.length) {
      return null;
    }
    const task = tasks[0];
    const isDone = completionSet.has(task.taskType);
    return (
      <Card className="gap-4">
        <View className="gap-1">
          <Text variant="h3">{title}</Text>
          <Text variant="small">
            {task.time} · {taskLabels[task.taskType]}
          </Text>
        </View>
        <Button
          label={isDone ? 'Done today' : 'Mark done'}
          variant={isDone ? 'secondary' : 'primary'}
          onPress={async () => {
            try {
              await markComplete(todayKey, task.taskType);
              await loadStatus();
            } catch (error) {
              await logError(`Failed to mark task: ${String(error)}`);
            }
          }}
        />
      </Card>
    );
  };

  return (
    <Screen>
      <View className="gap-6 pt-6">
        <View className="gap-1">
          <Text variant="title">Day {dayIndex} of 30</Text>
          <Text variant="small" className="text-muted">
            Focus on today. Keep it small.
          </Text>
        </View>

        {notificationsDenied && (
          <Banner
            title="Turn on reminders"
            body="Notifications are off. Enable them to keep the plan gentle and steady."
            actionLabel="Open settings"
            onPress={openNotificationSettings}
          />
        )}

        {renderTaskCard('Morning', morningTasks)}
        {renderTaskCard('Evening', eveningTasks)}
        {!hasScheduledTasks && (
          <Card className="gap-2">
            <Text variant="h3">No scheduled tasks</Text>
            <Text variant="small">Use quick actions if you do anything extra today.</Text>
          </Card>
        )}

        <Card className="gap-3">
          <Text variant="h3">Quick actions</Text>
          <View className="gap-2">
            <Button
              label="Heel/fingers lather done"
              variant={completionSet.has('NIZORAL_LATHER') ? 'secondary' : 'ghost'}
              onPress={async () => {
                try {
                  await markComplete(todayKey, 'NIZORAL_LATHER');
                  await loadStatus();
                } catch (error) {
                  await logError(`Failed to mark lather: ${String(error)}`);
                }
              }}
            />
            <Button
              label="Add 10-sec note"
              variant="ghost"
              onPress={() => router.push('/(tabs)/check-in')}
            />
          </View>
        </Card>

        <Card className="gap-2">
          <Text variant="h3">Next scheduled wash</Text>
          <Text variant="body">{getNextWashDayLabel(plan, new Date())}</Text>
          {missedWash && (
            <Text variant="small" className="text-muted">
              Resume at the next scheduled wash day.
            </Text>
          )}
        </Card>
      </View>
    </Screen>
  );
};
