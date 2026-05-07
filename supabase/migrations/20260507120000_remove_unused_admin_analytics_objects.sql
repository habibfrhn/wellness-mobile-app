-- Remove confirmed-unused legacy admin analytics surfaces after the MVP dashboard
-- moved to public.audio_play_sessions + public.admin_audio_usage_analytics().
--
-- Dependency audit performed 2026-05-07:
-- - Runtime client code calls only is_admin() and admin_audio_usage_analytics() for /admin.
-- - Edge functions write audio usage to audio_play_sessions and non-audio-session
--   events to analytics_events; none call these legacy views/RPCs.
-- - The retained analytics_events table, validation trigger/function, rate-limit
--   RPCs, and indexes continue to support ingestion, compatibility, and manual
--   maintenance queries.

-- Legacy views were granted to authenticated users but are not used by the app
-- or edge functions. Drop them before removing their former RPC alternatives.
drop view if exists public.analytics_audio_summary;
drop view if exists public.analytics_tailored_summary;
drop view if exists public.analytics_funnel_summary;

-- Legacy admin RPCs served an earlier multi-panel dashboard that queried
-- analytics_events directly. Current admin UI depends on admin_audio_usage_analytics(text).
drop function if exists public.admin_analytics_kpis(text);
drop function if exists public.admin_analytics_funnel(text);
drop function if exists public.admin_analytics_audio_summary(text);
drop function if exists public.admin_analytics_monthly_12m();
drop function if exists public.admin_analytics_audio_engagement(text);
drop function if exists public.admin_analytics_tailored_sessions(text);
drop function if exists public.admin_analytics_product_actions(text);
