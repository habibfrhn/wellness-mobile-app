import { supabase } from "./supabase";

export type AdminAnalyticsRange = "7d" | "30d" | "90d" | "12m" | "all";

export type AdminKpis = {
  total_audio_plays: number;
  tailored_completion_rate: number;
  signup_conversion_rate: number;
  audio_completes: number;
  audio_abandons: number;
};

export type AdminFunnel = {
  page_view_sessions: number;
  cta_sessions: number;
  signup_start_sessions: number;
  signup_complete_sessions: number;
};

export type AdminAudioSummary = {
  audio_id: string;
  plays: number;
  completes: number;
  abandons: number;
  completion_rate: number;
  abandon_rate: number;
};

export type AdminMonthlyRow = {
  month_start: string;
  audio_plays: number;
  signup_completes: number;
  tailored_completes: number;
};

export async function fetchAdminKpis(range: AdminAnalyticsRange) {
  const { data, error } = await supabase.rpc("admin_analytics_kpis", { range_key: range }).single();
  return { data: (data as AdminKpis | null) ?? null, error };
}

export async function fetchAdminFunnel(range: AdminAnalyticsRange) {
  const { data, error } = await supabase.rpc("admin_analytics_funnel", { range_key: range }).single();
  return { data: (data as AdminFunnel | null) ?? null, error };
}

export async function fetchAdminAudioSummary(range: AdminAnalyticsRange) {
  const { data, error } = await supabase.rpc("admin_analytics_audio_summary", { range_key: range });
  const normalizedRows = ((data as AdminAudioSummary[] | null) ?? []).map((row) => ({
    audio_id: row.audio_id || "unknown_audio",
    plays: Number(row.plays) || 0,
    completes: Number(row.completes) || 0,
    abandons: Number(row.abandons) || 0,
    completion_rate: Number(row.completion_rate) || 0,
    abandon_rate: Number(row.abandon_rate) || 0,
  }));
  return { data: normalizedRows, error };
}

export async function fetchAdminMonthly12m() {
  const { data, error } = await supabase.rpc("admin_analytics_monthly_12m");
  return { data: (data as AdminMonthlyRow[] | null) ?? [], error };
}
