import { Platform } from "react-native";
import * as Linking from "expo-linking";

import { AUTH_CALLBACK, hasValidAuthRedirects, supabase } from "./supabase";
import { setNextAuthRoute } from "./authStart";
import { logAuthDebugEvent } from "./authDebug";
import { isBlockedByProviderLock, lookupProviderLockByEmail, type ProviderLockLookupResult } from "./authProviderLock";

type ContinueWithGoogleOptions = {
  nextRoute?: "Login" | "SignUp";
  email?: string;
};

type ContinueWithGoogleResult =
  | { status: "started" }
  | {
      status: "blocked";
      reason: "missing_email" | "invalid_email" | "provider_lookup_unavailable" | "provider_mismatch";
      providerLockResult?: ProviderLockLookupResult;
    };

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
}

export async function continueWithGoogle({ nextRoute = "Login", email = "" }: ContinueWithGoogleOptions = {}): Promise<ContinueWithGoogleResult> {
  const currentOrigin =
    Platform.OS === "web" && typeof window !== "undefined" ? window.location.origin : null;
  const normalizedEmail = email.trim().toLowerCase();

  if (!hasValidAuthRedirects) {
    logAuthDebugEvent("error", "oauth_google_start_blocked", {
      reason: "AUTH_REDIRECT_MISCONFIGURED",
      nextRoute,
      redirectTo: AUTH_CALLBACK,
      currentOrigin,
    });
    throw new Error("AUTH_REDIRECT_MISCONFIGURED");
  }

  if (!normalizedEmail) {
    logAuthDebugEvent("warn", "oauth_google_start_blocked", {
      reason: "EMAIL_REQUIRED_FOR_PROVIDER_CHECK",
      nextRoute,
    });
    return { status: "blocked", reason: "missing_email" };
  }

  if (!isValidEmail(normalizedEmail)) {
    logAuthDebugEvent("warn", "oauth_google_start_blocked", {
      reason: "INVALID_EMAIL_FOR_PROVIDER_CHECK",
      nextRoute,
      emailDomain: normalizedEmail.split("@")[1] ?? null,
    });
    return { status: "blocked", reason: "invalid_email" };
  }

  const providerLockResult = await lookupProviderLockByEmail(normalizedEmail);
  logAuthDebugEvent("info", "oauth_google_provider_lookup_result", {
    nextRoute,
    emailDomain: normalizedEmail.split("@")[1] ?? null,
    lookupStatus: providerLockResult.status,
    lookupExists: providerLockResult.status === "ok" ? providerLockResult.exists : null,
    lookupProviderLock: providerLockResult.status === "ok" ? providerLockResult.providerLock : null,
    lookupProviders: providerLockResult.status === "ok" ? providerLockResult.providers : null,
  });

  if (providerLockResult.status === "unavailable") {
    return { status: "blocked", reason: "provider_lookup_unavailable", providerLockResult };
  }

  if (providerLockResult.exists && isBlockedByProviderLock(providerLockResult.providerLock, "google_oauth", "google")) {
    logAuthDebugEvent("warn", "oauth_google_start_blocked", {
      reason: "PROVIDER_LOCK_MISMATCH",
      nextRoute,
      emailDomain: normalizedEmail.split("@")[1] ?? null,
      providerLock: providerLockResult.providerLock,
      providers: providerLockResult.providers,
    });
    return { status: "blocked", reason: "provider_mismatch", providerLockResult };
  }

  logAuthDebugEvent("info", "oauth_google_start", {
    nextRoute,
    redirectTo: AUTH_CALLBACK,
    currentOrigin,
    emailDomain: normalizedEmail.split("@")[1] ?? null,
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

  return { status: "started" };
}
