import { useEffect, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { AppText } from '../../src/components/AppText';
import { usePlan } from '../../src/features/plan/PlanProvider';
import { formatDateISO, formatFriendlyDate } from '../../src/utils/date';
import { getCompletionsForRange } from '../../src/features/completions/storage/completionRepository';
import { getCheckInsForRange } from '../../src/features/checkin/storage/checkinRepository';
import { getTodayTasks, getTaskLabel } from '../../src/features/plan/domain/planRules';
import { colors } from '../../src/design/tokens';
import { subDays, isToday } from 'date-fns';
import { TaskType } from '../../src/features/plan/domain/types';

type TaskStatus = 'completed' | 'missed' | 'not_due';

function TaskRow({ label, status }: { label: string; status: TaskStatus }) {
  const iconName =
    status === 'completed' ? 'check-circle' : status === 'missed' ? 'circle' : 'minus';
  const iconColor =
    status === 'completed' ? colors.mossDark : status === 'missed' ? colors.rose : colors.clay;
  const textColor = status === 'not_due' ? 'text-clay' : '';

  return (
    <View className="flex-row items-center py-1">
      <Feather name={iconName} size={16} color={iconColor} />
      <AppText variant="body" className={`ml-2 ${textColor}`}>
        {label}
      </AppText>
    </View>
  );
}

function DayCard({
  date,
  tasks,
  completions,
  hasCheckin,
}: {
  date: Date;
  tasks: { taskType: TaskType; label: string }[];
  completions: Set<string>;
  hasCheckin: boolean;
}) {
  const isCurrentDay = isToday(date);

  const getTaskStatus = (taskType: TaskType, isDue: boolean): TaskStatus => {
    if (!isDue) return 'not_due';
    return completions.has(taskType) ? 'completed' : 'missed';
  };

  const washDue = tasks.some((t) => t.taskType === 'NIZORAL_WASH');
  const terbDue = tasks.some((t) => t.taskType === 'TERBINAFINE');
  const latherDue = tasks.some((t) => t.taskType === 'NIZORAL_LATHER');

  const completedCount = [
    washDue && completions.has('NIZORAL_WASH'),
    terbDue && completions.has('TERBINAFINE'),
    latherDue && completions.has('NIZORAL_LATHER'),
  ].filter(Boolean).length;

  const dueCount = [washDue, terbDue, latherDue].filter(Boolean).length;
  const allComplete = completedCount === dueCount && dueCount > 0;

  return (
    <View className={`mb-3 rounded-2xl px-4 py-3 ${isCurrentDay ? 'bg-sand' : 'bg-surface'}`}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <AppText variant="subtitle">{formatFriendlyDate(date)}</AppText>
          {isCurrentDay && (
            <View className="ml-2 rounded-full bg-moss px-2 py-0.5">
              <AppText variant="caption" className="text-surface">
                Today
              </AppText>
            </View>
          )}
        </View>
        {allComplete && <Feather name="award" size={18} color={colors.sun} />}
      </View>

      <View className="mt-3">
        {terbDue && (
          <TaskRow
            label={getTaskLabel('TERBINAFINE')}
            status={getTaskStatus('TERBINAFINE', terbDue)}
          />
        )}
        <TaskRow
          label={getTaskLabel('NIZORAL_WASH')}
          status={getTaskStatus('NIZORAL_WASH', washDue)}
        />
        <TaskRow
          label={getTaskLabel('NIZORAL_LATHER')}
          status={getTaskStatus('NIZORAL_LATHER', latherDue)}
        />
      </View>

      {hasCheckin && (
        <View className="mt-2 flex-row items-center border-t border-clay/30 pt-2">
          <Feather name="message-circle" size={14} color={colors.moss} />
          <AppText variant="caption" className="ml-1.5 text-moss">
            Check-in logged
          </AppText>
        </View>
      )}
    </View>
  );
}

export default function History() {
  const { plan } = usePlan();
  const [completionMap, setCompletionMap] = useState<Map<string, Set<string>>>(new Map());
  const [checkinMap, setCheckinMap] = useState<Map<string, boolean>>(new Map());

  const today = useMemo(() => new Date(), []);
  const days = useMemo(() => {
    return Array.from({ length: 30 }, (_, index) => subDays(today, index));
  }, [today]);

  useEffect(() => {
    if (!plan) {
      return;
    }
    const start = formatDateISO(subDays(today, 29));
    const end = formatDateISO(today);
    getCompletionsForRange(start, end).then((items) => {
      const map = new Map<string, Set<string>>();
      items.forEach((item) => {
        if (!map.has(item.date)) {
          map.set(item.date, new Set());
        }
        map.get(item.date)?.add(item.taskType);
      });
      setCompletionMap(map);
    });
    getCheckInsForRange(start, end).then((items) => {
      const map = new Map<string, boolean>();
      items.forEach((item) => map.set(item.date, true));
      setCheckinMap(map);
    });
  }, [plan, today]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!plan) return null;
    let totalDue = 0;
    let totalCompleted = 0;
    let perfectDays = 0;

    days.forEach((date) => {
      const dateKey = formatDateISO(date);
      const tasks = getTodayTasks(plan, date);
      const completions = completionMap.get(dateKey) ?? new Set();

      const washDue = tasks.some((t) => t.taskType === 'NIZORAL_WASH');
      const terbDue = tasks.some((t) => t.taskType === 'TERBINAFINE');
      const latherDue = tasks.some((t) => t.taskType === 'NIZORAL_LATHER');

      const dayDue = [washDue, terbDue, latherDue].filter(Boolean).length;
      const dayCompleted = [
        washDue && completions.has('NIZORAL_WASH'),
        terbDue && completions.has('TERBINAFINE'),
        latherDue && completions.has('NIZORAL_LATHER'),
      ].filter(Boolean).length;

      totalDue += dayDue;
      totalCompleted += dayCompleted;
      if (dayCompleted === dayDue && dayDue > 0) {
        perfectDays += 1;
      }
    });

    const adherenceRate = totalDue > 0 ? Math.round((totalCompleted / totalDue) * 100) : 0;
    return { adherenceRate, perfectDays };
  }, [plan, days, completionMap]);

  if (!plan) {
    return (
      <Screen>
        <AppText variant="subtitle" className="mt-10">
          Loading history...
        </AppText>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="flex-1 pb-6">
        <AppText variant="title" className="mt-6">
          History
        </AppText>
        <AppText variant="muted" className="mt-1">
          Last 30 days at a glance.
        </AppText>

        {stats && (
          <View className="mt-4 flex-row">
            <View className="mr-3 flex-1 rounded-xl bg-surface px-3 py-3">
              <AppText variant="caption" className="text-inkMuted">
                Adherence
              </AppText>
              <AppText variant="title" className="text-moss">
                {stats.adherenceRate}%
              </AppText>
            </View>
            <View className="flex-1 rounded-xl bg-surface px-3 py-3">
              <AppText variant="caption" className="text-inkMuted">
                Perfect days
              </AppText>
              <AppText variant="title" className="text-moss">
                {stats.perfectDays}
              </AppText>
            </View>
          </View>
        )}

        <FlatList
          data={days}
          keyExtractor={(item) => item.toISOString()}
          contentContainerStyle={{ paddingVertical: 16 }}
          renderItem={({ item }) => {
            const dateKey = formatDateISO(item);
            const tasks = getTodayTasks(plan, item);
            const completions = completionMap.get(dateKey) ?? new Set();
            const hasCheckin = checkinMap.get(dateKey) ?? false;

            return (
              <DayCard
                date={item}
                tasks={tasks}
                completions={completions}
                hasCheckin={hasCheckin}
              />
            );
          }}
        />
      </View>
    </Screen>
  );
}
