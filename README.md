# Lumepo (`wellness-mobile-app`)

Sleep-focused wellness MVP built with Expo (React Native) + Supabase.

Lumepo guides users through a nightly wind-down ritual with Indonesian-first UI, guided audio content, a check-in/check-out flow, and a web-only admin analytics dashboard.

## Product scope (current)

- Auth-gated experience using Supabase Auth (email/password + Google OAuth).
- Verification-gated login (`email_confirmed_at` must be present).
- Night flow journey: `NightMode` → `NightCheckIn` → `NightStep1` → `NightStep2` → `NightStep3` → `NightCheckOut`.
- Audio playback with progress handling and tailored session modes.
- Settings/account management (reminders, legal screens, password update, account deletion).
- Web-only admin analytics dashboard at `/admin` (backend-enforced with `is_admin()` + guarded RPCs).
- Analytics ingestion through Supabase Edge Function (`track-analytics-event`) with payload validation and rate limiting.

## Monorepo layout

- Mobile/web app: `apps/mobile`
- Supabase migrations: `supabase/migrations`
- Supabase edge functions: `supabase/functions`

Primary app architecture:

- App bootstrap + route orchestration: `apps/mobile/App.tsx`
- Navigation stacks: `apps/mobile/src/navigation/*`
- Screens: `apps/mobile/src/screens/*`
- Reusable UI: `apps/mobile/src/components/*`
- Services/business logic: `apps/mobile/src/services/*`
- Design tokens: `apps/mobile/src/theme/tokens.ts`
- User-facing strings: `apps/mobile/src/i18n/strings.ts`

## Prerequisites

- Node.js 20+
- pnpm 10+
- Optional (for backend operations): Supabase CLI

## Quick start (new developer)

From repo root:

```bash
pnpm install
pnpm -C apps/mobile web
```

Other run targets:

```bash
pnpm -C apps/mobile start
pnpm -C apps/mobile ios
pnpm -C apps/mobile android
```

Root shortcuts:

```bash
pnpm start:web
pnpm lint
pnpm typecheck
pnpm pre-release
```

## Environment variables

Create `apps/mobile/.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
EXPO_PUBLIC_WEB_ORIGIN=http://localhost:8081
EXPO_PUBLIC_WEB_ALLOWED_ORIGINS=http://localhost:8081,https://lumepo.com,https://www.lumepo.com
```

Optional app toggles:

```bash
EXPO_PUBLIC_ANALYTICS_ENABLED=true
EXPO_PUBLIC_AUTH_DEBUG=0
```

Never place service-role or private backend secrets in `EXPO_PUBLIC_*` variables.

## Web routes and auth behavior

Localized user-facing web routes are defined in `App.tsx` (for example `/masuk`, `/daftar`, `/beranda`, `/mode-malam`, `/admin`).

Auth callback/reset intake routes are fixed at:

- `/auth/callback`
- `/auth/reset`

`App.tsx` and auth services also support Expo web-prefixed variants like `/--/auth/callback` and `/--/auth/reset`.

## Backend footprint used by app

### Edge functions

- `track-analytics-event`
- `record-night-session`
- `delete-account-v2`
- `resend-verification-email`

### Key tables/RPC helpers referenced by app flows

- `night_sessions`
- `night_streak_progress`
- `analytics_events`
- `admin_users`
- `is_admin()` and admin analytics RPC functions

## Deployment and operations docs

- Web deployment: `apps/mobile/DEPLOY_WEB.md`
- Reset-password setup: `apps/mobile/docs/RESET_PASSWORD_SETUP.md`
- Admin analytics setup: `apps/mobile/docs/ADMIN_ANALYTICS_SETUP.md`
- Mobile release checklist: `apps/mobile/docs/RELEASE_CHECKLIST.md`
- Store submission checklist: `apps/mobile/docs/STORE_SUBMISSION_CHECKLIST.md`
- Security baseline: `SECURITY_AUDIT.md`

## Known MVP limitations

- No offline-first or service worker caching strategy.
- Admin analytics dashboard is web-only.
- Admin metrics are intentionally MVP-scoped (product actions, audio engagement, tailored sessions).
