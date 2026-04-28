import type { AdminAudioEngagementRow, AdminProductActions, AdminTailoredSessionRow } from "./adminAnalytics";

type SupabaseLikeError = {
  message?: string | null;
  code?: string | null;
};

export function isAdminUnauthorizedErrorCore(error: SupabaseLikeError | null | undefined) {
  const normalizedMessage = (error?.message ?? "").toLowerCase();
  const normalizedCode = (error?.code ?? "").toLowerCase();
  return (
    normalizedMessage.includes("admin access required") ||
    normalizedMessage.includes("not authorized") ||
    normalizedCode === "42501"
  );
}

export function normalizeProductActions(row: AdminProductActions | null) {
  if (!row) {
    return null;
  }

  return {
    home_sleep_clicks: Number(row.home_sleep_clicks) || 0,
    tailored_session_selections: Number(row.tailored_session_selections) || 0,
    tailored_session_starts: Number(row.tailored_session_starts) || 0,
    successful_signups: Number(row.successful_signups) || 0,
  };
}

export function normalizeAudioRows(rows: AdminAudioEngagementRow[] | null) {
  return (rows ?? []).map((row) => ({
    audio_id: row.audio_id || "unknown_audio",
    clicks: Number(row.clicks) || 0,
    starts: Number(row.starts) || 0,
    completes: Number(row.completes) || 0,
    abandons: Number(row.abandons) || 0,
    completion_rate: Number(row.completion_rate) || 0,
  }));
}

export function normalizeTailoredRows(rows: AdminTailoredSessionRow[] | null) {
  return (rows ?? []).filter(
    (row): row is AdminTailoredSessionRow => row.session_mode === "calm_mind" || row.session_mode === "release_accept",
  );
}
