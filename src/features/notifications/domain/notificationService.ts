import * as Notifications from 'expo-notifications';
import { Linking } from 'react-native';
import { Plan } from '@/features/plan/domain/types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const parseTime = (value: string) => {
  const [hour, minute] = value.split(':').map((part) => Number(part));
  return { hour, minute };
};

const toExpoWeekday = (dayIndex: number) => (dayIndex === 0 ? 1 : dayIndex + 1);

export const getNotificationPermissionStatus = async () => {
  return Notifications.getPermissionsAsync();
};

export const requestNotificationPermission = async () => {
  return Notifications.requestPermissionsAsync();
};

export const schedulePlanNotifications = async (plan: Plan) => {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const eveningTime = parseTime(plan.eveningTime);
  for (const day of plan.nizoralDaysOfWeek) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Nizoral wash',
        body: 'Evening wash for scalp + beard.',
      },
      trigger: {
        weekday: toExpoWeekday(day),
        hour: eveningTime.hour,
        minute: eveningTime.minute,
        repeats: true,
      },
    });
  }

  if (plan.terbinafineEnabled) {
    const morningTime = parseTime(plan.morningTime);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Terbinafine cream',
        body: 'Morning antifungal care.',
      },
      trigger: {
        hour: morningTime.hour,
        minute: morningTime.minute,
        repeats: true,
      },
    });
  }
};

export const openNotificationSettings = async () => {
  return Linking.openSettings();
};
