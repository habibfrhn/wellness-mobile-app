import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import { secureStoreChunked } from "./secureStoreChunked";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in apps/mobile/.env"
  );
}

export const AUTH_CALLBACK = "wellnessapp://auth/callback";
export const AUTH_RESET = "wellnessapp://auth/reset";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: secureStoreChunked,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});
