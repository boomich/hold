import { getDb } from '@/storage/database';
import { Plan } from '@/features/plan/domain/types';

const PLAN_ID = 1;

const rowToPlan = (row: any): Plan => ({
  startDate: row.startDate,
  nizoralDaysOfWeek: row.nizoralDaysOfWeek.split(',').map((value: string) => Number(value)),
  eveningTime: row.eveningTime,
  morningTime: row.morningTime,
  terbinafineEnabled: Boolean(row.terbinafineEnabled),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export const getPlan = async (): Promise<Plan | null> => {
  const db = await getDb();
  const rows = await db.getAllAsync<any>('SELECT * FROM plan WHERE id = ? LIMIT 1', PLAN_ID);
  if (!rows.length) {
    return null;
  }
  return rowToPlan(rows[0]);
};

export const insertPlan = async (plan: Plan) => {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO plan
      (id, startDate, nizoralDaysOfWeek, eveningTime, morningTime, terbinafineEnabled, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    PLAN_ID,
    plan.startDate,
    plan.nizoralDaysOfWeek.join(','),
    plan.eveningTime,
    plan.morningTime,
    plan.terbinafineEnabled ? 1 : 0,
    plan.createdAt,
    plan.updatedAt
  );
};

export const updatePlan = async (updates: Partial<Plan>) => {
  const db = await getDb();
  const current = await getPlan();
  if (!current) {
    throw new Error('Plan not found');
  }
  const next: Plan = {
    ...current,
    ...updates,
    nizoralDaysOfWeek: updates.nizoralDaysOfWeek ?? current.nizoralDaysOfWeek,
    updatedAt: new Date().toISOString(),
  };
  await db.runAsync(
    `UPDATE plan
      SET startDate = ?,
          nizoralDaysOfWeek = ?,
          eveningTime = ?,
          morningTime = ?,
          terbinafineEnabled = ?,
          updatedAt = ?
      WHERE id = ?
    `,
    next.startDate,
    next.nizoralDaysOfWeek.join(','),
    next.eveningTime,
    next.morningTime,
    next.terbinafineEnabled ? 1 : 0,
    next.updatedAt,
    PLAN_ID
  );
  return next;
};
