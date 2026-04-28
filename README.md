# Lumepo (wellness-mobile-app)

Sleep-focused wellness MVP built with Expo (React Native) + Supabase.

## What this repository contains

- `apps/mobile`: Expo app for iOS, Android, and web.
- `supabase/migrations`: SQL schema, RLS, RPCs, and analytics/admin logic.
- `supabase/functions`: Edge functions used by app features and analytics ingestion.

## Current product scope

- Supabase Auth (email/password + Google OAuth), gated by email verification.
- Night flow (`NightMode` → `NightCheckIn` → `NightStep1` → `NightStep2` → `NightStep3` → `NightCheckOut`).
- Audio playback with standard tracks and tailored session modes.
- Profile/settings (including reset password, reminders, logout, and delete account).
- Web-only admin analytics dashboard at `/admin`, backend-enforced with `is_admin()` + guarded RPCs.

## Architecture map

- App bootstrap + route orchestration: `apps/mobile/App.tsx`
- Navigation stacks: `apps/mobile/src/navigation/*`
- Screens: `apps/mobile/src/screens/*`
- Reusable UI: `apps/mobile/src/components/*`
- Services/business logic: `apps/mobile/src/services/*`
- Design tokens: `apps/mobile/src/theme/tokens.ts`
- Shared strings: `apps/mobile/src/i18n/strings.ts`

## Web routes (localized app routes)

`App.tsx` normalizes Expo web path variants (`/`, `/#/...`, `/--/...`) and maps:

- Landing/auth: `/`, `/masuk`, `/daftar`, `/lupa-kata-sandi`, `/atur-ulang-kata-sandi`, `/verifikasi-email`
- App screens: `/beranda`, `/pemutar-audio`, `/akun`, `/pengaturan`, `/pengingat-tidur`
- Legal: `/kebijakan-privasi`, `/syarat-ketentuan`
- Night flow: `/mode-malam`, `/check-in-malam`, `/langkah-1`, `/langkah-2`, `/langkah-3`, `/check-out-malam`
- Admin: `/admin`

Legacy aliases (`/login`, `/signup`, `/privacy-policy`, `/terms-conditions`) are normalized to the localized paths above.

## Environment variables

Create `apps/mobile/.env` for local app development:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
EXPO_PUBLIC_WEB_ORIGIN=http://localhost:8081
EXPO_PUBLIC_WEB_ALLOWED_ORIGINS=http://localhost:8081,https://lumepo.com,https://www.lumepo.com
```

Optional client toggles:

```bash
EXPO_PUBLIC_ANALYTICS_ENABLED=true   # set false to disable analytics queue + sends
EXPO_PUBLIC_AUTH_DEBUG=0             # set 1 in dev to emit auth debug logs
```

> Never place service-role or other backend secrets in `EXPO_PUBLIC_*` variables.

## Local development

Prerequisites:

- Node + pnpm (repo uses `pnpm@10.27.0` from `packageManager`).

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

## Supabase backend (remote project)

Apply migrations and deploy functions used by the app:

```bash
supabase db push
supabase functions deploy record-night-session
supabase functions deploy delete-account-v2
supabase functions deploy resend-verification-email
supabase functions deploy track-analytics-event --no-verify-jwt
```

Function secrets/environment to configure in Supabase (project settings):

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CORS_ALLOWED_ORIGINS` (comma-separated allowlist for browser-invoked functions)

## Deployment + operations docs

- Web deploy + verification: `apps/mobile/DEPLOY_WEB.md`
- Reset password setup: `apps/mobile/docs/RESET_PASSWORD_SETUP.md`
- Admin analytics setup: `apps/mobile/docs/ADMIN_ANALYTICS_SETUP.md`
- Release checklist: `apps/mobile/docs/RELEASE_CHECKLIST.md`
- Store submission checklist: `apps/mobile/docs/STORE_SUBMISSION_CHECKLIST.md`
- Security baseline: `SECURITY_AUDIT.md`

## Known MVP constraints

- No offline-first strategy.
- Admin analytics is intentionally scoped to core product and audio engagement metrics.
- Production reliability still depends on correct external dashboard setup (Vercel + Supabase + OAuth provider configuration).
