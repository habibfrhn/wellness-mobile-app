import { Platform } from "react-native";

const DEFAULT_LOCAL_WEB_ORIGIN = "http://localhost:8081";

export const WEB_AUTH_CALLBACK_PATH = "/auth/callback";
export const WEB_AUTH_RESET_PATH = "/auth/reset";
const WEB_EXPO_ROUTE_PREFIX = "/--";

function normalizeOrigin(origin: string) {
  return origin.endsWith("/") ? origin.slice(0, -1) : origin;
}

function isLocalDevOrigin(origin: string) {
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
}

export function isAllowedWebOrigin(origin: string) {
  const configuredOrigins = (process.env.EXPO_PUBLIC_WEB_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((value: string) => value.trim())
    .filter(Boolean)
    .map((value: string) => normalizeOrigin(value.toLowerCase()));

  if (configuredOrigins.length > 0) {
    return configuredOrigins.includes(normalizeOrigin(origin.toLowerCase()));
  }

  if (origin.startsWith("https://")) {
    return true;
  }

  return isLocalDevOrigin(origin);
}

export function getWebAppOrigin() {
  const isProductionBuild = process.env.NODE_ENV === "production";
  const configuredOrigin = process.env.EXPO_PUBLIC_WEB_ORIGIN?.trim();
  if (configuredOrigin && isAllowedWebOrigin(configuredOrigin)) {
    return normalizeOrigin(configuredOrigin);
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    const detectedOrigin = normalizeOrigin(window.location.origin);
    if (isAllowedWebOrigin(detectedOrigin)) {
      return detectedOrigin;
    }
  }

  if (isProductionBuild) {
    return null;
  }

  return DEFAULT_LOCAL_WEB_ORIGIN;
}

export function buildAuthRedirectPath(flow: "callback" | "reset") {
  if (Platform.OS !== "web") {
    return `wellnessapp://auth/${flow}`;
  }

  const origin = getWebAppOrigin();
  if (!origin) {
    return "";
  }

  return `${origin}${flow === "callback" ? WEB_AUTH_CALLBACK_PATH : WEB_AUTH_RESET_PATH}`;
}

export function getWebAuthPath(pathname?: string | null): "callback" | "reset" | null {
  const value = (pathname ?? "").replace(/\/+$/, "") || "/";
  const normalizedPath = value.startsWith(WEB_EXPO_ROUTE_PREFIX)
    ? value.slice(WEB_EXPO_ROUTE_PREFIX.length) || "/"
    : value;

  if (normalizedPath === WEB_AUTH_CALLBACK_PATH) {
    return "callback";
  }

  if (normalizedPath === WEB_AUTH_RESET_PATH) {
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
