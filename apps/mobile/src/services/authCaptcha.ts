import { Platform } from "react-native";

export const TURNSTILE_SITE_KEY = process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

export function isTurnstileEnabled() {
  return Platform.OS === "web" && TURNSTILE_SITE_KEY.length > 0;
}
