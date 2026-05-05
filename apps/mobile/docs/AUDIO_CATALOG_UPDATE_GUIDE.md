# Audio Catalog Update Guide

Use this checklist whenever audio files are added, renamed, replaced, or removed.

## 1) Source of truth
- Audio metadata and runtime linking are defined in `apps/mobile/src/content/audioCatalog.ts`.
- Audio files currently used by the app live in:
  - `apps/mobile/assets/audio/afirmasi/*`
  - `apps/mobile/assets/audio/sleep-guide/*`
  - `apps/mobile/assets/audio/soundscape/*`

## 2) Required updates when files change
For each changed track, update the corresponding `AUDIO_TRACKS` entry in `audioCatalog.ts`:
- `asset`: must point to the exact file path/name with `require(...)`.
- `durationSec`: must match the real file duration in seconds.
- `title` and `subtitle`: verify copy remains correct for the new audio.
- `contentType` and `category`: keep aligned with the intended track type.
- `cover` and `thumbnail`: keep numbering consistent with the track order.

## 3) ID and analytics safety checks
- Keep existing `id` values stable unless a product-level rename is intentional.
- If an ID must change:
  - Update all references across screens/hooks/services.
  - Add a backward-compatibility alias in `legacyAudioIdAliases` when needed.
  - Verify analytics events still emit valid `audio_id` values.

## 4) Validation checklist
- Run:
  - `pnpm lint`
  - `pnpm typecheck`
- Smoke test key paths:
  - Home recommendations open the correct tracks.
  - Night flow Step 1/2 launches intended tracks.
  - Player can play/pause/seek and advances to next track in tailored sessions.
- Confirm there are no broken asset imports at runtime.

## 5) If adding a brand-new track
- Add the new track object in `AUDIO_TRACKS` with complete metadata.
- Extend `AudioId` union with the new ID.
- Update any curated playlists or tailored-session logic that should include it.
- Verify admin audio analytics UI still renders correctly with the updated catalog.
