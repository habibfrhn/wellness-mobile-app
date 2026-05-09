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

## 4) Soundscape runtime behavior
- Soundscapes are single-track timer sessions. The player should assign the selected file once, enable the platform/browser loop flag, and reuse that same source until the timer fade-out stops playback.
- Native soundscapes use `player.loop` in `useAudioPlayerSession`; web soundscapes use `HTMLAudioElement.loop` in `useWebAudioPlayerSession`. Prefer those platform loop primitives over manual `ended` handlers that seek/reload at every source boundary.
- On web, keep the primary audio element at `preload = "metadata"` and do not create hidden duplicate `Audio` elements for eager full-file preloads. This avoids extra static asset requests and unnecessary Vercel bandwidth before the user starts playback.
- Timer changes, pause/resume, restart, and natural loop boundaries should not call `load()` or replace `src` unless the selected catalog track changes.

## 5) Soundscape maintenance checks
- When changing soundscape loading, test a timer longer than the source file duration and verify playback continues past the natural loop point without issuing a new full-file request for the same asset.
- If future work requires crossfades, layered stems, or offline caching, document the bandwidth/storage tradeoff in this guide and keep the default MVP path single-source and loop-flag based.

## 6) Validation checklist
- Run:
  - `pnpm lint`
  - `pnpm typecheck`
- Smoke test key paths:
  - Home recommendations open the correct tracks.
  - Night flow Step 1/2 launches intended tracks.
  - Player can play/pause/seek and complete playback for single tracks and soundscapes.
- Confirm there are no broken asset imports at runtime.

## 7) If adding a brand-new track
- Add the new track object in `AUDIO_TRACKS` with complete metadata.
- Extend `AudioId` union with the new ID.
- Update catalog groupings that should include it.
- Verify admin audio analytics UI still renders correctly with the updated catalog.
