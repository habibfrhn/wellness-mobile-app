# Database Object Audit (2026-05-07)

## Scope and method

This audit reviewed the Supabase schema migrations, Edge Functions, mobile/web Supabase usage, admin dashboard code, docs, and storage references to identify unused database objects without disrupting active product flows.

Commands used during the audit:

```bash
rg -n "\.from\(['\"]|\.rpc\(['\"]|invoke\(['\"]|trackEvent|event_name|analytics_|night_sessions|night_streak_progress|rate_limits|admin_users|audio_play_sessions|storage|bucket|supabase\.storage" apps/mobile supabase/functions supabase/migrations README.md SECURITY_AUDIT.md package.json
rg -n "record_night_streak_completion|admin_analytics_|analytics_audio_summary|analytics_tailored_summary|analytics_funnel_summary|tailored_session|audio_complete|audio_abandon|audio_play|audio_start|audio_finish|home_sleep_cta_click|landing_" apps/mobile/src supabase/functions supabase/migrations README.md SECURITY_AUDIT.md apps/mobile/docs
rg -n "storage|bucket|supabase\.storage|from\(['\"]storage|storage\.objects|storage\.buckets" apps/mobile supabase README.md SECURITY_AUDIT.md -g '!node_modules'
```

## Confirmed removals

Migration `supabase/migrations/20260507120000_remove_unused_admin_analytics_objects.sql` removes only legacy admin analytics read surfaces that are no longer referenced by runtime app or Edge Function code:

- Views:
  - `public.analytics_audio_summary`
  - `public.analytics_tailored_summary`
  - `public.analytics_funnel_summary`
- RPCs:
  - `public.admin_analytics_kpis(text)`
  - `public.admin_analytics_funnel(text)`
  - `public.admin_analytics_audio_summary(text)`
  - `public.admin_analytics_monthly_12m()`
  - `public.admin_analytics_audio_engagement(text)`
  - `public.admin_analytics_tailored_sessions(text)`
  - `public.admin_analytics_product_actions(text)`

These objects belonged to a previous multi-panel admin dashboard that read from `analytics_events`. The current `/admin` dashboard reads `public.admin_audio_usage_analytics(range_key)` only, and the current audio source of truth is `public.audio_play_sessions`.

## Dependency notes for removals

- App runtime RPC references are limited to:
  - `public.is_admin()` for admin route authorization checks.
  - `public.admin_audio_usage_analytics(range_key)` for dashboard rows.
- Edge Functions reference:
  - `public.increment_analytics_ingest_rate_limit(...)` for analytics, password-reset, and verification-email throttling.
  - `public.increment_rate_limit(...)` for account deletion throttling.
  - `public.record_night_streak_completion(date)` for night-session completion progress.
  - Tables `public.analytics_events`, `public.audio_play_sessions`, and `public.night_sessions` for active writes.
- No runtime code references the dropped `analytics_*_summary` views or `admin_analytics_*` RPCs after the dashboard moved to `admin_audio_usage_analytics`.
- Storage audit found no app or SQL usage of Supabase Storage buckets, `storage.objects`, or `supabase.storage`; only local Supabase config and local/device auth storage references exist.

## Retained objects and rationale

### Auth and admin

- `public.admin_users`: retained as the server-side admin allowlist.
- `public.is_admin()`: retained because the admin route and admin RPCs depend on backend-enforced authorization.

### Night sessions and streaks

- `public.night_sessions`: retained because `record-night-session` writes nightly check-out results.
- `public.night_streak_progress`: retained because the app reads streak progress and the night-session Edge Function updates it.
- `public.record_night_streak_completion(date)`: retained because it is called by `record-night-session`.
- `public.set_night_streak_progress_updated_at()` and trigger `set_night_streak_progress_updated_at`: retained because they maintain row freshness.
- Night-session/streak RLS policies are retained to preserve authenticated user isolation.

### Rate limits

- `public.rate_limits` and `public.increment_rate_limit(uuid, text, text)`: retained for account-deletion throttling and legacy night-session rate-limit isolation.
- `public.analytics_ingest_rate_limits` and both `public.increment_analytics_ingest_rate_limit` overloads: retained for Edge Function rate limiting and deployed-function compatibility.

### Analytics ingestion and audio usage

- `public.analytics_events`: retained as the generic behavioral-event store for landing/signup/audio-click telemetry and future maintenance queries.
- `public.analytics_event_props_are_valid(text, jsonb)`: retained because SQL constraints depend on it and it mirrors Edge Function payload validation.
- `public.set_analytics_event_user_id()` and trigger `analytics_events_set_user`: retained to keep server-sourced timestamps and safe user attribution.
- `public.audio_play_sessions`: retained as the source of truth for admin audio usage.
- `public.admin_audio_usage_analytics(text)`: retained as the only active admin dashboard analytics RPC.
- `public.analytics_range_start(text)`: retained because active admin analytics RPCs use it for range filtering.
- Existing analytics and audio indexes are retained. Some single-column analytics indexes overlap with newer composite indexes, but they remain useful for manual maintenance/debug queries and were not removed without live production query statistics.

### Policies and grants

- RLS policies on active tables are retained. Direct authenticated/anonymous access remains denied for service-role-only ingestion tables where applicable.
- Dropping unused views and RPCs also removes their prior grants, reducing exposed read surfaces for authenticated users.

## Objects reviewed with no removal

- Tables: `admin_users`, `analytics_events`, `analytics_ingest_rate_limits`, `audio_play_sessions`, `night_sessions`, `night_streak_progress`, `rate_limits`.
- Relationships: all `auth.users` foreign keys remain active for cascade cleanup or historical attribution.
- Triggers: `analytics_events_set_user` and `set_night_streak_progress_updated_at` remain active and required.
- Indexes: no index was confirmed safe to drop from static code review alone; use production `pg_stat_user_indexes` before pruning.
- Storage: no Supabase Storage buckets/objects are currently used by the product; no storage objects are created by migrations.

## Future maintenance guidance

1. Keep applied migrations immutable; add new migrations for future cleanup.
2. Before dropping any table, column, index, trigger, function, policy, or view, check all of:
   - app code (`apps/mobile/src`),
   - Edge Functions (`supabase/functions`),
   - SQL dependencies (`pg_depend`, view definitions, triggers, constraints),
   - Supabase dashboard/Auth/Storage configuration,
   - production query/index stats when available.
3. Treat `analytics_events` as raw telemetry, not the current admin audio source of truth.
4. Keep `audio_play_sessions` and `admin_audio_usage_analytics` in sync with any changes to `audio_start` / `audio_finish` tracking.
5. Keep both analytics ingest rate-limit RPC overloads until all deployed Edge Functions are known to call only the 4-argument signature.
6. Do not remove legacy event names from Edge Function validation until old mobile/web deployments can no longer emit them.
7. Run `pnpm lint`, `pnpm typecheck`, and a Supabase migration dry run or staging apply before production database cleanup.
