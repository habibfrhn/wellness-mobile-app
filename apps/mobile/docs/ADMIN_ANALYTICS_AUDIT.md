# Admin Analytics Audit (Current)

## Data pipeline

1. Client emits events via `trackEvent()`.
2. Client queues/batches in `src/services/analytics.ts`.
3. Client posts to Edge Function: `track-analytics-event`.
4. Edge Function validates payload and applies rate limiting.
5. Dashboard fetches RPC-backed summaries via admin-only queries.

## Authorization

- `/admin` is web-only UI route.
- Real authorization is backend-enforced (`public.is_admin()` + admin RPC permissions).
- `public.admin_users` is the admin source-of-truth mapping.

## Current dashboard coverage

- Product actions
- Audio engagement
- Tailored session performance

Supported range filters in UI: `7d`, `30d`, `90d`, `all`.

## Change safety rules

If analytics event schema changes, update all of the following in one change:

- client event names/payload (`src/services/analytics.ts`)
- edge function validation (`supabase/functions/track-analytics-event`)
- SQL constraints/RPC consumers (`supabase/migrations/*`)
