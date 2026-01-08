import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb() {
  if (!db) {
    db = await SQLite.openDatabaseAsync('hold.db');
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
