import { formatISO } from 'date-fns';
import { getDb } from '../../../storage/database';
import { Plan } from '../domain/types';

const PLAN_ID = 1;

type PlanRow = {
  id: number;
  startDate: string;
  nizoralDaysOfWeek: string;
  eveningTime: string;
  morningTime: string;
  terbinafineEnabled: number;
  createdAt: string;
  updatedAt: string;
};

function mapRow(row: PlanRow): Plan {
  return {
    startDate: row.startDate,
    nizoralDaysOfWeek: JSON.parse(row.nizoralDaysOfWeek),
    eveningTime: row.eveningTime,
    morningTime: row.morningTime,
    terbinafineEnabled: Boolean(row.terbinafineEnabled),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getPlan(): Promise<Plan | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<PlanRow>('SELECT * FROM plan WHERE id = ?', [PLAN_ID]);
  return row ? mapRow(row) : null;
}

export async function createPlan(plan: Omit<Plan, 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  const now = formatISO(new Date());
  await db.runAsync(
    `INSERT OR REPLACE INTO plan
    (id, startDate, nizoralDaysOfWeek, eveningTime, morningTime, terbinafineEnabled, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ,
    [
      PLAN_ID,
      plan.startDate,
      JSON.stringify(plan.nizoralDaysOfWeek),
      plan.eveningTime,
      plan.morningTime,
      plan.terbinafineEnabled ? 1 : 0,
      now,
      now,
    ]
  );
}

export async function updatePlan(partial: Partial<Plan>) {
  const existing = await getPlan();
  if (!existing) {
    return null;
  }
  const db = await getDb();
  const updated: Plan = {
    ...existing,
    ...partial,
    updatedAt: formatISO(new Date()),
  };
  await db.runAsync(
    `UPDATE plan SET startDate = ?, nizoralDaysOfWeek = ?, eveningTime = ?, morningTime = ?, terbinafineEnabled = ?, updatedAt = ? WHERE id = ?`,
    [
      updated.startDate,
      JSON.stringify(updated.nizoralDaysOfWeek),
      updated.eveningTime,
      updated.morningTime,
      updated.terbinafineEnabled ? 1 : 0,
      updated.updatedAt,
      PLAN_ID,
    ]
  );
  return updated;
}
