import { addDays, format, subDays } from 'date-fns';
import { formatDateKey, getTodayTasks } from '@/features/plan/domain/planService';
import { Plan, TaskType } from '@/features/plan/domain/types';
import {
  getCompletionsBetween,
  getCompletionsForDate,
  insertCompletion,
  removeCompletion,
} from '@/features/tasks/storage/completionRepository';

export const markComplete = async (date: string, taskType: TaskType, notes?: string) => {
  await insertCompletion(date, taskType, notes);
};

export const unmarkComplete = async (date: string, taskType: TaskType) => {
  await removeCompletion(date, taskType);
};

export const getCompletionSet = async (date: string): Promise<Set<TaskType>> => {
  const rows = await getCompletionsForDate(date);
  return new Set(rows.map((row) => row.taskType));
};

export const getCompletionRate = async (plan: Plan, start: Date, end: Date) => {
  const startKey = format(start, 'yyyy-MM-dd');
  const endKey = format(end, 'yyyy-MM-dd');
  const completions = await getCompletionsBetween(startKey, endKey);
  let totalDue = 0;
  let completed = 0;
  for (let cursor = new Date(start); cursor <= end; cursor = addDays(cursor, 1)) {
    const tasks = getTodayTasks(plan, cursor);
    totalDue += tasks.length;
    const dateKey = formatDateKey(cursor);
    const completedForDay = completions.filter((row) => row.date === dateKey).length;
    completed += completedForDay;
  }
  if (totalDue === 0) {
    return 0;
  }
  return Math.round((completed / totalDue) * 100);
};

export const wasLastWashMissed = async (plan: Plan, today: Date): Promise<boolean> => {
  const todayKey = formatDateKey(today);
  for (let offset = 1; offset <= 7; offset += 1) {
    const candidate = subDays(today, offset);
    if (plan.nizoralDaysOfWeek.includes(candidate.getDay())) {
      const candidateKey = formatDateKey(candidate);
      if (candidateKey === todayKey) {
        return false;
      }
      const completions = await getCompletionsForDate(candidateKey);
      return !completions.some((row) => row.taskType === 'NIZORAL_WASH');
    }
  }
  return false;
};
