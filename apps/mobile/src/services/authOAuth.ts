import { Platform } from "react-native";
import * as Linking from "expo-linking";

import { AUTH_CALLBACK, hasValidAuthRedirects, supabase } from "./supabase";
import { setNextAuthRoute } from "./authStart";
import { logAuthDebugEvent } from "./authDebug";

type ContinueWithGoogleOptions = {
  nextRoute?: "Login" | "SignUp";
};

export async function continueWithGoogle({ nextRoute = "Login" }: ContinueWithGoogleOptions = {}) {
  const currentOrigin =
    Platform.OS === "web" && typeof window !== "undefined" ? window.location.origin : null;

  if (!hasValidAuthRedirects) {
    logAuthDebugEvent("error", "oauth_google_start_blocked", {
      reason: "AUTH_REDIRECT_MISCONFIGURED",
      nextRoute,
      redirectTo: AUTH_CALLBACK,
      currentOrigin,
    });
    throw new Error("AUTH_REDIRECT_MISCONFIGURED");
  }

  logAuthDebugEvent("info", "oauth_google_start", {
    nextRoute,
    redirectTo: AUTH_CALLBACK,
    currentOrigin,
  });

  await setNextAuthRoute(nextRoute);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: AUTH_CALLBACK,
      queryParams: {
        prompt: "select_account",
      },
      skipBrowserRedirect: Platform.OS !== "web",
    },
  });

  if (error) {
    logAuthDebugEvent("error", "oauth_google_start_failed", {
      nextRoute,
      redirectTo: AUTH_CALLBACK,
      error: error.message,
    });
    throw error;
  }

  logAuthDebugEvent("info", "oauth_google_start_success", {
    nextRoute,
    redirectTo: AUTH_CALLBACK,
    hasAuthUrl: Boolean(data?.url),
  });

  if (Platform.OS !== "web" && data?.url) {
    await Linking.openURL(data.url);
  }
}
