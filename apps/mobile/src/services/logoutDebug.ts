import { Platform } from "react-native";

type LogoutLogLevel = "info" | "warn" | "error";

const LOGOUT_DEBUG_STORAGE_KEY = "wellness.auth.logoutLogs";
const LOGOUT_DEBUG_LAST_EVENT_KEY = "wellness.auth.lastLogoutEvent";
const MAX_LOGOUT_LOG_ENTRIES = 80;
const LOGOUT_DEBUG_ENABLED = __DEV__ && process.env.EXPO_PUBLIC_AUTH_DEBUG === "1";

function serializeDetails(details: Record<string, unknown>) {
  try {
    return JSON.stringify(details);
  } catch {
    return JSON.stringify({ serialization: "failed" });
  }
}

function persistWebLogoutLog(line: string) {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return;
  }

  const existingRaw = window.localStorage.getItem(LOGOUT_DEBUG_STORAGE_KEY);
  let existing: string[] = [];

  if (existingRaw) {
    try {
      const parsed = JSON.parse(existingRaw) as unknown;
      if (Array.isArray(parsed)) {
        existing = parsed.filter((entry): entry is string => typeof entry === "string");
      }
    } catch {
      existing = [];
    }
  }

  existing.push(line);
  const trimmed = existing.slice(-MAX_LOGOUT_LOG_ENTRIES);
  window.localStorage.setItem(LOGOUT_DEBUG_STORAGE_KEY, JSON.stringify(trimmed));
  window.localStorage.setItem(LOGOUT_DEBUG_LAST_EVENT_KEY, line);
}

export function logLogoutEvent(level: LogoutLogLevel, event: string, details: Record<string, unknown> = {}) {
  if (!LOGOUT_DEBUG_ENABLED && level !== "error") {
    return;
  }

  const payload = {
    event,
    at: new Date().toISOString(),
    platform: Platform.OS,
    ...details,
  };

  const line = `[logout] ${event} ${serializeDetails(payload)}`;

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.info(line);
  }

  if (!LOGOUT_DEBUG_ENABLED) {
    return;
  }

  persistWebLogoutLog(line);
}
