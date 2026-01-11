import { formatISO } from 'date-fns';
import { Platform } from 'react-native';
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

  if (Platform.OS === 'web') {
    // On web, we need to generate the ID manually and handle upsert
    const existingCheckins = await db.getAllAsync<CheckIn>('SELECT * FROM symptom_checkins', []);
    const existing = existingCheckins.find((c) => c.date === input.date);

    if (existing) {
      // Update existing
      await db.runAsync(
        `INSERT OR REPLACE INTO symptom_checkins (id, date, itchScore, flakesScore, freeText, createdAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          existing.id,
          input.date,
          input.itchScore ?? null,
          input.flakesScore ?? null,
          input.freeText ?? null,
          existing.createdAt, // Preserve original createdAt
        ]
      );
    } else {
      // Insert new
      const maxId =
        existingCheckins.length > 0 ? Math.max(...existingCheckins.map((c) => c.id)) : 0;
      const checkinId = maxId + 1;
      await db.runAsync(
        `INSERT OR REPLACE INTO symptom_checkins (id, date, itchScore, flakesScore, freeText, createdAt)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          checkinId,
          input.date,
          input.itchScore ?? null,
          input.flakesScore ?? null,
          input.freeText ?? null,
          createdAt,
        ]
      );
    }
  } else {
    // On native, SQLite handles auto-increment and ON CONFLICT
    await db.runAsync(
      `INSERT INTO symptom_checkins (date, itchScore, flakesScore, freeText, createdAt)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(date) DO UPDATE SET itchScore = excluded.itchScore, flakesScore = excluded.flakesScore, freeText = excluded.freeText`,
      [
        input.date,
        input.itchScore ?? null,
        input.flakesScore ?? null,
        input.freeText ?? null,
        createdAt,
      ]
    );
  }
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
