import * as Notifications from 'expo-notifications';
import { Linking } from 'react-native';
import { Plan } from '@/features/plan/domain/types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    // `shouldShowAlert` is deprecated but harmless; keep it for older platforms.
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
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
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: toExpoWeekday(day),
        hour: eveningTime.hour,
        minute: eveningTime.minute,
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
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: morningTime.hour,
        minute: morningTime.minute,
      },
    });
  }
};

export const openNotificationSettings = async () => {
  return Linking.openSettings();
};
