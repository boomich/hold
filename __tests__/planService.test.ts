import { addDays } from 'date-fns';
import { getTodayTasks, isPlanLocked } from '@/features/plan/domain/planService';
import { Plan } from '@/features/plan/domain/types';

const basePlan: Plan = {
  startDate: '2024-01-01',
  nizoralDaysOfWeek: [1, 3, 6],
  eveningTime: '20:00',
  morningTime: '08:30',
  terbinafineEnabled: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('getTodayTasks', () => {
  it('returns morning terbinafine and evening wash when scheduled', () => {
    const monday = new Date('2024-01-01T12:00:00.000Z');
    const tasks = getTodayTasks(basePlan, monday);
    expect(tasks).toHaveLength(2);
    expect(tasks.find((task) => task.taskType === 'TERBINAFINE')).toBeTruthy();
    expect(tasks.find((task) => task.taskType === 'NIZORAL_WASH')).toBeTruthy();
  });

  it('returns only evening wash when terbinafine disabled', () => {
    const plan = { ...basePlan, terbinafineEnabled: false };
    const monday = new Date('2024-01-01T12:00:00.000Z');
    const tasks = getTodayTasks(plan, monday);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].taskType).toBe('NIZORAL_WASH');
  });
});

describe('isPlanLocked', () => {
  it('locks changes through day 21', () => {
    const day21 = addDays(new Date('2024-01-01T00:00:00.000Z'), 20);
    expect(isPlanLocked('2024-01-01', day21)).toBe(true);
  });

  it('unlocks on day 22', () => {
    const day22 = addDays(new Date('2024-01-01T00:00:00.000Z'), 21);
    expect(isPlanLocked('2024-01-01', day22)).toBe(false);
  });
});
