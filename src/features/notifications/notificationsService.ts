import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Plan } from '../plan/domain/types';
import { logError, logInfo } from '../logs/logService';

let notificationHandlerInitialized = false;

export function initializeNotificationHandler() {
  if (notificationHandlerInitialized) {
    return;
  }
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    notificationHandlerInitialized = true;
  } catch (error) {
    console.error('Failed to initialize notification handler', error);
  }
}

export async function requestNotificationPermissions() {
  initializeNotificationHandler();
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function getNotificationPermissions() {
  initializeNotificationHandler();
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

function parseTime(value: string) {
  const [hourStr, minuteStr] = value.split(':');
  return { hour: Number(hourStr), minute: Number(minuteStr) };
}

function toExpoWeekday(dayIndex: number) {
  return dayIndex === 0 ? 1 : dayIndex + 1;
}

export async function schedulePlanNotifications(plan: Plan) {
  try {
    initializeNotificationHandler();
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('routine', {
        name: 'Routine reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    if (plan.terbinafineEnabled) {
      const { hour, minute } = parseTime(plan.morningTime);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Morning: Terbinafine cream',
          body: 'Apply a thin layer. Then move on with your day.',
        },
        trigger: { hour, minute, repeats: true },
      });
    }

    const { hour, minute } = parseTime(plan.eveningTime);
    for (const dayIndex of plan.nizoralDaysOfWeek) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Evening: Nizoral wash',
          body: 'Scalp + beard. Slow rinse. That is it.',
        },
        trigger: { weekday: toExpoWeekday(dayIndex), hour, minute, repeats: true },
      });
    }

    await logInfo('Notifications scheduled');
  } catch (error) {
    await logError('Failed to schedule notifications', error);
  }
}
