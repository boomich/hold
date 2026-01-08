import { addLog, getLogs, LogEntry, LogLevel } from '@/features/logs/storage/logRepository';

const writeLog = async (level: LogLevel, message: string) => {
  if (level === 'error') {
    console.error(message);
  } else {
    console.log(message);
  }
  try {
    await addLog(level, message);
  } catch (error) {
    console.warn('Failed to persist log entry', error);
  }
};

export const logInfo = async (message: string) => writeLog('info', message);

export const logError = async (message: string) => writeLog('error', message);

export const fetchLogs = async (): Promise<LogEntry[]> => getLogs();
