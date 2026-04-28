# Admin Analytics Audit (Current MVP)

## End-to-end pipeline

1. Client emits analytics events via `trackEvent()`.
2. Events are queued/batched in `src/services/analytics.ts`.
3. Batches are sent to edge function `track-analytics-event`.
4. Function enforces payload validation + CORS + rate limiting and inserts into `analytics_events`.
5. Admin dashboard (`/admin`) fetches data through guarded RPCs in `src/services/adminAnalytics.ts`.
6. UI renders three sections:
   - Product actions
   - Audio engagement
   - Tailored session performance

## Event schema currently accepted by ingestion function

- `landing_page_view`
- `landing_cta_click`
- `home_sleep_cta_click`
- `audio_click`
- `signup_start`
- `signup_complete`
- `audio_play`
- `audio_complete`
- `audio_abandon`
- `tailored_session_select`
- `tailored_session_start`
- `tailored_session_complete`
- `tailored_session_dropoff`

## Authorization model

- Web route visibility alone is not authorization.
- Backend enforcement is through `public.is_admin()` + RPC permissions.
- `public.admin_users` is the admin mapping source.

## Dashboard range behavior

- Supported ranges: `7d`, `30d`, `90d`, `all`.
- All dashboard sections use the currently selected range.

## MVP note

If event schema changes, update these together in one change:

- client emitter/sanitization (`src/services/analytics.ts`),
- ingestion function validation (`supabase/functions/track-analytics-event/index.ts`),
- SQL constraints/RPC consumers in migrations.


## Regression tests

- `apps/mobile/src/services/__tests__/analyticsSchema.test.ts` covers client payload sanitization/shape validation.
- `supabase/functions/track-analytics-event/__tests__/validation.test.ts` covers ingestion payload and CORS allowlist behavior.
