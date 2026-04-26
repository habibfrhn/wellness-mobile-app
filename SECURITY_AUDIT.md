# Security Audit & Hardening Baseline

Date updated: 2026-04-26

Scope: web deployment surface, auth/session flows, admin authorization model, and Supabase edge-function boundaries.

Reference bulletin: https://vercel.com/kb/bulletin/vercel-april-2026-security-incident

## Current baseline

### Web deployment hardening

Configured in `vercel.json` (repo root):

- deterministic install/build/output commands for monorepo deployment
- production branch deployment enabled for `main`
- SPA rewrite excludes extension/static paths
- auth routes are no-store/private cached
- immutable cache only for static asset paths
- CSP + HSTS + anti-clickjacking and related hardening headers

Compatibility fallback config exists in `apps/mobile/vercel.json` for setups that intentionally use `apps/mobile` as Vercel Root Directory.

### Auth/session hardening

Implemented in `apps/mobile/src/services/*` and `apps/mobile/App.tsx`:

- web callback/reset origins validated against allowed origins
- wildcard callback/reset origin support for controlled subdomains (`https://*.domain.tld`)
- same-origin HTTPS fallback for redirect generation to prevent production lockouts when env allowlist drifts
- callback/reset flow normalization supports Expo web path variants
- production-safe behavior when required web auth redirect config is invalid
- OAuth/session exchanges handled centrally (no UI-only trust)

### Admin access controls

- admin UI route is web-only, but backend remains the authority
- `public.is_admin()` + admin RPC permissions enforce access
- `public.admin_users` is the admin mapping source-of-truth

### Edge-function controls

In `supabase/functions/*`:

- explicit method/auth/payload checks
- CORS handling for browser-invoked paths
- rate limiting on analytics and night-session ingestion paths

## Operational controls (manual, outside repo)

- rotate compromised/expired tokens and secrets (Vercel, Supabase, OAuth providers)
- enforce MFA/passkeys on Vercel and GitHub org/team accounts
- monitor deployment logs and auth/function anomalies
- keep Supabase Auth URL config + OAuth provider config + `EXPO_PUBLIC_WEB_*` values aligned

## Validation commands

```bash
pnpm lint
pnpm typecheck
pnpm -C apps/mobile export:web
```
