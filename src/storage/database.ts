import { Platform } from 'react-native';

// Type definition for SQLite database interface
interface SQLiteDatabase {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: unknown[]): Promise<{ lastInsertRowId: number; changes: number }>;
  getFirstAsync<T>(sql: string, params?: unknown[]): Promise<T | null>;
  getAllAsync<T>(sql: string, params?: unknown[]): Promise<T[]>;
}

let db: SQLiteDatabase | null = null;

// Web localStorage-based database mock
class WebDatabase implements SQLiteDatabase {
  private getStore<T>(key: string): T[] {
    try {
      const data = localStorage.getItem(`hold_${key}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private setStore<T>(key: string, data: T[]): void {
    try {
      localStorage.setItem(`hold_${key}`, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage', error);
    }
  }

  async execAsync(_sql: string): Promise<void> {
    // Initialize empty stores if they don't exist
    if (!localStorage.getItem('hold_plan')) {
      localStorage.setItem('hold_plan', JSON.stringify([]));
    }
    if (!localStorage.getItem('hold_completions')) {
      localStorage.setItem('hold_completions', JSON.stringify([]));
    }
    if (!localStorage.getItem('hold_checkins')) {
      localStorage.setItem('hold_checkins', JSON.stringify([]));
    }
    if (!localStorage.getItem('hold_logs')) {
      localStorage.setItem('hold_logs', JSON.stringify([]));
    }
  }

  async runAsync(sql: string, params: unknown[] = []): Promise<{ lastInsertRowId: number; changes: number }> {
    const sqlLower = sql.toLowerCase();

    // Handle plan operations
    if (sqlLower.includes('into plan')) {
      const plan = {
        id: 1,
        startDate: params[0] as string,
        nizoralDaysOfWeek: params[1] as string,
        eveningTime: params[2] as string,
        morningTime: params[3] as string,
        terbinafineEnabled: params[4] as number,
        createdAt: params[5] as string,
        updatedAt: params[6] as string,
      };
      this.setStore('plan', [plan]);
      return { lastInsertRowId: 1, changes: 1 };
    }

    if (sqlLower.includes('update plan')) {
      const plans = this.getStore<Record<string, unknown>>('plan');
      if (plans.length > 0) {
        // Parse SET clause
        const setMatch = sql.match(/SET\s+(.+?)\s+WHERE/i);
        if (setMatch) {
          const setClauses = setMatch[1].split(',').map((s) => s.trim());
          let paramIndex = 0;
          for (const clause of setClauses) {
            const [field] = clause.split('=').map((s) => s.trim());
            if (field && params[paramIndex] !== undefined) {
              plans[0][field] = params[paramIndex];
              paramIndex++;
            }
          }
        }
        this.setStore('plan', plans);
      }
      return { lastInsertRowId: 1, changes: 1 };
    }

    if (sqlLower.includes('delete from plan') || sqlLower.includes('delete from completions; delete from symptom_checkins; delete from plan')) {
      this.setStore('plan', []);
      if (sqlLower.includes('completions')) {
        this.setStore('completions', []);
        this.setStore('checkins', []);
      }
      return { lastInsertRowId: 0, changes: 1 };
    }

    // Handle completions
    if (sqlLower.includes('into completions')) {
      const completions = this.getStore<Record<string, unknown>>('completions');
      const id = sqlLower.includes('or ignore') && params[0] ? params[0] : completions.length + 1;
      const completion = {
        id,
        date: params[1] as string,
        taskType: params[2] as string,
        completedAt: params[3] as string,
        notes: params[4] as string | null,
      };
      // Check for existing (UNIQUE constraint on date, taskType)
      const existing = completions.findIndex(
        (c) => c.date === completion.date && c.taskType === completion.taskType
      );
      if (existing === -1) {
        completions.push(completion);
      }
      this.setStore('completions', completions);
      return { lastInsertRowId: completion.id as number, changes: 1 };
    }

    // Handle checkins
    if (sqlLower.includes('into symptom_checkins')) {
      const checkins = this.getStore<Record<string, unknown>>('checkins');
      const id = sqlLower.includes('or replace') && params[0] ? params[0] : checkins.length + 1;
      const checkin = {
        id,
        date: params[1] as string,
        itchScore: params[2],
        flakesScore: params[3],
        freeText: params[4],
        createdAt: params[5] as string,
      };
      // Replace existing if exists
      const existing = checkins.findIndex((c) => c.date === checkin.date);
      if (existing !== -1) {
        checkins[existing] = checkin;
      } else {
        checkins.push(checkin);
      }
      this.setStore('checkins', checkins);
      return { lastInsertRowId: checkin.id as number, changes: 1 };
    }

    // Handle logs
    if (sqlLower.includes('into logs')) {
      const logs = this.getStore<Record<string, unknown>>('logs');
      const log = {
        id: logs.length + 1,
        level: params[0] as string,
        message: params[1] as string,
        createdAt: params[2] as string,
      };
      logs.push(log);
      // Keep only last 200 logs
      if (logs.length > 200) {
        logs.splice(0, logs.length - 200);
      }
      this.setStore('logs', logs);
      return { lastInsertRowId: log.id, changes: 1 };
    }

    return { lastInsertRowId: 0, changes: 0 };
  }

  async getFirstAsync<T>(sql: string, _params?: unknown[]): Promise<T | null> {
    const sqlLower = sql.toLowerCase();

    if (sqlLower.includes('from plan')) {
      const plans = this.getStore<T>('plan');
      return plans[0] || null;
    }

    if (sqlLower.includes('from symptom_checkins') && _params && _params[0]) {
      const checkins = this.getStore<Record<string, unknown>>('checkins');
      const checkin = checkins.find((c) => c.date === _params[0]);
      return (checkin as T) || null;
    }

    return null;
  }

  async getAllAsync<T>(sql: string, params?: unknown[]): Promise<T[]> {
    const sqlLower = sql.toLowerCase();

    if (sqlLower.includes('from completions')) {
      const completions = this.getStore<Record<string, unknown>>('completions');
      if (params && params.length >= 2) {
        return completions.filter(
          (c) => c.date >= (params[0] as string) && c.date <= (params[1] as string)
        ) as T[];
      }
      return completions as T[];
    }

    if (sqlLower.includes('from symptom_checkins')) {
      const checkins = this.getStore<Record<string, unknown>>('checkins');
      if (params && params.length >= 2) {
        return checkins.filter(
          (c) => c.date >= (params[0] as string) && c.date <= (params[1] as string)
        ) as T[];
      }
      return checkins as T[];
    }

    if (sqlLower.includes('from logs')) {
      const logs = this.getStore<T>('logs');
      return logs.slice(-200).reverse();
    }

    return [];
  }
}

export async function getDb(): Promise<SQLiteDatabase> {
  if (!db) {
    if (Platform.OS === 'web') {
      db = new WebDatabase();
    } else {
      const SQLite = require('expo-sqlite');
      db = await SQLite.openDatabaseAsync('hold.db');
    }
  }
  return db;
}

export async function initializeDatabase() {
  const database = await getDb();
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS plan (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      startDate TEXT NOT NULL,
      nizoralDaysOfWeek TEXT NOT NULL,
      eveningTime TEXT NOT NULL,
      morningTime TEXT NOT NULL,
      terbinafineEnabled INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      taskType TEXT NOT NULL,
      completedAt TEXT NOT NULL,
      notes TEXT,
      UNIQUE(date, taskType)
    );
    CREATE TABLE IF NOT EXISTS symptom_checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      itchScore INTEGER,
      flakesScore INTEGER,
      freeText TEXT,
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);
  console.log('Database initialized');
}
