# Agent Guide

## Audio catalog defaults
- When adding a new audio file to the audio catalog:
  - `creator` defaults to **"Lumepo"**.
  - Choose a **matching cover + thumbnail pair** that share the same number (they are the same image at different sizes).
  - Set `durationSec` to the **actual file duration**.
  - If the file is `.m4a`, `category` defaults to **"audio"**.
  - `title` can match the **file name**.

## UI composition rules
- UI components must be created **as separate components** (not inline in screens).
- When asked to edit or improve a component used on a screen, **update the component file** and have the screen **reference it**.
- Keep screens thin and focused on layout/composition; keep visuals inside reusable components.

## Strings & theme usage
- Use `apps/mobile/src/i18n/strings.ts` for user-visible copy whenever practical.
- Use `apps/mobile/src/theme/tokens.ts` for colors, spacing, radius, and typography values.
- If a `theme.ts` file is introduced later, keep it consistent with `tokens.ts` and prefer tokens for raw values.

## Token safety & exports
- Only add **top-level** token exports in `apps/mobile/src/theme/tokens.ts` (avoid nested token objects that require extra lookups).
- If you introduce a new token, update all consumers in the same change.
- Run `rg` to confirm no references remain to old token shapes.

## Web responsive layout rules
- Do **not** use user-agent detection.
- Do **not** use `Platform.OS` alone to branch responsive layout.
- For web responsiveness, use viewport width (`window.innerWidth`) via `apps/mobile/src/hooks/useViewportWidth.ts`.
- Use a breakpoint of **640px** for mobile-like vs framed web layout.
- Apply framed desktop web layout with `apps/mobile/src/components/WebResponsiveFrame.tsx`.
- Keep changes scoped to `.web.tsx` screens so native iOS/Android UI remains unchanged.

## Codex workflow best practices
- Before editing, inspect existing patterns in nearby files and reuse existing tokens/strings/components.
- Keep business logic and navigation behavior unchanged unless explicitly requested.
- Prefer minimal, targeted diffs; avoid drive-by refactors.
- Run relevant checks after changes (`pnpm typecheck`, `pnpm lint`, and targeted runtime validation when possible).
- If repo-wide checks fail for pre-existing reasons, clearly report that they are unrelated.
- For visual web UI changes, run the app and capture a screenshot artifact when tooling is available.
- Commit only the intended files; verify with `git status` and `git diff --staged`.
