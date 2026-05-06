type SupabaseLikeError = {
  message?: string | null;
  code?: string | null;
};

export type AdminAnalyticsErrorKind = "unauthorized" | "backend_missing" | "query_invalid" | "unknown";

export function getAdminAnalyticsErrorKind(error: SupabaseLikeError | null | undefined): AdminAnalyticsErrorKind {
  const normalizedMessage = (error?.message ?? "").toLowerCase();
  const normalizedCode = (error?.code ?? "").toLowerCase();

  if (
    normalizedMessage.includes("admin access required") ||
    normalizedMessage.includes("not authorized") ||
    normalizedCode === "42501"
  ) {
    return "unauthorized";
  }

  if (
    normalizedCode === "pgrst202" ||
    normalizedCode === "42883" ||
    normalizedMessage.includes("admin_audio_usage_analytics") ||
    normalizedMessage.includes("could not find the function") ||
    (normalizedMessage.includes("function") && normalizedMessage.includes("not found"))
  ) {
    return "backend_missing";
  }

  if (
    normalizedCode === "42702" ||
    normalizedCode === "42p01" ||
    normalizedMessage.includes("ambiguous") ||
    normalizedMessage.includes("audio_play_sessions")
  ) {
    return "query_invalid";
  }

  return "unknown";
}

