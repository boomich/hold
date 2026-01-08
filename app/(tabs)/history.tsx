import { useEffect, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { AppText } from '../../src/components/AppText';
import { usePlan } from '../../src/features/plan/PlanProvider';
import { formatDateISO, formatFriendlyDate } from '../../src/utils/date';
import { getCompletionsForRange } from '../../src/features/completions/storage/completionRepository';
import { getCheckInsForRange } from '../../src/features/checkin/storage/checkinRepository';
import { getTodayTasks } from '../../src/features/plan/domain/planRules';
import { colors } from '../../src/design/tokens';
import { subDays } from 'date-fns';

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

        <FlatList
          data={days}
          keyExtractor={(item) => item.toISOString()}
          contentContainerStyle={{ paddingVertical: 16 }}
          renderItem={({ item }) => {
            const dateKey = formatDateISO(item);
            const tasks = getTodayTasks(plan, item);
            const completions = completionMap.get(dateKey) ?? new Set();
            const hasCheckin = checkinMap.get(dateKey) ?? false;
            const washDue = tasks.some((task) => task.taskType === 'NIZORAL_WASH');
            const terbDue = tasks.some((task) => task.taskType === 'TERBINAFINE');
            const latherDue = tasks.some((task) => task.taskType === 'NIZORAL_LATHER');

            const iconStyle = (completed: boolean, due: boolean) => {
              if (!due) {
                return colors.clay;
              }
              return completed ? colors.mossDark : colors.rose;
            };

            return (
              <View className="mb-3 rounded-2xl bg-surface px-4 py-3">
                <AppText variant="subtitle">{formatFriendlyDate(item)}</AppText>
                <View className="mt-2 flex-row items-center">
                  <View className="mr-4">
                    <Feather name="droplet" size={18} color={iconStyle(completions.has('NIZORAL_WASH'), washDue)} />
                  </View>
                  <View className="mr-4">
                    <Feather name="shield" size={18} color={iconStyle(completions.has('TERBINAFINE'), terbDue)} />
                  </View>
                  <View className="mr-4">
                    <Feather name="zap" size={18} color={iconStyle(completions.has('NIZORAL_LATHER'), latherDue)} />
                  </View>
                  <Feather name="message-circle" size={18} color={hasCheckin ? colors.mossDark : colors.clay} />
                </View>
              </View>
            );
          }}
        />
      </View>
    </Screen>
  );
}
