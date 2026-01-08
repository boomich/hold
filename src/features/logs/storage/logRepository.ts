import { getDb } from '@/storage/database';

export type LogLevel = 'info' | 'error';

export type LogEntry = {
  id: number;
  createdAt: string;
  level: LogLevel;
  message: string;
};

const MAX_LOGS = 200;

export const addLog = async (level: LogLevel, message: string) => {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO logs (createdAt, level, message) VALUES (?, ?, ?)',
    new Date().toISOString(),
    level,
    message
  );
  await db.runAsync(
    `DELETE FROM logs WHERE id NOT IN (
      SELECT id FROM logs ORDER BY id DESC LIMIT ?
    )`,
    MAX_LOGS
  );
};

export const getLogs = async (): Promise<LogEntry[]> => {
  const db = await getDb();
  return db.getAllAsync<LogEntry>('SELECT * FROM logs ORDER BY id DESC');
};
