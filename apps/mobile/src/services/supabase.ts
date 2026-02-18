import "react-native-url-polyfill/auto";
import { AppState, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, processLock } from "@supabase/supabase-js";

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

export const supabase = createClient(
  supabaseUrl ?? FALLBACK_SUPABASE_URL,
  supabaseAnonKey ?? FALLBACK_SUPABASE_ANON_KEY,
  {
    auth: {
      ...(Platform.OS !== "web" ? { storage: AsyncStorage } : {}),
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      lock: processLock,
    },
  }
);

if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

export const AUTH_CALLBACK = "wellnessapp://auth/callback";
export const AUTH_RESET = "wellnessapp://auth/reset";
