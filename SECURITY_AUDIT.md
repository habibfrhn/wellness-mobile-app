# Security Audit & Hardening Baseline

Date updated: 2026-04-28  
Scope: `apps/mobile` web deployment surface, Supabase auth/session handling, and Supabase Edge Functions.

Reference bulletin: https://vercel.com/kb/bulletin/vercel-april-2026-security-incident

## Executive summary

Current code and config show a hardened MVP baseline for:

- strict web auth callback/reset origin controls,
- server-enforced admin access,
- payload validation + rate limits in browser-facing edge functions,
- explicit cache/security headers on Vercel web delivery.

No client-side exposure of service-role credentials was found.

## Findings by area

### 1) Web deployment hardening (`apps/mobile/vercel.json`)

- SPA rewrites are extension-safe (`/((?!api/|.*\..*).*)`).
- Auth callback/reset routes are marked `private, no-store`.
- Static hashed asset paths are immutable cached.
- Security headers include CSP, HSTS, frame/object restrictions, COOP/CORP, and nosniff.

### 2) Auth/session controls (`apps/mobile/src/services/*`, `apps/mobile/App.tsx`)

- `webAuth.ts` enforces allowed-origin checks for auth redirects.
- `authLinks.ts` validates and normalizes callback/reset links across Expo web path variants.
- App boot path preserves verification gating before entering app stack.
- Logout/session utilities include local cleanup fallbacks.

### 3) Admin authorization model (`supabase/migrations/*`, admin client services)

- Admin UI route exists on web, but data access is server-enforced.
- `public.is_admin()` + `public.admin_users` mappings gate admin analytics RPC access.
- Admin data is fetched through RPCs instead of broad table reads.

### 4) Edge function controls (`supabase/functions/*`)

- `track-analytics-event`: explicit method/CORS/payload checks + ingest rate limiting.
- `record-night-session`: bearer auth validation + payload validation + per-user rate limiting.
- `delete-account-v2`: origin checks + bearer token validation + rate limiting before hard delete.
- `resend-verification-email`: origin checks + payload validation + resend cooldown/valid-window limits.

## Manual controls still required outside repo

- Rotate Vercel tokens, OAuth secrets, and Supabase sensitive keys when required.
- Enforce MFA/passkeys for GitHub/Vercel org members.
- Monitor auth, edge function, and deployment logs for anomalies.
- Keep Supabase Auth URL config, OAuth provider redirect URIs, and `EXPO_PUBLIC_WEB_*` env vars aligned.

## Validation commands used during this audit

```bash
rg -n "EXPO_PUBLIC_WEB_ALLOWED_ORIGINS|buildAuthRedirectPath|getWebAuthPath|is_admin\(|admin_analytics_|track-analytics-event|record-night-session|delete-account-v2|resend-verification-email" apps/mobile/src supabase/functions supabase/migrations apps/mobile/vercel.json
pnpm -C apps/mobile lint
pnpm -C apps/mobile typecheck
```
