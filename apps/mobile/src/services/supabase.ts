import "react-native-url-polyfill/auto";
import { AppState, Platform } from "react-native";
import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, processLock, type SupabaseClient } from "@supabase/supabase-js";

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
  return createClient(supabaseUrl ?? FALLBACK_SUPABASE_URL, supabaseAnonKey ?? FALLBACK_SUPABASE_ANON_KEY, {
    auth: {
      ...(Platform.OS !== "web" ? { storage: AsyncStorage } : {}),
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


function getWebBaseUrl() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  const fallback = Linking.createURL("/");
  return fallback.endsWith("/") ? fallback.slice(0, -1) : fallback;
}

function buildAuthRedirectPath(flow: "callback" | "reset") {
  if (Platform.OS === "web") {
    return `${getWebBaseUrl()}/?auth_flow=${flow}`;
  }

  return `wellnessapp://auth/${flow}`;
}

if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

export const AUTH_CALLBACK = buildAuthRedirectPath("callback");
export const AUTH_RESET = buildAuthRedirectPath("reset");
