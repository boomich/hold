import { differenceInCalendarDays, getDay, isBefore, parseISO } from 'date-fns';
import { Plan, Task, TaskType } from './types';

export function getDayIndex(startDate: string, today: Date) {
  const start = parseISO(startDate);
  if (isBefore(today, start)) {
    return 1;
  }
  return differenceInCalendarDays(today, start) + 1;
}

export function isAnalysisUnlocked(startDate: string, today: Date) {
  return getDayIndex(startDate, today) >= 21;
}

export function canEditDaysOfWeek(startDate: string, today: Date) {
  return getDayIndex(startDate, today) >= 22;
}

export function getTodayTasks(plan: Plan, today: Date): Task[] {
  const tasks: Task[] = [];
  const day = getDay(today);

  if (plan.terbinafineEnabled) {
    tasks.push({
      taskType: 'TERBINAFINE',
      label: 'Terbinafine cream',
      timeOfDay: 'morning',
      scheduledTime: plan.morningTime,
    });
  }

  if (plan.nizoralDaysOfWeek.includes(day)) {
    tasks.push({
      taskType: 'NIZORAL_WASH',
      label: 'Nizoral wash (scalp + beard)',
      timeOfDay: 'evening',
      scheduledTime: plan.eveningTime,
    });
  }

  tasks.push({
    taskType: 'NIZORAL_LATHER',
    label: 'Heel/fingers lather',
    timeOfDay: 'any',
  });

  return tasks;
}

export function isScheduledWashDay(plan: Plan, date: Date) {
  return plan.nizoralDaysOfWeek.includes(getDay(date));
}

export function getNextWashDay(plan: Plan, today: Date) {
  for (let offset = 0; offset < 7; offset += 1) {
    const candidate = new Date(today);
    candidate.setDate(today.getDate() + offset);
    if (plan.nizoralDaysOfWeek.includes(getDay(candidate))) {
      return candidate;
    }
  }
  return today;
}

export function getTaskLabel(taskType: TaskType) {
  switch (taskType) {
    case 'NIZORAL_WASH':
      return 'Nizoral wash';
    case 'NIZORAL_LATHER':
      return 'Heel/fingers lather';
    case 'TERBINAFINE':
      return 'Terbinafine cream';
    default:
      return 'Task';
  }
}
