# Admin Analytics Audit (Current MVP State)

## End-to-end pipeline

1. Audio player hooks create a `play_session_id` for each audio play lifecycle.
2. The first **“Mulai”** in that lifecycle emits `audio_start` through `trackEvent()`.
3. Pause/resume within the same lifecycle does not emit another start.
4. Playback reaching at least 80% progress emits `audio_finish` once for the same `play_session_id`.
5. Events are queued/batched client-side in `src/services/analytics.ts`.
6. Events are sent to the `track-analytics-event` edge function.
7. The edge function validates method, CORS, auth token, payload, rate limits, and audio session fields.
8. The edge function writes audio usage to `public.audio_play_sessions` with idempotent starts and one finish per session.
9. Admin dashboard (`/admin`) loads server-guarded RPC data through:
   - `src/services/adminAnalytics.ts`
   - `src/hooks/useAdminAnalytics.ts`
10. UI renders one audio usage table with audio name, starts, and finishes.

## Authorization model

- Admin route visibility on web is not sufficient by itself.
- Backend `public.is_admin()` and RPC permissions enforce actual access.
- `public.admin_users` is the source of admin mapping.
- `audio_play_sessions` has no direct anon/authenticated client access; ingestion uses the service role inside the edge function.

## Dashboard range/filter behavior

- Supported ranges: Today, 7 days, 1 month, 3 months, 6 months, and 1 year.
- All rows use the selected range.
- Starts are counted by `started_at` within the range.
- Finishes are counted by `finished_at` within the range.

## Data accuracy rules

- `play_session_id` is the idempotency key for starts.
- Duplicate `audio_start` events for the same `play_session_id` are ignored.
- `audio_finish` updates only an unfinished matching session.
- Finish progress must be between `0.8` and `1.0`.
- Audio IDs are normalized and validated before storage.

## Notes

- This dashboard is intentionally MVP-scoped and not a full BI system.
- Historical `analytics_events` are not the source of truth for the current admin audio table.
- If schema/event names change, update client event emitter, edge function validation, SQL constraints/RPCs, and docs together.
