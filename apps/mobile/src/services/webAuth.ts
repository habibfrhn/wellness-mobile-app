import { Platform } from "react-native";

const DEFAULT_LOCAL_WEB_ORIGIN = "http://localhost:8081";

export const WEB_AUTH_CALLBACK_PATH = "/auth/callback";
export const WEB_AUTH_RESET_PATH = "/auth/reset";

function normalizeOrigin(origin: string) {
  return origin.endsWith("/") ? origin.slice(0, -1) : origin;
}

export function getWebAppOrigin() {
  const configuredOrigin = process.env.EXPO_PUBLIC_WEB_ORIGIN?.trim();
  if (configuredOrigin) {
    return normalizeOrigin(configuredOrigin);
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return normalizeOrigin(window.location.origin);
  }

  return DEFAULT_LOCAL_WEB_ORIGIN;
}

export function buildAuthRedirectPath(flow: "callback" | "reset") {
  if (Platform.OS !== "web") {
    return `wellnessapp://auth/${flow}`;
  }

  const origin = getWebAppOrigin();
  return `${origin}${flow === "callback" ? WEB_AUTH_CALLBACK_PATH : WEB_AUTH_RESET_PATH}`;
}

export function getWebAuthPath(pathname?: string | null): "callback" | "reset" | null {
  const value = (pathname ?? "").replace(/\/+$/, "") || "/";

  if (value === WEB_AUTH_CALLBACK_PATH) {
    return "callback";
  }

  if (value === WEB_AUTH_RESET_PATH) {
    return "reset";
  }

  return null;
}

export function replaceWebUrl(pathname = "/") {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return;
  }

  window.history.replaceState({}, "", pathname);
}
