# Database Object Audit — May 7, 2026

## Scope

This audit reviewed the Supabase schema represented by `supabase/migrations`, active edge functions in `supabase/functions`, and mobile/web callers in `apps/mobile/src`. The review focused on tables, columns, relationships, functions/RPCs, RLS policies, triggers, indexes, views, storage references, and deployment-maintenance concerns.

## Dependency verification performed

- Searched application, edge-function, migration, README, and audit docs for every public schema object and RPC name before pruning.
- Confirmed the current admin dashboard uses only `public.admin_audio_usage_analytics(range_key text)` through `apps/mobile/src/services/adminAnalytics.ts`.
- Confirmed `track-analytics-event` writes audio start/finish rows to `public.audio_play_sessions`, stores non-session product analytics in `public.analytics_events`, and rate-limits through `public.increment_analytics_ingest_rate_limit`.
- Confirmed `record-night-session` writes `public.night_sessions`, rate-limits through `public.increment_rate_limit`, and updates `public.night_streak_progress` through `public.record_night_streak_completion`.
- Confirmed account and auth email edge functions still use the shared rate-limit RPCs, so those objects must remain.
- Confirmed no Supabase Storage buckets, storage policies, or database-side storage references are defined in the current migrations. Audio and artwork references are static catalog/asset references, not database storage objects.

## Confirmed removals

Migration `20260507120000_prune_unused_database_objects.sql` removes only objects that are not referenced by active app or edge-function code.

### Views removed

- `public.analytics_audio_summary`
- `public.analytics_tailored_summary`
- `public.analytics_funnel_summary`

These security-invoker views were introduced with the first admin analytics dashboard, then superseded by admin-guarded RPCs. Their authenticated grants were already revoked by `20260328130000_add_admin_analytics_rpcs_and_time_filters.sql`, and no current code references them.

### Legacy admin RPCs removed

- `public.admin_analytics_kpis(text)`
- `public.admin_analytics_funnel(text)`
- `public.admin_analytics_audio_summary(text)`
- `public.admin_analytics_monthly_12m()`
- `public.admin_analytics_audio_engagement(text)`
- `public.admin_analytics_tailored_sessions(text)`
- `public.admin_analytics_product_actions(text)`

These RPCs are unused by the current `/admin` UI. The active admin audio table is sourced from `public.audio_play_sessions` through `public.admin_audio_usage_analytics(text)`. Removing the old RPCs reduces exposed executable surface area while keeping the underlying `public.analytics_events` table for product analytics retention and future reporting.

### Indexes removed

- `public.night_sessions_user_id_idx`: redundant because `night_sessions_user_date_unique` already creates a btree index whose leading column is `user_id`.
- `public.rate_limits_action_bucket_idx`: unused by active edge-function access patterns, which increment by the primary key `(user_id, action, bucket)`.
- `public.analytics_events_event_name_idx`: redundant after `analytics_events_event_name_occurred_at_idx` was added; the composite index covers event-name equality lookups and time-ranged analytics queries.

## Objects intentionally retained

### Auth and admin access

- `public.admin_users` is retained as the server-side admin mapping table.
- `public.is_admin()` is retained because admin RPCs enforce access through it.
- The `admin_users_select_self` policy is retained so signed-in users can only see their own admin mapping row through RLS.

### Nightly check-in/check-out and streaks

- `public.night_sessions` is retained for nightly session records.
- `night_sessions_user_date_unique` is retained because the edge function uses `onConflict: "user_id,date_key"`.
- `night_sessions_completed_at_idx` is retained for chronological maintenance/audit queries without affecting active writes materially.
- `public.night_streak_progress`, its RLS policies, `set_night_streak_progress_updated_at` trigger/function, and `record_night_streak_completion(date)` are retained because the app reads streak progress and the edge function updates it after session completion.
- `public.rate_limits`, its primary key, and `rate_limits_updated_at_idx` are retained because `record-night-session` and account-deletion rate limiting still depend on this table/RPC family; the updated-at index remains useful for periodic cleanup.

