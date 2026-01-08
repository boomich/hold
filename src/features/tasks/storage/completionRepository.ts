import { getDb } from '@/storage/database';
import { TaskType } from '@/features/plan/domain/types';

export type Completion = {
  id: number;
  date: string;
  taskType: TaskType;
  completedAt: string;
  notes?: string | null;
};

export const insertCompletion = async (
  date: string,
  taskType: TaskType,
  notes?: string
) => {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR IGNORE INTO completions (date, taskType, completedAt, notes)
     VALUES (?, ?, ?, ?)` ,
    date,
    taskType,
    new Date().toISOString(),
    notes ?? null
  );
};

export const removeCompletion = async (date: string, taskType: TaskType) => {
  const db = await getDb();
  await db.runAsync('DELETE FROM completions WHERE date = ? AND taskType = ?', date, taskType);
};

export const getCompletionsForDate = async (date: string): Promise<Completion[]> => {
  const db = await getDb();
  return db.getAllAsync<Completion>('SELECT * FROM completions WHERE date = ?', date);
};

export const getCompletionsBetween = async (start: string, end: string): Promise<Completion[]> => {
  const db = await getDb();
  return db.getAllAsync<Completion>(
    'SELECT * FROM completions WHERE date BETWEEN ? AND ? ORDER BY date ASC',
    start,
    end
  );
};
