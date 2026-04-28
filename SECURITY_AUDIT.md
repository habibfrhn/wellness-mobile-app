# Security Audit & Hardening Baseline

Date updated: 2026-04-28
Scope: `apps/mobile` web deployment surface, auth/session handling, Supabase edge functions, and operational documentation.

## Executive summary

Current code and configuration show an MVP-hardened baseline for:

- secure web caching/header behavior,
- constrained auth callback/reset origin handling,
- server-enforced admin authorization,
- validated and rate-limited analytics ingestion,
- reduced auth/logout debug exposure.

No client-side service-role credential exposure was identified.

## Verified controls by area

### 1) Web deployment (`apps/mobile/vercel.json`)

- SPA rewrite excludes extension/static/API paths.
- `/auth/callback`, `/auth/reset`, and Expo-prefixed variants are marked `private, no-store`.
- Static assets under `/assets/*` and `/_expo/static/*` are immutable cached.
- Security headers include CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`, COOP/CORP, and policy hardening headers.
- Preview deployments (`*.vercel.app`) send `X-Robots-Tag: noindex, nofollow, noarchive`.

### 2) Auth/session safety (`apps/mobile/src/services/*`, `apps/mobile/App.tsx`)

- Web auth links are accepted only from allowed origins.
- Callback/reset parsing supports `/auth/*` and Expo web-prefixed route variants.
- Missing/invalid callback flows are handled without exposing internal errors.
- Logout/session cleanup includes resilient paths to avoid stale local auth state.
- Access to app stack still requires verified email (`email_confirmed_at`).

### 3) Admin authorization model (`supabase/migrations/*`, app admin services)

- `/admin` route is web-only in UI.
- Admin data access is backend-enforced via `public.is_admin()` and guarded admin RPC functions.
- Admin mapping uses `public.admin_users`.

### 4) Edge-function safety (`supabase/functions/*`)

- Public-facing functions enforce method constraints and payload validation.
- `track-analytics-event` applies CORS origin validation, payload shape checks, and per-minute ingestion rate limiting.
- `record-night-session` rate limits are backed by DB RPC tracking.
- `delete-account-v2` avoids logging sensitive bearer token content.

## Manual controls still required outside this repo

- Rotate secrets/tokens on incident or role changes (Vercel, Supabase, OAuth providers, webhooks).
- Enforce MFA/passkeys and least-privilege access for operational accounts.
- Monitor auth anomalies, edge-function errors, and deployment activity.
- Keep Supabase Auth URL settings + OAuth redirect settings + `EXPO_PUBLIC_WEB_*` values in sync.

## Validation commands used

```bash
rg -n "EXPO_PUBLIC_WEB_ALLOWED_ORIGINS|buildAuthRedirectPath|is_admin\(|admin_analytics_|track-analytics-event|record-night-session|delete-account-v2|resend-verification-email" apps/mobile/src supabase/functions supabase/migrations
pnpm lint
pnpm typecheck
```
