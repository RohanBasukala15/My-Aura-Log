import * as Notifications from "expo-notifications";
import { Storage } from "./Storage";

const NOTIFICATION_ENABLED_KEY = "myauralog_notifications_enabled";
const NOTIFICATION_TIME_KEY = "myauralog_notification_time";
const DEFAULT_NOTIFICATION_TIME = "09:00";

// Random personalized notification messages
const NOTIFICATION_MESSAGES = [
  "Take a mindful pause and capture today's mood in your journal.",
  "Time to check in with yourself and log your aura for today.",
  "Your daily moment of reflection awaits—how are you feeling?",
  "Pause, breathe, and let your journal hold what you're carrying today.",
  "Ready to capture today's energy? Your journal is waiting.",
  "A quick check-in can shift your whole day—take a moment now.",
  "Your inner weather is worth noting—log your aura today.",
  "Every day is a new chapter. What's yours saying today?",
];

const pickRandomMessage = (): string => {
  const index = Math.floor(Math.random() * NOTIFICATION_MESSAGES.length);
  return NOTIFICATION_MESSAGES[index] ?? NOTIFICATION_MESSAGES[0] ?? "";
};

export const createDateFromTimeString = (time: string): Date => {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(Number.isFinite(hours) ? hours : 9, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return date;
};

export const formatDateToTimeString = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

export const scheduleDailyNotification = async (time: string, userName?: string | null): Promise<string> => {
  // Cancel any existing notifications first
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Parse time
  const [hours, minutes] = time.split(":").map(Number);

  // Validate time
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error("Invalid time format");
  }

  // Get user name if not provided
  if (!userName) {
    userName = await Storage.getItem<string>("user_name", null);
  }

  // Create personalized body message
  const randomMessage = pickRandomMessage();
  const body = userName && userName.trim()
    ? `${userName}, ${randomMessage}`
    : randomMessage;

  // Schedule daily notification
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Daily Aura Check-In ✨",
      body,
      sound: true,
      data: { type: "daily_reminder" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hours,
      minute: minutes,
    },
  });

  return notificationId;
};

export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === "granted";
  } catch (error) {
    return false;
  }
};

export const NotificationService = {
  NOTIFICATION_ENABLED_KEY,
  NOTIFICATION_TIME_KEY,
  DEFAULT_NOTIFICATION_TIME,
  scheduleDailyNotification,
  requestNotificationPermissions,
  createDateFromTimeString,
  formatDateToTimeString,
};
