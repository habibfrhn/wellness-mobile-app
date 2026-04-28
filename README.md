# Lumepo (`wellness-mobile-app`)

Sleep-focused wellness MVP built with Expo (React Native) + Supabase.

The app guides users through a nightly wind-down ritual with Indonesian-first UI, guided audio, a check-in/check-out flow, and a web-only admin analytics dashboard.

## Repository layout

- `apps/mobile` — main Expo app (iOS, Android, Web).
- `supabase/migrations` — SQL schema, RLS/policies, RPCs.
- `supabase/functions` — Edge Functions used by app and admin analytics.
- `apps/mobile/docs` — release, admin setup, reset-password, and store checklists.

## Current feature scope

- **Auth-gated app** with Supabase Auth (email/password + Google OAuth).
- **Email verification gate** before entering the main app experience.
- **Night flow journey**: `NightMode` → `NightCheckIn` → `NightStep1` → `NightStep2` → `NightStep3` → `NightCheckOut`.
- **Audio playback** with normal and tailored session modes.
- **Settings/account**: reminder settings, legal pages, password update, and account deletion.
- **Web-only admin dashboard** at `/admin` with server-enforced admin checks (`is_admin()` + guarded RPCs).
- **Behavior analytics ingestion** through Edge Function `track-analytics-event` with payload validation + rate limiting.

## Platform targets

- **iOS / Android**: Expo + React Native native builds.
- **Web**: Expo static export deployed as SPA (rewrites/headers in `apps/mobile/vercel.json`).

## Route behavior (web)

`apps/mobile/App.tsx` normalizes Expo web path variants (`/`, `/#/...`, `/--/...`) and maps localized routes:

- `/`
- `/masuk`, `/daftar`
- `/lupa-kata-sandi`, `/atur-ulang-kata-sandi`, `/verifikasi-email`
- `/beranda`, `/pemutar-audio`, `/akun`, `/pengaturan`
- `/kebijakan-privasi`, `/syarat-ketentuan`
- `/pengingat-tidur`
- `/mode-malam`, `/check-in-malam`, `/langkah-1`, `/langkah-2`, `/langkah-3`, `/check-out-malam`
- `/admin`

Legacy aliases (`/login`, `/signup`, `/privacy-policy`, `/terms-conditions`) are redirected in-app to the localized routes.

## Environment variables

Create `apps/mobile/.env` for local app development:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
EXPO_PUBLIC_WEB_ORIGIN=http://localhost:8081
EXPO_PUBLIC_WEB_ALLOWED_ORIGINS=http://localhost:8081,https://<preview-domain>.vercel.app,https://lumepo.com,https://www.lumepo.com
```

Optional app toggles:

```bash
EXPO_PUBLIC_ANALYTICS_ENABLED=true
EXPO_PUBLIC_AUTH_DEBUG=0
```

> Never place service-role credentials in `EXPO_PUBLIC_*` variables.

### Edge Function secrets (Supabase dashboard)

When deploying functions in `supabase/functions`, configure these secrets in Supabase:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CORS_ALLOWED_ORIGINS` (comma-separated, for browser-invoked functions)

## Local development (new clone)

From repository root:

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

Workspace-level shortcuts:

```bash
pnpm start:web
pnpm lint
pnpm typecheck
pnpm pre-release
```

## Deployment + operations docs

- Web deployment (Vercel): `apps/mobile/DEPLOY_WEB.md`
- Mobile release checklist: `apps/mobile/docs/RELEASE_CHECKLIST.md`
- Store submission checklist: `apps/mobile/docs/STORE_SUBMISSION_CHECKLIST.md`
- Reset password setup: `apps/mobile/docs/RESET_PASSWORD_SETUP.md`
- Admin analytics setup: `apps/mobile/docs/ADMIN_ANALYTICS_SETUP.md`
- Security hardening baseline: `SECURITY_AUDIT.md`

## Backend footprint in this repo

### Edge functions

- `track-analytics-event`
- `record-night-session`
- `delete-account-v2`
- `resend-verification-email`

### Key tables / RPCs used by app flows

- `night_sessions`
- `night_streak_progress`
- `analytics_events`
- `admin_users`
- `is_admin()` + admin analytics RPCs

## Known MVP limitations

- No offline-first strategy.
- Admin dashboard is web-only.
- Analytics is product-facing operational analytics, not a full BI/reporting system.
