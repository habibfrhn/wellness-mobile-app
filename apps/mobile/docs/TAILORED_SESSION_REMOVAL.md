# Tailored Session Removal (May 5, 2026)

## Summary
Tailored session was removed from app playback and admin analytics surfaces.

## Affected areas
- Home no longer renders the sleep-summary/tailored-entry card; users start night flow from dedicated Night Mode screens and other in-app entry points.
- Audio player no longer has tailored-session-only controls, confirm-exit modal path, or tailored-session playback branching.
- Analytics client no longer emits tailored session events.
- Admin dashboard no longer fetches/displays tailored session metrics.

## Final behavior
- Audio playback supports normal audio and soundscape behavior only.
- Session flow continues through Night Mode / nightly steps.
- Admin dashboard focuses on product actions and audio engagement.

## Regression checks
- TypeScript compile passes (`pnpm -C apps/mobile typecheck`).
- Verified key routes compile with updated params and player hooks.

## Maintenance notes
- Removed obsolete components: `HomeNightSummary*` and `SleepOptionModal`.
- Keep future session-specific behavior generic and avoid introducing feature-specific player branches unless required.
- If historical tailored analytics data is retired in backend, align SQL/RPC docs and migrations in a follow-up migration.
