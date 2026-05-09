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

## 4) Soundscape loading and loop behavior

- Soundscapes are single-track timer sessions, not generated playlists. The selected soundscape file is assigned once to the active player for the screen and then reused for the selected timer duration.
- Native playback (`useAudioPlayerSession`) uses the `expo-audio` player `loop` flag for soundscapes instead of creating a second player or manually seeking/restarting at the end of each file. This keeps one decoded/loaded source alive and lets the platform audio engine loop it efficiently.
- Web playback (`useWebAudioPlayerSession`) uses one `HTMLAudioElement` with `audio.loop = true` for soundscapes. The source is only reassigned when the selected track changes; the timer fade-out pauses and rewinds the same element instead of changing the source.
- Web audio preload is intentionally `metadata`. Do not add hidden duplicate `Audio` elements or eager full-file preloads for soundscapes, because those can double Vercel asset requests/bandwidth before the user presses play.
- The selected timer controls session length only. It must not be implemented by reloading the same soundscape file each time the original file duration finishes.

## 5) Performance and maintenance guidance

- Prefer platform-native loop primitives (`player.loop` / `HTMLAudioElement.loop`) over manual `ended` handlers for soundscape repeats.
- Only call `load()` or replace the source when the track changes. Pause/resume, seek, restart, timer changes, and natural loop boundaries should reuse the already-assigned source.
- If future soundscapes need gapless crossfades or layered stems, document the bandwidth tradeoff and avoid preloading duplicate full files unless product quality requires it.
- When auditing production bandwidth, compare soundscape starts with static audio asset requests; a one-hour soundscape session should not create a fresh request at every five-minute source loop boundary.

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
