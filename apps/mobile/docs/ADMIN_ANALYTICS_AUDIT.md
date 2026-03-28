# Admin Analytics Audit (MVP)

## Pipeline trace

1. Client tracking emits events via `trackEvent()` in:
   - `LandingScreen.web.tsx`
   - `SignUpScreen.tsx`
   - `useAudioPlayerSession.ts`
2. Events are inserted into `public.analytics_events`.
3. Admin-only RPCs aggregate metrics from `analytics_events` with a shared range filter.
4. Admin dashboard fetches RPCs through `services/adminAnalytics.ts` + `useAdminAnalytics`.
5. UI renders KPI/funnel/audio/monthly sections with loading/error/empty states.

## Findings (before refactor)

- No reusable time range filtering across dashboard sections.
- Audio completion/abandonment section could look blank when no rows.
- Aggregation logic spread across views/UI with inconsistent metric definitions.
- Direct view grants to authenticated role were broader than needed.

## Fixes implemented

- Added admin-only RPCs with consistent range filter (`7d`, `30d`, `90d`, `12m`, `all`).
- Added 12-month monthly aggregation RPC.
- Added derived abandonment (`max(plays - completes, 0)`) for robust reporting.
- Revoked direct authenticated select on legacy summary views; use guarded RPCs.
- Refactored dashboard into smaller components + data hook.
