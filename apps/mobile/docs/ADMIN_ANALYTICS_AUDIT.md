# Admin Analytics Audit (Current MVP State)

## End-to-end pipeline

1. Client emits events via `trackEvent()` from screens/hooks/services.
2. Events are queued/batched in `apps/mobile/src/services/analytics.ts`.
3. Events are sent to edge function `track-analytics-event`.
4. Edge function validates payload, applies rate limiting, and inserts analytics rows.
5. Admin dashboard (`/admin`) loads RPC data via:
   - `apps/mobile/src/services/adminAnalytics.ts`
   - `apps/mobile/src/hooks/useAdminAnalytics.ts`
6. UI renders two dashboard sections:
   - Tailored session performance + product actions summary (`home_sleep_clicks`, `successful_signups`)
   - Audio engagement table

## Authorization model

- Web route visibility is not authorization.
- Backend `public.is_admin()` + RPC permissions enforce access.
- `public.admin_users` is the admin mapping source of truth.

## Range/filter behavior

- Supported ranges in UI: `7d`, `30d`, `90d`, `all`.
- The selected range is applied to all dashboard data panels.

## Notes

- Dashboard is intentionally MVP-scoped (operational product analytics, not full BI).
- If event schema changes, update client emitter + edge function validation + SQL/RPC consumers together.
