import { Platform } from "react-native";

type AuthDebugLevel = "info" | "warn" | "error";

const AUTH_DEBUG_ENABLED = process.env.EXPO_PUBLIC_AUTH_DEBUG === "1";

function safeSerialize(payload: Record<string, unknown>) {
  try {
    return JSON.stringify(payload);
  } catch {
    return JSON.stringify({ message: "serialization_failed" });
  }
}

export function logAuthDebugEvent(level: AuthDebugLevel, event: string, details: Record<string, unknown> = {}) {
  const shouldLog = AUTH_DEBUG_ENABLED || Platform.OS === "web" || level !== "info";
  if (!shouldLog) {
    return;
  }

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

  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.localStorage.setItem("wellness.auth.lastEvent", line);
  }
}
