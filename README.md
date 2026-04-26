# Lumepo (wellness-mobile-app)

Sleep-focused wellness MVP built with Expo (React Native) + Supabase.

## Repository structure

- `apps/mobile`: Expo app (iOS, Android, Web)
- `supabase/migrations`: SQL migrations (RLS, RPCs, analytics schema)
- `supabase/functions`: Edge Functions (`track-analytics-event`, `record-night-session`, `delete-account-v2`, `resend-verification-email`)
- `vercel.json`: production web deployment config for Vercel (repo-root build)

## Product scope (current)

- Auth-gated app (email/password + Google OAuth)
- Verified-email gating before entering app stack
- Night flow: `NightMode` → `NightCheckIn` → `NightStep1/2/3` → `NightCheckOut`
- Audio playback with progress + tailored sessions
- Account/settings/legal flows
- Web-only admin analytics dashboard at `/admin` with backend authorization

## Local setup

### Prerequisites

- Node + pnpm (repo uses `pnpm@10.27.0`)
- Supabase project with required migrations/functions applied

### Install + run

From repo root:

```bash
pnpm install
pnpm -C apps/mobile start
```

Useful app commands:

```bash
pnpm -C apps/mobile ios
pnpm -C apps/mobile android
pnpm -C apps/mobile web
pnpm -C apps/mobile export:web
```

Root-level quality checks:

```bash
pnpm lint
pnpm typecheck
pnpm pre-release
```

## Environment variables

Create `apps/mobile/.env` for local development:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
EXPO_PUBLIC_WEB_ORIGIN=http://localhost:8081
EXPO_PUBLIC_WEB_ALLOWED_ORIGINS=http://localhost:8081,https://lumepo.com,https://www.lumepo.com
EXPO_PUBLIC_ANALYTICS_ENABLED=true
EXPO_PUBLIC_AUTH_DEBUG=0
```

### Variable reference

- `EXPO_PUBLIC_SUPABASE_URL` (required): Supabase project URL.
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` (required): Supabase anon key.
- `EXPO_PUBLIC_WEB_ORIGIN` (required for production-safe web redirects): canonical web origin.
- `EXPO_PUBLIC_WEB_ALLOWED_ORIGINS` (recommended): comma-separated allowlist for trusted auth callback/reset origins.
- `EXPO_PUBLIC_ANALYTICS_ENABLED` (optional, default enabled unless set to `false`).
- `EXPO_PUBLIC_AUTH_DEBUG` (optional; set `1` to enable auth debug logs).

> Never put service-role secrets in `EXPO_PUBLIC_*` variables.

## Routing + auth behavior (web)

Primary web routes include localized paths such as:

- `/`, `/masuk`, `/daftar`, `/verifikasi-email`
- `/lupa-kata-sandi`, `/atur-ulang-kata-sandi`
- `/beranda`, `/pemutar-audio`, `/akun`, `/pengaturan`
- `/mode-malam`, `/check-in-malam`, `/langkah-1`, `/langkah-2`, `/langkah-3`, `/check-out-malam`
- `/admin`

Auth links support `/auth/callback` and `/auth/reset` plus Expo web variants (`/#/...`, `/--/...`).

Auth/session logic is centralized in:

- `apps/mobile/src/services/supabase.ts`
- `apps/mobile/src/services/authLinks.ts`
- `apps/mobile/src/services/webAuth.ts`
- `apps/mobile/src/services/authOAuth.ts`

## Production web deployment (Vercel)

See full runbook: `apps/mobile/DEPLOY_WEB.md`.

Key facts:

- Production branch: `main`
- Deploy config source of truth: repo-level `vercel.json`
- Build command: `pnpm -C apps/mobile export:web`
- Output directory: `apps/mobile/dist`

## Preventing “latest main commit not visible in production”

Use this quick check:

1. Confirm commit is on `main` in GitHub.
2. In Vercel, open **Deployments** and filter to branch `main`.
3. Verify latest `main` deployment is **Ready** and environment is **Production**.
4. Open deployment details and confirm commit SHA.
5. Check build logs for install/build failures.
6. Confirm production domain aliases point to the newest production deployment.
7. Confirm required env vars exist in **Production** scope (not only Preview/Development).
8. If latest deploy is ready but not live, **Promote to Production**.

Detailed troubleshooting: `apps/mobile/docs/TROUBLESHOOTING.md`.

## Additional docs

- Web deploy runbook: `apps/mobile/DEPLOY_WEB.md`
- Release checklist: `apps/mobile/docs/RELEASE_CHECKLIST.md`
- Reset password setup: `apps/mobile/docs/RESET_PASSWORD_SETUP.md`
- Admin analytics setup: `apps/mobile/docs/ADMIN_ANALYTICS_SETUP.md`
- Admin analytics audit: `apps/mobile/docs/ADMIN_ANALYTICS_AUDIT.md`
- Security baseline: `SECURITY_AUDIT.md`
- Store submission checklist: `apps/mobile/docs/STORE_SUBMISSION_CHECKLIST.md`
