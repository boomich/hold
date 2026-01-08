import { subDays } from 'date-fns';
import { fetchCheckInsBetween } from '@/features/checkin/domain/checkinService';
import { getCompletionRate } from '@/features/tasks/domain/completionService';
import { Plan } from '@/features/plan/domain/types';

export type ProgressPoint = {
  date: string;
  itchScore?: number | null;
  flakesScore?: number | null;
};

export const fetchProgress = async (plan: Plan, days = 30) => {
  const end = new Date();
  const start = subDays(end, days - 1);
  const checkIns = await fetchCheckInsBetween(start, end);
  const points: ProgressPoint[] = checkIns.map((item) => ({
    date: item.date,
    itchScore: item.itchScore,
    flakesScore: item.flakesScore,
  }));
  const completionRate = await getCompletionRate(plan, start, end);
  return { points, completionRate };
};
