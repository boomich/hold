import * as SQLite from 'expo-sqlite';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export const getDb = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('hold.db');
  }
  return dbPromise;
};

export const initializeDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  const db = await getDb();
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS plan (
      id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
      startDate TEXT NOT NULL,
      nizoralDaysOfWeek TEXT NOT NULL,
      eveningTime TEXT NOT NULL,
      morningTime TEXT NOT NULL,
      terbinafineEnabled INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      taskType TEXT NOT NULL,
      completedAt TEXT NOT NULL,
      notes TEXT,
      UNIQUE(date, taskType)
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      itchScore INTEGER,
      flakesScore INTEGER,
      freeText TEXT,
      createdAt TEXT NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      createdAt TEXT NOT NULL,
      level TEXT NOT NULL,
      message TEXT NOT NULL
    );
  `);

  return db;
};
