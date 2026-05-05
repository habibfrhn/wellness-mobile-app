import { supabase } from "./supabase";

export type AdminAnalyticsRange = "7d" | "30d" | "90d" | "all";

export type AdminProductActions = {
  home_sleep_clicks: number;
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

type SupabaseLikeError = {
  message?: string | null;
  code?: string | null;
};

export function isAdminUnauthorizedError(error: SupabaseLikeError | null | undefined) {
  const normalizedMessage = (error?.message ?? "").toLowerCase();
  const normalizedCode = (error?.code ?? "").toLowerCase();
  return (
    normalizedMessage.includes("admin access required") ||
    normalizedMessage.includes("not authorized") ||
    normalizedCode === "42501"
  );
}

export async function fetchAdminProductActions(range: AdminAnalyticsRange) {
  const { data, error } = await supabase.rpc("admin_analytics_product_actions", { range_key: range }).single();
  const row = (data as AdminProductActions | null) ?? null;
  return {
    data: row
      ? {
          home_sleep_clicks: Number(row.home_sleep_clicks) || 0,
          successful_signups: Number(row.successful_signups) || 0,
        }
      : null,
    error,
  };
}

export async function fetchAdminAudioEngagement(range: AdminAnalyticsRange) {
  const { data, error } = await supabase.rpc("admin_analytics_audio_engagement", { range_key: range });

  const normalizedRows = ((data as AdminAudioEngagementRow[] | null) ?? []).map((row) => ({
    audio_id: row.audio_id || "unknown_audio",
    clicks: Number(row.clicks) || 0,
    starts: Number(row.starts) || 0,
    completes: Number(row.completes) || 0,
    abandons: Number(row.abandons) || 0,
    completion_rate: Number(row.completion_rate) || 0,
  }));

  return { data: normalizedRows, error };
}

