# Admin Analytics Audit (Current MVP State)

## End-to-end data path

1. Client emits events via `trackEvent()` (`apps/mobile/src/services/analytics.ts`).
2. Events are queued and batched client-side.
3. Client posts payloads to edge function `track-analytics-event`.
4. Edge function validates event schema, enforces origin and rate limits, and inserts into analytics tables.
5. Admin dashboard (`/admin`) fetches server-guarded RPCs via:
   - `apps/mobile/src/services/adminAnalytics.ts`
   - `apps/mobile/src/hooks/useAdminAnalytics.ts`
6. UI renders three sections:
   - Product actions
   - Audio engagement
   - Tailored session performance

## Authorization model

- Web route visibility is not sufficient for access.
- Backend checks (`public.is_admin()`) enforce actual permissions.
- `public.admin_users` mapping is the source of admin authorization.

## Range/filter behavior

- Current supported ranges: `7d`, `30d`, `90d`, `all`.
- Selected range is applied across all sections.

## Event/RPC change safety note

If event names or schema change, update together in the same release:

- client emitter (`analytics.ts`),
- edge function validation (`supabase/functions/track-analytics-event/index.ts`),
- SQL constraints/RPC consumers in migrations.
