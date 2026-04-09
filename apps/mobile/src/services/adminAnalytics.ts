import { supabase } from "./supabase";

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

export async function fetchAdminProductActions(range: AdminAnalyticsRange) {
  const { data, error } = await supabase.rpc("admin_analytics_product_actions", { range_key: range }).single();
  const row = (data as AdminProductActions | null) ?? null;
  return {
    data: row
      ? {
          home_sleep_clicks: Number(row.home_sleep_clicks) || 0,
          tailored_session_selections: Number(row.tailored_session_selections) || 0,
          tailored_session_starts: Number(row.tailored_session_starts) || 0,
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

export async function fetchAdminTailoredSessions(range: AdminAnalyticsRange) {
  const { data, error } = await supabase.rpc("admin_analytics_tailored_sessions", { range_key: range });

  const normalizedRows = ((data as AdminTailoredSessionRow[] | null) ?? []).filter(
    (row): row is AdminTailoredSessionRow => row.session_mode === "calm_mind" || row.session_mode === "release_accept",
  );

  return { data: normalizedRows, error };
}
