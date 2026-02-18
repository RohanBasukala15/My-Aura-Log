/**
 * Local notifications (expo-notifications): on-device scheduling only.
 *
 * Daily reminder when the app is closed is sent by the Firebase Cloud Function
 * via FCM (see NotificationProvider for token, Firestore for prefs, functions/ for cron).
 * We do not schedule a local daily here when "motivation notifications" are on,
 * so the user gets one daily ping from the server (no duplicate).
 *
 * This service is used for: weekly summary (local), and scheduleDailyNotification
 * is kept for optional/local-only use (e.g. fallback or future features).
 */
import * as Notifications from "expo-notifications";
import { Storage } from "./Storage";
import { PremiumService } from "./premiumService";
import { OpenAIService } from "./openaiService";

const NOTIFICATION_ENABLED_KEY = "myauralog_notifications_enabled";
const NOTIFICATION_TIME_KEY = "myauralog_notification_time";
const DEFAULT_NOTIFICATION_TIME = "09:00";

// Random personalized notification messages (longer + shorter 5–6 word ones)
const NOTIFICATION_MESSAGES = [
  "Take a mindful pause and capture today's mood in your journal.",
  "Time to check in with yourself and log your aura for today.",
  "Your daily moment of reflection awaits—how are you feeling?",
  "Pause, breathe, and let your journal hold what you're carrying today.",
  "Ready to capture today's energy? Your journal is waiting.",
  "A quick check-in can shift your whole day—take a moment now.",
  "Your inner weather is worth noting—log your aura today.",
  "Every day is a new chapter. What's yours saying today?",
  "Log your aura. Feel the shift.",
  "Your journal is waiting for you.",
  "One entry. A calmer you.",
  "Capture today's moment. Just one.",
  "Check in. Your mind will thank you.",
  "Today's mood deserves a note.",
  "A quick pause. A clearer head.",
  "Your thoughts matter. Write them.",
  "One minute. One journal entry.",
  "Breathe. Reflect. Log your day.",
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

  // Base message (random from list)
  const randomMessage = pickRandomMessage();
  let body =
    userName && userName.trim()
      ? `${userName}, ${randomMessage}`
      : randomMessage;

  // Premium: append an OpenAI motivational quote (plain text, we add quotes in the notification)
  const isPremium = await PremiumService.isPremium();
  if (isPremium) {
    const quote = await OpenAIService.generateMotivationalQuote();
    if (quote) {
      body = `${body}\n\n"${quote}"`;
    }
  }

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

/**
 * Schedule the "Every Sunday 9 PM" weekly summary notification.
 * Ideal copy is AI-generated, e.g. "Rohan, you conquered a stressful week! Read how your
 * 'Family' tag helped you stay grounded." For now we use a fixed body.
 * Note: scheduleDailyNotification calls cancelAllScheduledNotificationsAsync, which would
 * clear this. Consider merging both into a single scheduling flow.
 */
export const scheduleWeeklySummaryNotification = async (): Promise<string> => {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return "";

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Your weekly reflection is ready ✨",
      body: "See how your week unfolded and get a nudge for the next one.",
      sound: true,
      data: { type: "weekly_summary" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1, // 1 = Sunday
      hour: 21,
      minute: 0,
    },
  });
  return id;
};

export const NotificationService = {
  NOTIFICATION_ENABLED_KEY,
  NOTIFICATION_TIME_KEY,
  DEFAULT_NOTIFICATION_TIME,
  scheduleDailyNotification,
  scheduleWeeklySummaryNotification,
  requestNotificationPermissions,
  createDateFromTimeString,
  formatDateToTimeString,
};
