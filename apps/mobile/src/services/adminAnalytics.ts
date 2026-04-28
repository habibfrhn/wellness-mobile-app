import { supabase } from "./supabase";
import {
  isAdminUnauthorizedErrorCore,
  normalizeAudioRows,
  normalizeProductActions,
  normalizeTailoredRows,
} from "./adminAnalyticsCore";

export type AdminAnalyticsRange = "7d" | "30d" | "90d" | "all";

export type AdminProductActions = {
  home_sleep_clicks: number;
  tailored_session_selections: number;
  tailored_session_starts: number;
  successful_signups: number;
};

export type AdminAudioEngagementRow = {
  audio_id: string;
  clicks: number;
  starts: number;
  completes: number;
  abandons: number;
  completion_rate: number;
};

export type AdminTailoredSessionRow = {
  session_mode: "calm_mind" | "release_accept";
  selections: number;
  starts: number;
  completes: number;
  dropoffs: number;
  completion_rate: number;
};

type SupabaseLikeError = {
  message?: string | null;
  code?: string | null;
};

export function isAdminUnauthorizedError(error: SupabaseLikeError | null | undefined) {
  return isAdminUnauthorizedErrorCore(error);
}

export async function fetchAdminProductActions(range: AdminAnalyticsRange) {
  const { data, error } = await supabase.rpc("admin_analytics_product_actions", { range_key: range }).single();
  const row = (data as AdminProductActions | null) ?? null;
  return {
    data: normalizeProductActions(row),
    error,
  };
}

export async function fetchAdminAudioEngagement(range: AdminAnalyticsRange) {
  const { data, error } = await supabase.rpc("admin_analytics_audio_engagement", { range_key: range });

  return { data: normalizeAudioRows((data as AdminAudioEngagementRow[] | null) ?? []), error };
}

export async function fetchAdminTailoredSessions(range: AdminAnalyticsRange) {
  const { data, error } = await supabase.rpc("admin_analytics_tailored_sessions", { range_key: range });

  return { data: normalizeTailoredRows((data as AdminTailoredSessionRow[] | null) ?? []), error };
}
