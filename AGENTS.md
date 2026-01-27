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
