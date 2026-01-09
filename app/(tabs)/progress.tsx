import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { AppText } from '../../src/components/AppText';
import { Card } from '../../src/components/Card';
import { LineChart } from '../../src/components/LineChart';
import { usePlan } from '../../src/features/plan/PlanProvider';
import {
  getDayIndex,
  getTodayTasks,
  isAnalysisUnlocked,
} from '../../src/features/plan/domain/planRules';
import { formatDateISO } from '../../src/utils/date';
import { getCheckInsForRange } from '../../src/features/checkin/storage/checkinRepository';
import { getCompletionsForRange } from '../../src/features/completions/storage/completionRepository';
import { subDays } from 'date-fns';
import { colors } from '../../src/design/tokens';

export default function Progress() {
  const { plan } = usePlan();
  const [itchSeries, setItchSeries] = useState<number[]>([]);
  const [flakesSeries, setFlakesSeries] = useState<number[]>([]);
  const [completionSeries, setCompletionSeries] = useState<number[]>([]);

  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    if (!plan) {
      return;
    }
    const load = async () => {
      const start = formatDateISO(subDays(today, 29));
      const end = formatDateISO(today);
      const checkins = await getCheckInsForRange(start, end);
      const completions = await getCompletionsForRange(start, end);

      const checkinMap = new Map(checkins.map((item) => [item.date, item]));
      const completionMap = new Map<string, Set<string>>();
      completions.forEach((entry) => {
        if (!completionMap.has(entry.date)) {
          completionMap.set(entry.date, new Set());
        }
        completionMap.get(entry.date)?.add(entry.taskType);
      });

      const itch: number[] = [];
      const flakes: number[] = [];
      const completionRates: number[] = [];

      for (let offset = 29; offset >= 0; offset -= 1) {
        const date = subDays(today, offset);
        const dateKey = formatDateISO(date);
        const checkin = checkinMap.get(dateKey);
        if (typeof checkin?.itchScore === 'number') {
          itch.push(checkin.itchScore);
        }
        if (typeof checkin?.flakesScore === 'number') {
          flakes.push(checkin.flakesScore);
        }

        const tasks = getTodayTasks(plan, date).filter(
          (task) => task.taskType !== 'NIZORAL_LATHER'
        );
        const dueCount = tasks.length;
        const completedSet = completionMap.get(dateKey) ?? new Set();
        const done = tasks.filter((task) => completedSet.has(task.taskType)).length;
        const rate = dueCount > 0 ? Math.round((done / dueCount) * 100) : 0;
        completionRates.push(rate);
      }

      setItchSeries(itch);
      setFlakesSeries(flakes);
      setCompletionSeries(completionRates);
    };

    load();
  }, [plan, today]);

  if (!plan) {
    return (
      <Screen>
        <AppText variant="subtitle" className="mt-10">
          Loading progress...
        </AppText>
      </Screen>
    );
  }

  const unlocked = isAnalysisUnlocked(plan.startDate, today);
  const dayIndex = getDayIndex(plan.startDate, today);

  if (!unlocked) {
    return (
      <Screen>
        <View className="flex-1 justify-center">
          <Card>
            <AppText variant="subtitle">Progress unlocks on day 21.</AppText>
            <AppText variant="muted" className="mt-2">
              You are on day {dayIndex}. Keep it simple and steady.
            </AppText>
          </Card>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scrollable>
      <View className="flex-1 pb-6">
        <AppText variant="title" className="mt-6">
          Progress
        </AppText>
        <AppText variant="muted" className="mt-1">
          A calm look at the last month.
        </AppText>

        <View className="mt-6">
          <AppText variant="subtitle">Itch trend</AppText>
          <LineChart data={itchSeries} stroke={colors.mossDark} />
          {itchSeries.length < 2 ? (
            <AppText variant="muted" className="mt-2">
              Add two check-ins to see the itch trend.
            </AppText>
          ) : null}
        </View>

        <View className="mt-5">
          <AppText variant="subtitle">Flakes trend</AppText>
          <LineChart data={flakesSeries} stroke={colors.rose} />
          {flakesSeries.length < 2 ? (
            <AppText variant="muted" className="mt-2">
              Add two check-ins to see the flakes trend.
            </AppText>
          ) : null}
        </View>

        <View className="mt-5">
          <AppText variant="subtitle">Completion rate</AppText>
          <LineChart data={completionSeries} stroke={colors.moss} />
          <AppText variant="muted" className="mt-2">
            Based on scheduled wash + terbinafine.
          </AppText>
        </View>
      </View>
    </Screen>
  );
}
