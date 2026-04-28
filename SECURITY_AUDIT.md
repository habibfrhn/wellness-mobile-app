# Security Audit & Hardening Baseline

Date updated: 2026-04-28  
Scope: `apps/mobile` web deployment surface, Supabase edge functions, auth/session handling, and operational documentation.

Reference bulletin: https://vercel.com/kb/bulletin/vercel-april-2026-security-incident

## Executive summary

Current repository posture aligns with hardened MVP controls for:

- web deployment headers/caching/rewrites,
- strict auth callback/reset origin controls,
- server-enforced admin access,
- validated + rate-limited edge-function ingestion paths,
- reduced token/secret exposure in logs,
- documented deployment and recovery runbooks.

No client-side service-role credential exposure was identified.

## Current posture by area

### 1) Web deployment (Vercel)

Verified in `apps/mobile/vercel.json`:

- SPA rewrite excludes extension paths (`/((?!api/|.*\..*).*)`).
- Auth routes (`/auth/callback`, `/auth/reset`, and Expo prefix variants) are `private, no-store`.
- Static hashed assets are immutable cached.
- Baseline hardening headers include CSP, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, COOP/CORP, `Origin-Agent-Cluster`, and `X-Permitted-Cross-Domain-Policies`.

### 2) Auth/session safety

Verified in `apps/mobile/src/services/authLinks.ts`, `webAuth.ts`, `authSession.ts`, and `apps/mobile/App.tsx`:

- Web auth links are accepted only from allowed origins.
- Reset/callback flows handle Expo web path variants while preserving origin validation.
- Production fallback blocks invalid callback origin generation when required config is missing.
- Logout includes resilient cleanup paths to avoid stuck client sessions.

### 3) Admin authorization model

Verified in app code + SQL migrations:

- Admin route exists on web, but authorization is backend enforced.
- `admin_users` mapping and `is_admin()` checks gate admin access.
- Admin analytics data is fetched via guarded RPCs (not broad direct table access).

### 4) Edge function controls

Verified in `supabase/functions/*`:

- Method checks + payload validation are present.
- CORS/origin allowlist handling is explicit for browser-facing invocations.
- Rate limiting exists for analytics ingestion, night-session recording, and account deletion.
- Account deletion function removes bearer token preview logging and limits delete attempts.

## Incident-response controls (April 2026 Vercel bulletin)

Operational checklist in `apps/mobile/DEPLOY_WEB.md` covers:

- credential rotation,
- MFA/passkey enforcement,
- deployment/activity review,
- elevated monitoring window.

## Manual responsibilities (outside repo code)

These controls still require dashboard/infra ownership:

- Rotate Vercel tokens, Supabase service-role keys, OAuth client secrets, and webhook secrets.
- Enforce MFA/passkeys for Vercel + GitHub org/team members.
- Monitor Vercel activity/deploy logs and Supabase auth/function anomaly signals.
- Keep Supabase Auth URL config, Google OAuth settings, and `EXPO_PUBLIC_WEB_*` values aligned.
- Keep `CORS_ALLOWED_ORIGINS` synced with current deployed web origins.
- Keep security-sensitive docs synchronized using `apps/mobile/docs/DOCUMENTATION_STANDARDS.md`.

## Validation commands used

```bash
rg -n "EXPO_PUBLIC_WEB_ALLOWED_ORIGINS|buildAuthRedirectPath|is_admin\(|admin_analytics_|track-analytics-event|record-night-session|delete-account-v2|resend-verification-email" apps/mobile/src supabase/functions supabase/migrations
pnpm -C apps/mobile lint
pnpm -C apps/mobile typecheck
```
