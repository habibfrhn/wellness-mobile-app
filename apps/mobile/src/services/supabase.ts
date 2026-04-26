import "react-native-url-polyfill/auto";
import { AppState, Platform } from "react-native";
import { createClient, processLock, type SupabaseClient } from "@supabase/supabase-js";
import { buildAuthRedirectPath } from "./webAuth";
import { supabaseAuthStorage } from "./authStorage";
import { logAuthDebugEvent } from "./authDebug";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const FALLBACK_SUPABASE_URL = "https://placeholder.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY = "missing-anon-key";

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);
export const missingSupabaseEnvMessage = [
  "Missing Supabase env.",
  'Set "EXPO_PUBLIC_SUPABASE_URL" and "EXPO_PUBLIC_SUPABASE_ANON_KEY".',
  "- Local dev: put them in apps/mobile/.env (loaded by Expo).",
  "- EAS builds: set them in EAS environment variables (development/preview/production).",
].join(" ");

type SupabaseClientSingleton = SupabaseClient;

type GlobalWithSupabase = typeof globalThis & {
  __wellnessSupabaseClient?: SupabaseClientSingleton;
};

const globalRef = globalThis as GlobalWithSupabase;

function createSupabaseClient(): SupabaseClientSingleton {
  logAuthDebugEvent("info", "supabase_client_init", {
    hasSupabaseUrl: Boolean(supabaseUrl),
    hasSupabaseAnonKey: Boolean(supabaseAnonKey),
    hasSupabaseEnv,
    platform: Platform.OS,
  });
  return createClient(supabaseUrl ?? FALLBACK_SUPABASE_URL, supabaseAnonKey ?? FALLBACK_SUPABASE_ANON_KEY, {
    auth: {
      storage: supabaseAuthStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      lock: processLock,
    },
  });
}

export const supabase = globalRef.__wellnessSupabaseClient ?? createSupabaseClient();

if (!globalRef.__wellnessSupabaseClient) {
  globalRef.__wellnessSupabaseClient = supabase;
}

if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

export const AUTH_CALLBACK = buildAuthRedirectPath("callback");
export const AUTH_RESET = buildAuthRedirectPath("reset");
export const hasValidAuthRedirects = Platform.OS !== "web" || (AUTH_CALLBACK.length > 0 && AUTH_RESET.length > 0);

logAuthDebugEvent(hasValidAuthRedirects ? "info" : "warn", "supabase_auth_redirect_config", {
  platform: Platform.OS,
  hasValidAuthRedirects,
  hasCallbackRedirect: AUTH_CALLBACK.length > 0,
  hasResetRedirect: AUTH_RESET.length > 0,
});
