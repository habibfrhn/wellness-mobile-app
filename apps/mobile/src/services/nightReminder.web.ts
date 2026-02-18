import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_REMINDER_ENABLED = "night:reminder_enabled";
const KEY_REMINDER_HOUR = "night:reminder_hour";
const KEY_REMINDER_MINUTE = "night:reminder_minute";
const KEY_REMINDER_NOTIFICATION_ID = "night:reminder_notification_id";

const DEFAULT_HOUR = 22;
const DEFAULT_MINUTE = 0;

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

// Notifications are not scheduled on web in this app; keep persisted settings only.
export async function syncNightReminderSchedule(settings: NightReminderSettings): Promise<void> {
  if (!settings.enabled) {
    await AsyncStorage.removeItem(KEY_REMINDER_NOTIFICATION_ID);
  }
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
