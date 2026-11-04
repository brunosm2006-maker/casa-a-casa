import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { type ReminderDevice } from './reminderDevice';

const channelId = 'casa-a-casa-reminders';
const android = Platform.OS === 'android';

async function createChannel() {
  if (android) await Notifications.setNotificationChannelAsync(channelId, {
    name: 'Recordatorios de Casa a Casa',
    importance: Notifications.AndroidImportance.DEFAULT,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
  });
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const device: ReminderDevice = {
  async permission() {
    const result = await Notifications.getPermissionsAsync();
    const allowed = result.ios
      ? result.ios.status === Notifications.IosAuthorizationStatus.AUTHORIZED ||
        result.ios.status === Notifications.IosAuthorizationStatus.PROVISIONAL ||
        result.ios.status === Notifications.IosAuthorizationStatus.EPHEMERAL
      : result.granted;
    if (!allowed) return result.canAskAgain ? 'ask' : 'settings';
    if (android) {
      const channel = await Notifications.getNotificationChannelAsync(channelId);
      if (channel?.importance === Notifications.AndroidImportance.NONE) return 'channel';
    }
    return 'allowed';
  },
  async request() {
    await createChannel();
    await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true } });
  },
  async pending() {
    return (await Notifications.getAllScheduledNotificationsAsync()).map(request => request.identifier);
  },
  cancel: Notifications.cancelScheduledNotificationAsync,
  async schedule(reminder) {
    if (android && !await Notifications.getNotificationChannelAsync(channelId)) await createChannel();
    if (reminder.at <= Date.now()) return;
    await Notifications.scheduleNotificationAsync({
      identifier: reminder.id,
      content: {
        title: 'Casa a Casa',
        body: reminder.kind === 'change' ? 'Tienes un recordatorio de calendario.' : 'Tienes un recordatorio de preparación.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminder.at,
        ...(android ? { channelId, delivery: 'bestEffort' as const } : {}),
      },
    });
  },
};
