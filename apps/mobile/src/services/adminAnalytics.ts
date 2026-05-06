import { supabase } from "./supabase";

export type AdminAnalyticsRange = "today" | "7d" | "1m" | "3m" | "6m" | "1y";

export type AdminAudioUsageRow = {
  audio_id: string;
  starts: number;
  finishes: number;
};

export async function fetchAdminAudioUsage(range: AdminAnalyticsRange) {
  const { data, error } = await supabase.rpc("admin_audio_usage_analytics", { range_key: range });

  const normalizedRows = ((data as AdminAudioUsageRow[] | null) ?? []).map((row) => ({
    audio_id: row.audio_id || "unknown_audio",
    starts: Number(row.starts) || 0,
    finishes: Number(row.finishes) || 0,
  }));

  return { data: normalizedRows, error };
}
