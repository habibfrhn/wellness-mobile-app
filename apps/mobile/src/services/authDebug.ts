import { Platform } from "react-native";

type AuthDebugLevel = "info" | "warn" | "error";

const AUTH_DEBUG_STORAGE_KEY = "wellness.auth.lastEvent";

function safeSerialize(payload: Record<string, unknown>) {
  try {
    return JSON.stringify(payload);
  } catch {
    return JSON.stringify({ message: "serialization_failed" });
  }
}

export function logAuthDebugEvent(level: AuthDebugLevel, event: string, details: Record<string, unknown> = {}) {
  const payload = {
    event,
    platform: Platform.OS,
    at: new Date().toISOString(),
    ...details,
  };

  const line = `[auth] ${safeSerialize(payload)}`;

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.info(line);
  }

  if (Platform.OS !== "web" || typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_DEBUG_STORAGE_KEY, line);
}
