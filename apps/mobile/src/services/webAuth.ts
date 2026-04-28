import { Platform } from "react-native";

import { getWebAppOriginForContext, getWebAuthPathFromPathname, isAllowedWebOriginWithEnv } from "./webAuthCore";

export const WEB_AUTH_CALLBACK_PATH = "/auth/callback";
export const WEB_AUTH_RESET_PATH = "/auth/reset";

export function isAllowedWebOrigin(origin: string) {
  return isAllowedWebOriginWithEnv(origin, process.env.EXPO_PUBLIC_WEB_ALLOWED_ORIGINS);
}

export function getWebAppOrigin() {
  return getWebAppOriginForContext({
    nodeEnv: process.env.NODE_ENV,
    configuredOrigin: process.env.EXPO_PUBLIC_WEB_ORIGIN,
    detectedOrigin: typeof window !== "undefined" && window.location?.origin ? window.location.origin : null,
    allowedOriginsEnv: process.env.EXPO_PUBLIC_WEB_ALLOWED_ORIGINS,
  });
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
  return getWebAuthPathFromPathname(pathname);
}

export function replaceWebUrl(pathname = "/") {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return;
  }

  window.history.replaceState({}, "", pathname);
}
