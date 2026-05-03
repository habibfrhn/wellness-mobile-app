# Edge Function Rate Limiting

## Architecture

Rate limiting is now centralized around two reusable layers:

1. **Database primitive**: `public.check_and_increment_rate_limit(...)` in migration `20260503120000_rebuild_edge_function_rate_limits.sql`.
   - Atomic check + increment in one RPC call.
   - Fixed-window counters stored in `public.request_rate_limits`.
   - Returns `allowed`, `current_count`, `remaining`, and `retry_after_seconds`.
2. **Edge helper**: `supabase/functions/_shared/rateLimit.ts`.
   - `enforceRateLimit(...)` wraps RPC invocation and response validation.
   - `pickMostRestrictiveLimit(...)` selects the strongest block when multiple rules fail.

This separates responsibilities cleanly:
- SQL handles concurrency and data integrity.
- Shared TS helper handles function-side enforcement wiring.
- Individual Edge functions only declare business-specific rules.

## Current rules

### `resend-verification-email`
- Per-email: **1 request / 60s**
- Per-email: **6 requests / hour**
- Per-IP: **5 requests / 60s**
- Behavior on block: `429 RATE_LIMITED` with `retryAfterSec`.
- Behavior on subsystem outage: fail-open to provider-level protection (request continues, Supabase auth may still return provider rate-limit errors).

### `record-night-session`
- Per-user: **6 requests / 10 minutes**
- Behavior on block: `429 RATE_LIMITED` with `retryAfterSec`.
- Behavior on subsystem outage: `500 RATE_LIMIT_FAILED`.

### `delete-account-v2`
- Per-user: **3 requests / hour**
- Behavior on block: `429 RATE_LIMITED` with `retryAfterSec`.
- Behavior on subsystem outage: `503 RATE_LIMIT_UNAVAILABLE`.

## Edge cases and operations

- `retryAfterSec` is computed from the server-side window boundary; clients should honor it for UX cooldowns.
- Principal keys should be stable and scoped (`user:<id>`, hashed `email:<email>`, hashed `ip:<ip>`).
- Keep action names immutable once deployed; changing action names resets counters.
- Old tables/functions (`rate_limits`, `analytics_ingest_rate_limits`) are still used by older paths and analytics ingestion; migrate separately if needed.

## Maintenance guidance

When adding a new limiter:
1. Define a concise action name and a stable principal format.
2. Add one or more `RateLimitRule`s in the calling Edge function.
3. Reuse `_shared/rateLimit.ts` rather than embedding direct RPC logic.
4. Return explicit `retryAfterSec` for user-facing throttles.
5. Document the new rule in this file.
