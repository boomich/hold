import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';
import { Plan, TaskDue } from '@/features/plan/domain/types';
import { getPlan, insertPlan, updatePlan } from '@/features/plan/storage/planRepository';

export type PlanInput = {
  startDate: string;
  nizoralDaysOfWeek: number[];
  eveningTime: string;
  morningTime: string;
  terbinafineEnabled: boolean;
};

export const DEFAULT_NIZORAL_DAYS = [1, 3, 6];

export const getDayIndex = (startDate: string, today: Date): number => {
  const start = parseISO(startDate);
  return differenceInCalendarDays(today, start) + 1;
};

export const isPlanLocked = (startDate: string, today: Date): boolean => {
  return getDayIndex(startDate, today) <= 21;
};

export const normalizeDaysOfWeek = (days: number[]): number[] => {
  const unique = Array.from(new Set(days)).filter((day) => day >= 0 && day <= 6);
  return unique.sort((a, b) => a - b);
};

export const createPlan = async (input: PlanInput): Promise<Plan> => {
  const now = new Date().toISOString();
  const plan: Plan = {
    ...input,
    nizoralDaysOfWeek: normalizeDaysOfWeek(input.nizoralDaysOfWeek),
    createdAt: now,
    updatedAt: now,
  };
  await insertPlan(plan);
  return plan;
};

export const getExistingPlan = async (): Promise<Plan | null> => getPlan();

export const updatePlanWithRules = async (
  updates: Partial<PlanInput>,
  today: Date
): Promise<Plan> => {
  const current = await getPlan();
  if (!current) {
    throw new Error('Plan not found');
  }
  const locked = isPlanLocked(current.startDate, today);
  if (locked && updates.nizoralDaysOfWeek) {
    throw new Error('Plan days are locked until day 22.');
  }
  if (locked && updates.startDate) {
    throw new Error('Start date is locked until day 22.');
  }
  const nextUpdates: Partial<Plan> = {
    ...updates,
  };
  if (updates.nizoralDaysOfWeek) {
    nextUpdates.nizoralDaysOfWeek = normalizeDaysOfWeek(updates.nizoralDaysOfWeek);
  }
  return updatePlan(nextUpdates);
};

export const getTodayTasks = (plan: Plan, today: Date): TaskDue[] => {
  const dayOfWeek = today.getDay();
  const tasks: TaskDue[] = [];
  if (plan.terbinafineEnabled) {
    tasks.push({
      taskType: 'TERBINAFINE',
      slot: 'morning',
      time: plan.morningTime,
    });
  }
  if (plan.nizoralDaysOfWeek.includes(dayOfWeek)) {
    tasks.push({
      taskType: 'NIZORAL_WASH',
      slot: 'evening',
      time: plan.eveningTime,
    });
  }
  return tasks;
};

export const getNextWashDayLabel = (plan: Plan, today: Date): string => {
  for (let offset = 0; offset < 7; offset += 1) {
    const candidate = addDays(today, offset);
    if (plan.nizoralDaysOfWeek.includes(candidate.getDay())) {
      return format(candidate, 'EEE');
    }
  }
  return 'Soon';
};

export const formatDateKey = (date: Date): string => format(date, 'yyyy-MM-dd');
