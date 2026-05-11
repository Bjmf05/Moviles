import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const WATERING_CHANNEL_ID = "watering";

async function ensureAndroidWateringChannel(): Promise<void> {
  // Android 8+ requires channels; Android 13 won't show the permission prompt
  // until at least one channel exists.
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(WATERING_CHANNEL_ID, {
    name: "Riego",
    importance: Notifications.AndroidImportance.HIGH,
  });
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  await ensureAndroidWateringChannel();

  const { status: existing } = await Notifications.getPermissionsAsync();
  let final = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    final = status;
  }
  if (final !== "granted") {
    console.warn("Notification permission not granted");
    return false;
  }
  return true;
}

export async function scheduleWateringNotification(
  plantName: string,
  dateStr: string,
): Promise<string | undefined> {
  await ensureAndroidWateringChannel();

  const date = new Date(dateStr + "T09:00:00");
  if (date.getTime() <= Date.now()) return undefined;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "💧 Riego pendiente",
      body: `Es hora de regar ${plantName}`,
      data: { plantName },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      ...(Platform.OS === "android" ? { channelId: WATERING_CHANNEL_ID } : {}),
    },
  });
  return id;
}

export async function cancelNotification(
  notificationId: string,
): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
