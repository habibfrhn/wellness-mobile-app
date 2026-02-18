import { getNightDateKey } from "./nightStreak";
import { supabase } from "./supabase";

export type NightSessionMode = "calm_mind" | "release_accept";

type SaveNightSessionInput = {
  mode: NightSessionMode;
  stressBefore: number;
  stressAfter: number;
  completedAt?: Date;
};

/**
 * Persist one completed night session row to Supabase.
 *
 * This helper is intentionally resilient:
 * - it never throws (returns `false` on failure)
 * - offline/network/table issues are silently handled by returning `false`
 */
export async function saveNightSessionCompletion({
  mode,
  stressBefore,
  stressAfter,
  completedAt = new Date(),
}: SaveNightSessionInput): Promise<boolean> {
  try {
    const { data, error: userError } = await supabase.auth.getUser();
    if (userError || !data.user?.id) {
      return false;
    }

    const payload = {
      user_id: data.user.id,
      date_key: getNightDateKey(completedAt),
      mode,
      stress_before: stressBefore,
      stress_after: stressAfter,
      completed_at: completedAt.toISOString(),
    };

    const { error } = await supabase.from("night_sessions").insert(payload);
    if (error) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
