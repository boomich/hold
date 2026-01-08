import { getDb } from '@/storage/database';

export type CheckIn = {
  id: number;
  date: string;
  itchScore?: number | null;
  flakesScore?: number | null;
  freeText?: string | null;
  createdAt: string;
};

export const upsertCheckIn = async (
  date: string,
  itchScore?: number | null,
  flakesScore?: number | null,
  freeText?: string | null
) => {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO checkins (date, itchScore, flakesScore, freeText, createdAt)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET itchScore = excluded.itchScore,
       flakesScore = excluded.flakesScore,
       freeText = excluded.freeText
    `,
    date,
    itchScore ?? null,
    flakesScore ?? null,
    freeText ?? null,
    new Date().toISOString()
  );
};

export const getCheckInsBetween = async (start: string, end: string): Promise<CheckIn[]> => {
  const db = await getDb();
  return db.getAllAsync<CheckIn>(
    'SELECT * FROM checkins WHERE date BETWEEN ? AND ? ORDER BY date ASC',
    start,
    end
  );
};

export const getCheckInByDate = async (date: string): Promise<CheckIn | null> => {
  const db = await getDb();
  const rows = await db.getAllAsync<CheckIn>('SELECT * FROM checkins WHERE date = ?', date);
  return rows[0] ?? null;
};
