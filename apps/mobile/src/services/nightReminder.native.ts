import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const KEY_REMINDER_ENABLED = "night:reminder_enabled";
const KEY_REMINDER_HOUR = "night:reminder_hour";
const KEY_REMINDER_MINUTE = "night:reminder_minute";
const KEY_REMINDER_NOTIFICATION_ID = "night:reminder_notification_id";

const DEFAULT_HOUR = 22;
const DEFAULT_MINUTE = 0;
const NIGHT_REMINDER_TYPE = "night_reminder";

export type NightReminderSettings = {
  enabled: boolean;
  hour: number;
  minute: number;
};

export async function getNightReminderSettings(): Promise<NightReminderSettings> {
  try {
    const [enabledRaw, hourRaw, minuteRaw] = await Promise.all([
      AsyncStorage.getItem(KEY_REMINDER_ENABLED),
      AsyncStorage.getItem(KEY_REMINDER_HOUR),
      AsyncStorage.getItem(KEY_REMINDER_MINUTE),
    ]);

    return {
      enabled: enabledRaw === "1",
      hour: parseHour(hourRaw),
      minute: parseMinute(minuteRaw),
    };
  } catch {
    return {
      enabled: false,
      hour: DEFAULT_HOUR,
      minute: DEFAULT_MINUTE,
    };
  }
}

export async function setNightReminderSettings(next: NightReminderSettings): Promise<NightReminderSettings> {
  const normalized = {
    enabled: next.enabled,
    hour: clampHour(next.hour),
    minute: clampMinute(next.minute),
  };

  await Promise.all([
    AsyncStorage.setItem(KEY_REMINDER_ENABLED, normalized.enabled ? "1" : "0"),
    AsyncStorage.setItem(KEY_REMINDER_HOUR, String(normalized.hour)),
    AsyncStorage.setItem(KEY_REMINDER_MINUTE, String(normalized.minute)),
  ]);

  return normalized;
}

/**
 * Ensures we only keep a single scheduled daily reminder.
 */
export async function syncNightReminderSchedule(settings: NightReminderSettings): Promise<void> {
  const normalized = {
    enabled: settings.enabled,
    hour: clampHour(settings.hour),
    minute: clampMinute(settings.minute),
  };

  const previousId = await AsyncStorage.getItem(KEY_REMINDER_NOTIFICATION_ID);

  if (previousId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(previousId);
    } catch {
      // ignore stale IDs
    }
  }

  // Extra cleanup: remove any old notifications tagged as our night reminder.
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    const matches = all.filter((item) => item.content.data?.type === NIGHT_REMINDER_TYPE);
    await Promise.all(matches.map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)));
  } catch {
    // best effort cleanup
  }

  if (!normalized.enabled) {
    await AsyncStorage.removeItem(KEY_REMINDER_NOTIFICATION_ID);
    return;
  }

  await ensureNotificationPermission();
  await ensureNotificationChannel();

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Atur pengingat malam",
      body: "Saatnya memulai ritual malam.",
      data: {
        type: NIGHT_REMINDER_TYPE,
      },
    },
    trigger: {
      hour: normalized.hour,
      minute: normalized.minute,
      repeats: true,
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
    },
  });

  await AsyncStorage.setItem(KEY_REMINDER_NOTIFICATION_ID, identifier);
}

async function ensureNotificationPermission(): Promise<void> {
  const perms = await Notifications.getPermissionsAsync();
  if (perms.granted) {
    return;
  }

  const requested = await Notifications.requestPermissionsAsync();
  if (!requested.granted) {
    throw new Error("notifications_permission_denied");
  }
}

async function ensureNotificationChannel(): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync("night-reminder", {
    name: "Night Reminder",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

function parseHour(value: string | null): number {
  return clampHour(Number.parseInt(value ?? String(DEFAULT_HOUR), 10));
}

function parseMinute(value: string | null): number {
  return clampMinute(Number.parseInt(value ?? String(DEFAULT_MINUTE), 10));
}

function clampHour(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_HOUR;
  return Math.min(23, Math.max(0, Math.trunc(value)));
}

function clampMinute(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_MINUTE;
  return Math.min(59, Math.max(0, Math.trunc(value)));
}
