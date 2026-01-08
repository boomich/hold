import { format } from 'date-fns';
import { getCheckInByDate, getCheckInsBetween, upsertCheckIn } from '@/features/checkin/storage/checkinRepository';

export const saveCheckIn = async (
  date: Date,
  itchScore?: number | null,
  flakesScore?: number | null,
  freeText?: string | null
) => {
  const key = format(date, 'yyyy-MM-dd');
  await upsertCheckIn(key, itchScore, flakesScore, freeText);
};

export const fetchCheckIn = async (date: Date) => {
  const key = format(date, 'yyyy-MM-dd');
  return getCheckInByDate(key);
};

export const fetchCheckInsBetween = async (start: Date, end: Date) => {
  const startKey = format(start, 'yyyy-MM-dd');
  const endKey = format(end, 'yyyy-MM-dd');
  return getCheckInsBetween(startKey, endKey);
};
