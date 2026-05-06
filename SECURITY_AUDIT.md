# Security Audit & Hardening Baseline

Date updated: 2026-04-30  
Scope: `apps/mobile` web app deployment surface, Supabase edge functions, auth/session handling, and operational documentation.

Reference bulletin: https://vercel.com/kb/bulletin/vercel-april-2026-security-incident

## Executive summary

This repository currently follows a hardened MVP baseline for:

- web deployment headers/caching/rewrites,
- strict auth callback/reset origin controls,
- server-enforced admin access,
- validated + rate-limited edge-function ingestion paths,
- reduced secret/token exposure in logs.

No client-side service-role credential exposure was identified in the codebase.

## Current security posture by area

### 1) Web deployment (Vercel)

Verified in `apps/mobile/vercel.json`:

- SPA rewrite excludes extension paths (`/((?!api/|.*\..*).*)`), preventing static asset rewrite breakage.
- Auth routes (`/auth/callback`, `/auth/reset`, and Expo prefix variants) are marked `private, no-store`.
- Static hashed assets are long-lived immutable cached.
- Baseline hardening headers include CSP, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, COOP/CORP, `Origin-Agent-Cluster`, and `X-Permitted-Cross-Domain-Policies`.

### 2) Auth/session safety

Verified in `apps/mobile/src/services/authLinks.ts`, `webAuth.ts`, `authSession.ts`, and `App.tsx`:

- Web auth links are accepted only from allowed origins.
- Allowed-origin matching supports exact origins and wildcard subdomains (for example `https://*.vercel.app`) to keep preview deployments stable across redeploys.
- Reset/callback flows support Expo web path variants while preserving validation.
- Fallback behavior in production blocks invalid callback origin generation if required web origin config is missing.
- Logout flow includes resilient local cleanup paths to avoid stuck sessions after storage/network failures.

### 3) Admin authorization model

Verified in app + SQL migration usage:

- Admin UI route exists on web, but authorization is backend enforced.
- `admin_users` mapping and `is_admin()` checks gate admin data access.
- Admin analytics data is fetched via guarded RPC functions instead of broad direct table access; audio usage writes are restricted to the edge-function-backed `audio_play_sessions` flow.

### 4) Edge-function controls

Verified in `supabase/functions/*`:

- Method checks, payload validation, and explicit CORS allowlist handling are present for web-facing functions.
- Rate limiting exists for analytics ingestion and night-session recording paths.
- Account deletion flows no longer include bearer token preview logging.

## Incident-response controls (April 2026 Vercel bulletin)

Repository docs now include a required operational checklist in `apps/mobile/DEPLOY_WEB.md` covering:

- credential rotation,
- MFA/passkey enforcement,
- deployment/activity review,
- elevated monitoring window.

## Remaining manual responsibilities (outside repo code)

The following controls must be maintained in dashboards/infra and cannot be enforced purely by this repo:

- Rotate Vercel tokens, Supabase service-role keys, OAuth client secrets, and webhook secrets as needed.
- Enforce MFA/passkeys for Vercel + GitHub org/team members.
- Monitor Vercel activity/deploy logs and Supabase auth/function anomaly signals.
- Keep Supabase Auth URL config, Google OAuth client settings, and `EXPO_PUBLIC_WEB_*` environment values in sync.

## Validation commands used during audit

```bash
rg -n "EXPO_PUBLIC_WEB_ALLOWED_ORIGINS|buildAuthRedirectPath|is_admin\(|admin_analytics_|track-analytics-event|record-night-session|delete-account-v2|resend-verification-email" apps/mobile/src supabase/functions supabase/migrations
pnpm -C apps/mobile lint
pnpm -C apps/mobile typecheck
```
