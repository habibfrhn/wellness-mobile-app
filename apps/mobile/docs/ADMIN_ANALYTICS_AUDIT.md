# Admin Analytics Audit (Current MVP State)

## End-to-end pipeline

1. `useAudioUsageTracking` creates and owns one `play_session_id` for each audio play lifecycle.
2. The first **“Mulai”** in that lifecycle emits `audio_start` through `trackEvent()`.
3. `audio_start` / `audio_finish` request an immediate queue flush so the admin dashboard can update after pressing **Refresh** without waiting for the normal batch interval.
4. Pause/resume within the same lifecycle does not emit another start.
5. Playback reaching at least 80% progress emits `audio_finish` once for the same `play_session_id`.
6. Events are still queued/batched client-side in `src/services/analytics.ts` for resilience and retry behavior.
7. Events are sent to the `track-analytics-event` edge function.
8. The edge function validates method, CORS, auth token, payload, rate limits, and audio session fields.
9. The edge function increments analytics ingest rate limits through `public.increment_analytics_ingest_rate_limit`; the database keeps both the 4-argument batched RPC and 3-argument compatibility wrapper for deployed function compatibility.
10. The edge function writes audio usage to `public.audio_play_sessions` with idempotent starts and one finish per session.
11. Admin dashboard (`/admin`) loads server-guarded RPC data through:
   - `src/services/adminAnalytics.ts`
   - `src/services/adminAnalyticsErrors.ts`
   - `src/hooks/useAdminAnalytics.ts`
12. UI renders one audio usage table with audio name, starts, and finishes.

## Authorization model

- Admin route visibility on web is not sufficient by itself.
- Backend `public.is_admin()` and RPC permissions enforce actual access.
- `public.admin_users` is the source of admin mapping; SQL Editor checks should simulate `request.jwt.claim.sub` when validating RPC behavior manually.
- `audio_play_sessions` has no direct anon/authenticated client access; ingestion uses the service role inside the edge function.

## Dashboard range/filter behavior

- Supported ranges: Today, 7 days, 1 month, 3 months, 6 months, and 1 year.
- All rows use the selected range.
- Starts are counted by `started_at` within the range.
- Finishes are counted by `finished_at` within the range.
- Pressing **Refresh** calls `admin_audio_usage_analytics(range_key)` again and updates the last-updated timestamp after a successful response.
- A failed refresh keeps any previously loaded rows visible and shows a specific helper message instead of the generic “Silakan coba lagi.”

## Component/module structure

- `useAudioUsageTracking`: shared native/web play-session tracking, finish threshold, and immediate flush behavior.
- `analytics.ts`: generic analytics queue, payload sanitation, session ID, and network flush logic.
- `track-analytics-event`: edge ingestion validation, rate limiting via `increment_analytics_ingest_rate_limit`, idempotent `audio_play_sessions` writes, and non-session `analytics_events` persistence.
- `adminAnalytics.ts`: small RPC fetcher and row normalization.
- `adminAnalyticsErrors.ts`: maps backend/RPC failures to actionable dashboard helper states.
- `useAdminAnalytics`: dashboard fetch state, refresh state, unauthorized handling, and last-updated state.
- `AdminDashboardHeader`, `AdminDateRangeFilter`, `AdminStatusMessage`, and `AdminAudioSummaryPanel`: focused UI pieces.

## Data accuracy rules

- `play_session_id` is the idempotency key for starts.
- Duplicate `audio_start` events for the same `play_session_id` are ignored.
- `audio_finish` updates only an unfinished matching session.
- Finish progress must be between `0.8` and `1.0`.
- Audio IDs are normalized and validated before storage.
- Restarts, stops, and track changes close/reset the current usage session so a subsequent **“Mulai”** can create a fresh start.
- Uncataloged historical IDs are appended to the admin table by raw `audio_id` so data is not hidden when the catalog changes.

## Notes

- This dashboard is intentionally MVP-scoped and not a full BI system.
- `analytics_events` are not the source of truth for the current admin audio table.
- Legacy `admin_analytics_*` RPCs and `analytics_*_summary` views were removed by `20260507120000_remove_unused_admin_analytics_objects.sql`; tailored `analytics_events` names/validation were removed by `20260507130000_remove_tailored_session_analytics_remnants.sql`. See `DATABASE_OBJECT_AUDIT.md` for dependency details and retained-object rationale.
- Keep both analytics rate-limit RPC overloads unless every deployed edge-function caller has been updated and old deployments are no longer expected to run.
- Applied migrations should remain immutable; use a new migration for follow-up fixes after a migration has reached a shared or production database.
- Analytics backend failures disable only the current runtime session; old persisted backend-failure markers are cleared so a fixed backend can recover without asking users to clear browser storage.
- If schema/event names change, update `useAudioUsageTracking`, `analytics.ts`, edge function validation, SQL constraints/RPCs, dashboard error mapping, and docs together.
