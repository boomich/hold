import { addDays, format, subDays } from 'date-fns';
import { getCheckInsBetween } from '@/features/checkin/storage/checkinRepository';
import { getCompletionsBetween } from '@/features/tasks/storage/completionRepository';
import { TaskType } from '@/features/plan/domain/types';

export type HistoryDay = {
  date: string;
  completions: TaskType[];
  hasCheckIn: boolean;
};

export const fetchHistory = async (days = 30): Promise<HistoryDay[]> => {
  const end = new Date();
  const start = subDays(end, days - 1);
  const startKey = format(start, 'yyyy-MM-dd');
  const endKey = format(end, 'yyyy-MM-dd');
  const completions = await getCompletionsBetween(startKey, endKey);
  const checkIns = await getCheckInsBetween(startKey, endKey);

  const checkInSet = new Set(checkIns.map((item) => item.date));

  const result: HistoryDay[] = [];
  for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) {
    const key = format(cursor, 'yyyy-MM-dd');
    const completed = completions.filter((row) => row.date === key).map((row) => row.taskType);
    result.push({
      date: key,
      completions: completed,
      hasCheckIn: checkInSet.has(key),
    });
  }
  return result.reverse();
};
