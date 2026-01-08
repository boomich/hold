import { format } from 'date-fns';

export function formatDateISO(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

export function formatFriendlyDate(date: Date) {
  return format(date, 'EEE, MMM d');
}

export function formatDayLabel(date: Date) {
  return format(date, 'EEE');
}

export function formatTime(date: Date) {
  return format(date, 'HH:mm');
}

export function parseTimeToDate(time: string) {
  const [hourStr, minuteStr] = time.split(':');
  const date = new Date();
  date.setHours(Number(hourStr));
  date.setMinutes(Number(minuteStr));
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date;
}
