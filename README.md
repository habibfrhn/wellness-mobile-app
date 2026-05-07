# Lumepo (wellness-mobile-app)

Sleep-focused wellness MVP built with Expo (React Native) + Supabase.

This app guides users through a nightly wind-down ritual with Indonesian-first UI, guided audio, a check-in/check-out flow, and a web-only admin analytics dashboard.

## Current product scope

- **Auth-gated experience** using Supabase Auth (email/password + Google OAuth).
- **Verification-gated login** (verified email required before entering the app flow).
- **Night flow journey** (`NightMode` → `NightCheckIn` → `NightStep1` → `NightStep2` → `NightStep3` → `NightCheckOut`).
- **Audio playback** with catalog items and progress handling.
- **Settings/account** including reminder settings, legal screens, password update, and account deletion.
- **Web admin dashboard** at `/admin` (server-enforced by `is_admin()` + admin RPC permissions).
- **Behavior analytics ingestion** through Supabase Edge Function (`track-analytics-event`) with server-side validation/rate limits.

## Platform targets

- **iOS / Android:** Expo + React Native native builds.
- **Web:** Expo static export deployed as SPA (Vercel rewrites/headers in `apps/mobile/vercel.json`).

## Architecture map

- App bootstrap + route orchestration: `apps/mobile/App.tsx`
- Navigation stacks: `apps/mobile/src/navigation/*`
- Screens: `apps/mobile/src/screens/*`
- Reusable UI: `apps/mobile/src/components/*`
- Services/business logic: `apps/mobile/src/services/*`
- Design tokens: `apps/mobile/src/theme/tokens.ts`
- Shared strings: `apps/mobile/src/i18n/strings.ts`
- Supabase SQL: `supabase/migrations/*`
- Edge functions: `supabase/functions/*`

## Route behavior (web)

`App.tsx` normalizes Expo web path variants (`/`, `/#/...`, `/--/...`) and maps localized routes:

- `/` (Landing)
- `/masuk`, `/daftar`
- `/lupa-kata-sandi`, `/atur-ulang-kata-sandi`, `/verifikasi-email`
- `/beranda`, `/pemutar-audio`, `/akun`, `/pengaturan`
- `/kebijakan-privasi`, `/syarat-ketentuan`
- `/pengingat-tidur`
- `/mode-malam`, `/check-in-malam`, `/langkah-1`, `/langkah-2`, `/langkah-3`, `/check-out-malam`
- `/admin`

Legacy aliases (`/login`, `/signup`, `/privacy-policy`, `/terms-conditions`) are normalized to current localized paths.

## Auth flow (current)

1. Session restore runs at bootstrap.
2. Auth deep links/callbacks are parsed in `authLinks.ts`.
3. Web callback/reset paths are constrained by `webAuth.ts` allowlist logic.
4. User must pass email verification (`email_confirmed_at`) to enter the app stack.
5. Reset-password links route to `/auth/reset` (or Expo prefix equivalent), then the auth reset screen.

## Admin analytics (current)

- UI route is web-only (`/admin`, plus supported admin query/hash variants).
- Backend authorization is mandatory (`public.is_admin()` + guarded RPCs).
- Dashboard is intentionally simple: it shows each audio name, unique “Mulai” starts, and finishes.
- Audio starts are recorded in `audio_play_sessions` once per generated `play_session_id`; pause/resume within the same play session does not increment starts again, and start/finish events request an immediate analytics flush for reliable admin refreshes.
- Audio finishes are recorded once when playback reaches at least 80% progress.
- Dashboard reads the server-guarded `admin_audio_usage_analytics(range_key)` RPC. Legacy `admin_analytics_*` RPCs, `analytics_*_summary` views, and tailored-session analytics acceptance paths were removed in `20260507120000`/`20260507130000` after dependency audit.
- Supported dashboard ranges in the UI: Today, 7 days, 1 month, 3 months, 6 months, and 1 year.
- Backend setup requires migrations through `20260507130000` and a deployed `track-analytics-event` edge function; see `apps/mobile/docs/ADMIN_ANALYTICS_SETUP.md` for admin user mapping, RPC verification, and troubleshooting.

