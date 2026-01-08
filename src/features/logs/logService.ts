import { getDb } from '../../storage/database';
import { formatISO } from 'date-fns';

export type LogEntry = {
  id: number;
  level: 'info' | 'error';
  message: string;
  createdAt: string;
};

async function insertLog(level: 'info' | 'error', message: string) {
  try {
    const db = await getDb();
    const createdAt = formatISO(new Date());
    await db.runAsync('INSERT INTO logs (level, message, createdAt) VALUES (?, ?, ?)', [
      level,
      message,
      createdAt,
    ]);
    await db.execAsync(
      'DELETE FROM logs WHERE id NOT IN (SELECT id FROM logs ORDER BY id DESC LIMIT 200)'
    );
  } catch (error) {
    console.error('Failed to log entry', error);
  }
}

export async function logInfo(message: string) {
  console.log(message);
  await insertLog('info', message);
}

export async function logError(message: string, error?: unknown) {
  console.error(message, error);
  const detail = error instanceof Error ? `${message} :: ${error.message}` : message;
  await insertLog('error', detail);
}

export async function getRecentLogs(): Promise<LogEntry[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<LogEntry>('SELECT * FROM logs ORDER BY id DESC LIMIT 200');
  return rows;
}