### Analytics ingestion and product event retention

- `public.analytics_events` is retained because `track-analytics-event` still persists non-session events there.
- `analytics_events_audio_id_idx`, `analytics_events_occurred_at_idx`, and `analytics_events_event_name_occurred_at_idx` are retained for product analytics and future reporting over retained events.
- `analytics_events_insert_public`, `analytics_events_admin_select`, and `analytics_events_set_user` are retained as compatibility and defense-in-depth for direct client inserts or manual diagnostics, even though current clients route ingestion through the edge function.
- `public.analytics_event_props_are_valid(text, jsonb)` is retained because it is used by table constraints and insert policy validation.
- `public.set_analytics_event_user_id()` is retained because it backs the insert trigger.
- `public.analytics_ingest_rate_limits`, its primary key, `analytics_ingest_rate_limits_updated_at_idx`, and both `increment_analytics_ingest_rate_limit` overloads are retained because active and compatibility edge-function callers use them.

### Audio usage dashboard

- `public.audio_play_sessions` is retained as the current source of truth for admin audio starts/finishes.
- `audio_play_sessions_no_direct_client_access` is retained so anon/authenticated clients cannot bypass the edge function.
- All `audio_play_sessions` indexes are retained because the active dashboard filters by `started_at` and `finished_at`, groups by `audio_id`, and needs efficient range refreshes.
- `public.analytics_range_start(text)` is retained because `public.admin_audio_usage_analytics(text)` depends on it.
- `public.admin_audio_usage_analytics(text)` is retained because the current admin UI calls it directly.

## Tables and columns audit notes

No tables or columns were removed. Every retained table has an active runtime dependency, security responsibility, or explicitly retained maintenance role:

- `admin_users.user_id` maps Supabase auth users to admin access.
- `admin_users.added_at` supports auditability of admin grants.
- `analytics_events` columns are needed for product analytics retention, RLS/user attribution, session grouping, and timestamped reporting.
- `analytics_ingest_rate_limits` columns implement edge-function principal/action/bucket counters and cleanup tracking.
- `audio_play_sessions` columns implement idempotent audio starts, finish tracking, admin grouping, and operational timestamps.
- `night_sessions` columns implement one nightly record per user/date with validated mode and stress values.
- `night_streak_progress` columns are all read by the app or updated by the streak RPC.
- `rate_limits` columns implement authenticated user/action/bucket counters and cleanup tracking.

## Policy, trigger, and relationship audit notes

- All `auth.users` foreign keys were retained to preserve cascade/set-null behavior aligned with account deletion and analytics retention.
- RLS remains enabled on all application tables.
- Restrictive no-direct-client access for `audio_play_sessions` remains intact.
- Admin access remains server-enforced through `is_admin()` inside RPCs, not UI-only checks.
- No trigger was removed because the retained triggers still keep denormalized timestamps or authenticated user attribution consistent.

## Future maintenance guidance

1. Keep applied migrations immutable; add follow-up migrations for future audit cleanups.
2. Before dropping an object, search active callers in `apps/mobile/src`, `supabase/functions`, docs, and migrations, and verify SQL dependencies in the target database with `pg_depend`/`pg_catalog` queries where possible.
3. Prefer edge-function-mediated writes for analytics and audio usage; do not reopen direct client write access to `audio_play_sessions`.
4. Keep both `increment_analytics_ingest_rate_limit` overloads until all deployed edge functions are known to call only the 4-argument version and rollback compatibility is no longer needed.
5. If broader product analytics returns to the admin dashboard, add new narrowly scoped admin RPCs rather than re-exposing broad views.
6. Schedule periodic cleanup for rate-limit tables using `updated_at` once an operations job exists.
7. Revisit retained analytics indexes after real production query plans are available; use `pg_stat_user_indexes`, `pg_stat_statements`, and `EXPLAIN (ANALYZE, BUFFERS)` before further index pruning.
