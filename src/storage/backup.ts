import { getDb } from './database';
import { getPlan } from '../features/plan/storage/planRepository';
import { Completion, getCompletionsForRange } from '../features/completions/storage/completionRepository';
import { CheckIn, getCheckInsForRange } from '../features/checkin/storage/checkinRepository';
import { format, subDays } from 'date-fns';

export type BackupPayload = {
  exportedAt: string;
  plan: Awaited<ReturnType<typeof getPlan>>;
  completions: Completion[];
  checkins: CheckIn[];
};

export async function buildBackupPayload(): Promise<BackupPayload> {
  const plan = await getPlan();
  const today = new Date();
  const start = format(subDays(today, 60), 'yyyy-MM-dd');
  const end = format(today, 'yyyy-MM-dd');
  const completions = await getCompletionsForRange(start, end);
  const checkins = await getCheckInsForRange(start, end);
  return {
    exportedAt: new Date().toISOString(),
    plan,
    completions,
    checkins,
  };
}

export async function importBackup(payload: BackupPayload) {
  const db = await getDb();
  await db.execAsync('DELETE FROM completions; DELETE FROM symptom_checkins; DELETE FROM plan;');

  if (payload.plan) {
    await db.runAsync(
      `INSERT INTO plan (id, startDate, nizoralDaysOfWeek, eveningTime, morningTime, terbinafineEnabled, createdAt, updatedAt)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?)`
      ,
      [
        payload.plan.startDate,
        JSON.stringify(payload.plan.nizoralDaysOfWeek),
        payload.plan.eveningTime,
        payload.plan.morningTime,
        payload.plan.terbinafineEnabled ? 1 : 0,
        payload.plan.createdAt,
        payload.plan.updatedAt,
      ]
    );
  }

  for (const completion of payload.completions) {
    await db.runAsync(
      'INSERT OR IGNORE INTO completions (id, date, taskType, completedAt, notes) VALUES (?, ?, ?, ?, ?)',
      [
        completion.id,
        completion.date,
        completion.taskType,
        completion.completedAt,
        completion.notes ?? null,
      ]
    );
  }

  for (const checkin of payload.checkins) {
    await db.runAsync(
      'INSERT OR REPLACE INTO symptom_checkins (id, date, itchScore, flakesScore, freeText, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      [
        checkin.id,
        checkin.date,
        checkin.itchScore,
        checkin.flakesScore,
        checkin.freeText,
        checkin.createdAt,
      ]
    );
  }
}
