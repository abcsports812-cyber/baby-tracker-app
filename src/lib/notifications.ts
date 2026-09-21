import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useSettingsStore } from '../store';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let permissionRequested = false;

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (permissionRequested) return false;
    permissionRequested = true;
    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  } catch {
    return false;
  }
}

interface ScheduleOptions {
  title: string;
  body?: string;
  date: Date;
  repeat?: 'daily' | 'weekly' | 'none';
}

export async function scheduleReminderNotification(opts: ScheduleOptions): Promise<string | undefined> {
  if (!useSettingsStore.getState().value.notificationsEnabled) return undefined;

  const granted = await ensureNotificationPermission();
  if (!granted) return undefined;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    if (!opts.repeat || opts.repeat === 'none') {
      if (opts.date.getTime() <= Date.now()) return undefined;
      return await Notifications.scheduleNotificationAsync({
        content: { title: opts.title, body: opts.body },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: opts.date,
        },
      });
    }

    if (opts.repeat === 'daily') {
      return await Notifications.scheduleNotificationAsync({
        content: { title: opts.title, body: opts.body },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: opts.date.getHours(),
          minute: opts.date.getMinutes(),
        },
      });
    }

    // weekly
    return await Notifications.scheduleNotificationAsync({
      content: { title: opts.title, body: opts.body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: opts.date.getDay() + 1,
        hour: opts.date.getHours(),
        minute: opts.date.getMinutes(),
      },
    });
  } catch {
    return undefined;
  }
}

export async function cancelReminderNotification(notificationId?: string) {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // no-op: already cancelled or invalid id
  }
}
