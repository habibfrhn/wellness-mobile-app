-- Targeted indexes for admin analytics RPC query patterns.

create index if not exists analytics_events_name_occurred_idx
  on public.analytics_events (event_name, occurred_at desc);

create index if not exists analytics_events_audio_events_idx
  on public.analytics_events ((event_props->>'audio_id'), occurred_at desc)
  where event_name in ('audio_click', 'audio_play', 'audio_complete', 'audio_abandon');

create index if not exists analytics_events_session_mode_events_idx
  on public.analytics_events ((event_props->>'session_mode'), occurred_at desc)
  where event_name in (
    'tailored_session_select',
    'tailored_session_start',
    'tailored_session_complete',
    'tailored_session_dropoff'
  );
