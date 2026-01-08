import { formatISO } from 'date-fns';
import { getDb } from '../../../storage/database';

export type CheckIn = {
  id: number;
  date: string;
  itchScore: number | null;
  flakesScore: number | null;
  freeText: string | null;
  createdAt: string;
};

export async function upsertCheckIn(input: {
  date: string;
  itchScore?: number | null;
  flakesScore?: number | null;
  freeText?: string | null;
}) {
  const db = await getDb();
  const createdAt = formatISO(new Date());
  await db.runAsync(
    `INSERT INTO symptom_checkins (date, itchScore, flakesScore, freeText, createdAt)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET itchScore = excluded.itchScore, flakesScore = excluded.flakesScore, freeText = excluded.freeText`,
    [input.date, input.itchScore ?? null, input.flakesScore ?? null, input.freeText ?? null, createdAt]
  );
}

export async function getCheckInByDate(date: string): Promise<CheckIn | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<CheckIn>('SELECT * FROM symptom_checkins WHERE date = ?', [
    date,
  ]);
  return row ?? null;
}

export async function getCheckInsForRange(startDate: string, endDate: string): Promise<CheckIn[]> {
  const db = await getDb();
  return db.getAllAsync<CheckIn>(
    'SELECT * FROM symptom_checkins WHERE date >= ? AND date <= ? ORDER BY date ASC',
    [startDate, endDate]
  );
}
