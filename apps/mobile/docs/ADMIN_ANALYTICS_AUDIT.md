# Admin Analytics Audit (Current MVP State)

## End-to-end pipeline

1. Client emits events via `trackEvent()` in screens/hooks/services.
2. Events are queued/batched client-side (`src/services/analytics.ts`).
3. Events are sent to edge function `track-analytics-event`.
4. Edge function validates payload + applies rate limiting + inserts into analytics tables.
5. Admin dashboard (`/admin`) loads server-guarded RPCs through:
   - `src/services/adminAnalytics.ts`
   - `src/hooks/useAdminAnalytics.ts`
6. UI renders three sections:
   - Product actions
   - Audio engagement
   - Tailored session performance

## Authorization model

- Admin route visibility on web is not sufficient by itself.
- Backend `public.is_admin()` and RPC permissions enforce actual access.
- `public.admin_users` is the source of admin mapping.

## Current dashboard range/filter behavior

- Supported ranges in current UI: `7d`, `30d`, `90d`, `all`.
- All sections use the same selected range.

## Notes

- This dashboard is intentionally MVP-scoped and not a full BI system.
- If schema/event names change, update client event emitter, edge function validation, and SQL/RPC consumers together.