## Environment variables

Create `apps/mobile/.env` for local development:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
EXPO_PUBLIC_WEB_ORIGIN=http://localhost:8081
EXPO_PUBLIC_WEB_ALLOWED_ORIGINS=http://localhost:8081,https://lumepo.com,https://www.lumepo.com,https://*.vercel.app
```

Optional toggles used by the app:

```bash
EXPO_PUBLIC_ANALYTICS_ENABLED=true   # set false to disable client analytics queue
EXPO_PUBLIC_AUTH_DEBUG=0             # set 1 to emit auth debug logs in the current deployment
```

> Never place service-role or other backend secrets in `EXPO_PUBLIC_*` vars.

## Local development

From repo root:

```bash
pnpm install
pnpm -C apps/mobile start
```

Platform shortcuts:

```bash
pnpm -C apps/mobile ios
pnpm -C apps/mobile android
pnpm -C apps/mobile web
```

Quality checks:

```bash
pnpm lint
pnpm typecheck
pnpm pre-release
```

## Web deployment (Vercel)

- Build/export: `pnpm -C apps/mobile export:web`
- Output directory: `apps/mobile/dist`
- Deployment and hardening checklist: `apps/mobile/DEPLOY_WEB.md`
- Security review and incident-response baseline: `SECURITY_AUDIT.md`

## Mobile, web UI, and auth docs

- Auth component map: `apps/mobile/docs/AUTH_COMPONENT_STRUCTURE.md`
- Home screen web UI maintenance: `apps/mobile/docs/HOME_SCREEN_WEB_UI.md`
- Landing and home screen copy reference: `apps/mobile/docs/LANDING_AND_HOME_COPY.md`
- `apps/mobile/docs/RELEASE_CHECKLIST.md`
- `apps/mobile/docs/AUDIO_CATALOG_UPDATE_GUIDE.md`
- `apps/mobile/docs/STORE_SUBMISSION_CHECKLIST.md`
- Database cleanup/audit log: `apps/mobile/docs/DATABASE_OBJECT_AUDIT.md`

## Supabase backend footprint

### Edge functions in this repository

- `track-analytics-event`
- `record-night-session`
- `delete-account-v2`
- `resend-verification-email`
- `request-password-reset-email`

### Key backend entities used by app flows

- `night_sessions`
- `night_streak_progress`
- `analytics_events`
- `audio_play_sessions`
- `admin_users`
- `admin_audio_usage_analytics`, `is_admin()` policy helpers, and analytics ingest rate-limit RPC overloads

## Known limitations (MVP)

- No offline-first mode or service-worker caching strategy.
- Admin dashboard is web-only.
- Analytics dashboard focuses on audio usage starts/finishes (not full BI/reporting).
- Production setup still requires manual provider/dashboard alignment (Vercel + Supabase + Google OAuth settings).

## April 30, 2026 production blank-screen postmortem

- **Impact:** web users saw a blank white screen at startup across Chrome/Edge/Firefox.
- **Console signature:** `Uncaught TypeError: (0 , l.jsx) is not a function` from the lazy `LandingEntry` bundle.
- **Root cause:** landing entry chunk compiled with JSX runtime calls that failed to bind correctly in the affected production bundle set during bootstrap.
- **Fix:** `apps/mobile/src/web/LandingEntry.web.tsx` now uses `React.createElement` for deterministic startup behavior and parity with `apps/mobile/index.ts`.
- **Validation:** rebuilt web export and re-verified startup + auth/legal routing in major browsers with clean sessions.
- **Prevention:** keep explicit startup chunk checks and cross-browser `/` smoke tests in every production release checklist (`apps/mobile/DEPLOY_WEB.md`).
