import { supabase } from "./supabase";

export type AdminAnalyticsRange = "1d" | "7d" | "30d";

export type AdminProductActions = {
  home_sleep_clicks: number;
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
};

export type AdminMonthlyComparisonRow = {
  month_start: string;
  home_sleep_clicks: number;
  audio_starts: number;
  audio_completes: number;
  tailored_starts: number;
  tailored_completes: number;
};

export async function fetchAdminProductActions(range: AdminAnalyticsRange) {
  const { data, error } = await supabase.rpc("admin_analytics_product_actions", { range_key: range }).single();
  return { data: (data as AdminProductActions | null) ?? null, error };
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

  const normalizedRows = ((data as AdminTailoredSessionRow[] | null) ?? [])
    .filter((row): row is AdminTailoredSessionRow => row.session_mode === "calm_mind" || row.session_mode === "release_accept")
    .map((row) => ({
      session_mode: row.session_mode,
      selections: Number(row.selections) || 0,
      starts: Number(row.starts) || 0,
      completes: Number(row.completes) || 0,
    }));

  return { data: normalizedRows, error };
}

export async function fetchAdminMonthlyComparison(monthsBack: number) {
  const { data, error } = await supabase.rpc("admin_analytics_monthly_comparison", { months_back: monthsBack });

  const normalizedRows = ((data as AdminMonthlyComparisonRow[] | null) ?? []).map((row) => ({
    month_start: row.month_start,
    home_sleep_clicks: Number(row.home_sleep_clicks) || 0,
    audio_starts: Number(row.audio_starts) || 0,
    audio_completes: Number(row.audio_completes) || 0,
    tailored_starts: Number(row.tailored_starts) || 0,
    tailored_completes: Number(row.tailored_completes) || 0,
  }));

  return { data: normalizedRows, error };
}
