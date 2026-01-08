import { canEditDaysOfWeek } from './planRules';
import { Plan } from './types';
import { getPlan, updatePlan } from '../storage/planRepository';

export type PlanUpdate = Partial<Pick<Plan, 'nizoralDaysOfWeek' | 'eveningTime' | 'morningTime' | 'terbinafineEnabled'>>;

export async function updatePlanWithRules(today: Date, updates: PlanUpdate) {
  const existing = await getPlan();
  if (!existing) {
    return null;
  }
  const allowDays = canEditDaysOfWeek(existing.startDate, today);
  const sanitized: PlanUpdate = { ...updates };
  if (!allowDays) {
    delete sanitized.nizoralDaysOfWeek;
  }
  return updatePlan(sanitized);
}
