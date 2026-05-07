-- Database object audit cleanup: remove confirmed-unused legacy analytics helpers
-- and redundant indexes while preserving active auth, nightly-session, analytics,
-- audio usage, and admin access flows.

-- These security-invoker summary views were superseded by admin-guarded RPCs and
-- later by the current audio_play_sessions-based admin dashboard. Their grants
-- were already revoked in 20260328130000, and no app or edge-function code
-- references them.
drop view if exists public.analytics_audio_summary;
drop view if exists public.analytics_tailored_summary;
drop view if exists public.analytics_funnel_summary;

-- Legacy admin analytics RPCs backed by public.analytics_events are not called by
-- the current admin UI, which now calls public.admin_audio_usage_analytics(text).
-- Keep public.analytics_events itself because the edge function still persists
-- non-session product analytics there for future reporting.
drop function if exists public.admin_analytics_kpis(text);
drop function if exists public.admin_analytics_funnel(text);
drop function if exists public.admin_analytics_audio_summary(text);
drop function if exists public.admin_analytics_monthly_12m();
drop function if exists public.admin_analytics_audio_engagement(text);
drop function if exists public.admin_analytics_tailored_sessions(text);
drop function if exists public.admin_analytics_product_actions(text);

-- Redundant/unused indexes. The unique constraint on (user_id, date_key) already
-- supports user-scoped lookups on night_sessions, and active writes use that
-- unique constraint for upsert conflict resolution. Edge-function rate limiting
-- addresses public.rate_limits by its primary key (user_id, action, bucket), so
-- the action/bucket-only index is unnecessary write overhead.
drop index if exists public.night_sessions_user_id_idx;
drop index if exists public.rate_limits_action_bucket_idx;

-- The composite (event_name, occurred_at desc) index added in 20260407120000
-- covers event-name equality lookups and time-ranged analytics queries, making
-- the older event_name-only index redundant.
drop index if exists public.analytics_events_event_name_idx;
