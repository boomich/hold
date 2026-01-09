import { formatISO } from 'date-fns';
import { Platform } from 'react-native';

import { getDb } from '../../../storage/database';
import { TaskType } from '../../plan/domain/types';

export type Completion = {
  id: number;
  date: string;
  taskType: TaskType;
  completedAt: string;
  notes?: string | null;
};

export async function markComplete(date: string, taskType: TaskType, notes?: string) {
  const db = await getDb();
  const completedAt = formatISO(new Date());

  if (Platform.OS === 'web') {
    // On web, we need to generate the ID manually
    const existingCompletions = await db.getAllAsync<Completion>('SELECT * FROM completions', []);
    const maxId =
      existingCompletions.length > 0 ? Math.max(...existingCompletions.map((c) => c.id)) : 0;
    const completionId = maxId + 1;

    await db.runAsync(
      'INSERT OR IGNORE INTO completions (id, date, taskType, completedAt, notes) VALUES (?, ?, ?, ?, ?)',
      [completionId, date, taskType, completedAt, notes ?? null]
    );
  } else {
    // On native, SQLite handles auto-increment
    await db.runAsync(
      'INSERT OR IGNORE INTO completions (date, taskType, completedAt, notes) VALUES (?, ?, ?, ?)',
      [date, taskType, completedAt, notes ?? null]
    );
  }
}

export async function unmarkComplete(date: string, taskType: TaskType) {
  const db = await getDb();
  await db.runAsync('DELETE FROM completions WHERE date = ? AND taskType = ?', [date, taskType]);
}

export async function getCompletionsForDate(date: string): Promise<Completion[]> {
  const db = await getDb();
  return db.getAllAsync<Completion>('SELECT * FROM completions WHERE date = ?', [date]);
}

export async function getCompletionsForRange(
  startDate: string,
  endDate: string
): Promise<Completion[]> {
  const db = await getDb();
  return db.getAllAsync<Completion>('SELECT * FROM completions WHERE date >= ? AND date <= ?', [
    startDate,
    endDate,
  ]);
}
