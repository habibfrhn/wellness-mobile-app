import { createClient } from "npm:@supabase/supabase-js@2";

export type RateLimitRule = {
  action: string;
  windowSeconds: number;
  limit: number;
};

type RateLimitRpcResult = {
  allowed: boolean;
  current_count: number;
  limit_value: number;
  remaining: number;
  retry_after_seconds: number;
};

export type RateLimitDecision = {
  allowed: boolean;
  retryAfterSeconds: number;
  currentCount: number;
  limit: number;
  remaining: number;
  rule: RateLimitRule;
};

export async function enforceRateLimit(
  adminClient: ReturnType<typeof createClient>,
  principalKey: string,
  rule: RateLimitRule
): Promise<RateLimitDecision> {
  const { data, error } = await adminClient.rpc("check_and_increment_rate_limit", {
    p_principal_key: principalKey,
    p_action: rule.action,
    p_window_seconds: rule.windowSeconds,
    p_limit: rule.limit,
  });

  if (error || !Array.isArray(data) || data.length !== 1) {
    throw new Error(`RATE_LIMIT_RPC_FAILED:${error?.message ?? "invalid response"}`);
  }

  const result = data[0] as RateLimitRpcResult;

  return {
    allowed: result.allowed,
    retryAfterSeconds: result.retry_after_seconds,
    currentCount: result.current_count,
    limit: result.limit_value,
    remaining: result.remaining,
    rule,
  };
}

export function pickMostRestrictiveLimit(decisions: RateLimitDecision[]) {
  return decisions.reduce((current, next) => {
    if (!current) return next;
    if (next.allowed) return current;
    if (next.retryAfterSeconds > current.retryAfterSeconds) return next;
    return current;
  }, decisions[0]);
}
