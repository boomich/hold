import { getTodayTasks, canEditDaysOfWeek, isAnalysisUnlocked } from '../planRules';
import { Plan } from '../types';
import { parseISO } from 'date-fns';

describe('planRules', () => {
  const basePlan: Plan = {
    startDate: '2024-01-01',
    nizoralDaysOfWeek: [1, 3, 6],
    morningTime: '08:30',
    eveningTime: '20:00',
    terbinafineEnabled: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  it('returns tasks for a wash day with terbinafine enabled', () => {
    const monday = parseISO('2024-01-01');
    const tasks = getTodayTasks(basePlan, monday);
    const types = tasks.map((task) => task.taskType);
    expect(types).toContain('TERBINAFINE');
    expect(types).toContain('NIZORAL_WASH');
    expect(types).toContain('NIZORAL_LATHER');
  });

  it('skips terbinafine when disabled', () => {
    const plan = { ...basePlan, terbinafineEnabled: false };
    const monday = parseISO('2024-01-01');
    const tasks = getTodayTasks(plan, monday);
    expect(tasks.map((task) => task.taskType)).not.toContain('TERBINAFINE');
  });

  it('locks wash day edits until day 22', () => {
    const day21 = parseISO('2024-01-21');
    const day22 = parseISO('2024-01-22');
    expect(canEditDaysOfWeek(basePlan.startDate, day21)).toBe(false);
    expect(canEditDaysOfWeek(basePlan.startDate, day22)).toBe(true);
  });

  it('unlocks analysis on day 21', () => {
    const day20 = parseISO('2024-01-20');
    const day21 = parseISO('2024-01-21');
    expect(isAnalysisUnlocked(basePlan.startDate, day20)).toBe(false);
    expect(isAnalysisUnlocked(basePlan.startDate, day21)).toBe(true);
  });
});
