# Pre-Deployment Security & Launch Audit

Date: 2026-04-06
Scope: `apps/mobile` web app + Supabase edge functions + deployment config in this repository.

## What was audited

### 1) Security and secret exposure
- Searched for hard-coded credentials, API tokens, JWTs, and private key patterns in tracked files.
- Reviewed client-side environment variable usage (`EXPO_PUBLIC_*`) and ensured no server-only secrets are referenced from web client code.
- Reviewed public web metadata and removed placeholder production URL metadata that could leak incorrect deployment info.
- Reviewed error handling to avoid exposing backend internals to end users in admin analytics UI.

### 2) Backend / database protection
- Reviewed Supabase Edge Functions (`delete-user-account`, `track-analytics-event`, `record-night-session`) for:
  - auth requirements,
  - rate limiting,
  - misuse/abuse controls,
  - and response safety.
- Reviewed SQL hardening migrations for admin gating (`is_admin()`), RLS policies, analytics constraints, and anti-spoofing triggers.

### 3) Deployment / infrastructure readiness
- Reviewed `apps/mobile/vercel.json` security headers and SPA rewrites.
- Added additional browser hardening headers and indexing controls for preview domains.
- Confirmed deployment documentation still matches static export flow.

### 4) Frontend / UX quality
- Scanned for debug logging and reduced production-facing analytics logging noise.
- Confirmed admin-facing runtime errors are mapped to safe generic user-facing copy.

## Fixes applied in this audit

1. **Restricted CORS behavior for sensitive Supabase functions**
   - Added `CORS_ALLOWED_ORIGINS` allowlist support for:
     - `supabase/functions/delete-user-account/index.ts`
     - `supabase/functions/track-analytics-event/index.ts`
   - Behavior:
     - If `CORS_ALLOWED_ORIGINS` is set, only listed origins are allowed.
     - If not set, falls back to permissive `*` for backward compatibility.
     - Requests from disallowed browser origins now receive `403`.

2. **Reduced internal error leakage in admin analytics UI**
   - `useAdminAnalytics` now returns a safe generic message (`id.common.tryAgain`) instead of surfacing raw backend error text.

3. **Hardened web auth redirect origin handling**
   - `getWebAppOrigin()` now accepts only:
     - `https://...` origins, or
     - local HTTP origins (`localhost` / `127.0.0.1`) for development.
   - Invalid configured origins are ignored.

4. **Improved production security headers for web hosting**
   - Added:
     - `X-DNS-Prefetch-Control: off`
     - `Cross-Origin-Opener-Policy: same-origin`
     - `Cross-Origin-Resource-Policy: same-site`
   - Added `X-Robots-Tag: noindex, nofollow, noarchive` for `*.vercel.app` preview deployments.

5. **Removed placeholder Open Graph URL from public HTML template**
   - Deleted `og:url` placeholder (`wellnessapp.example`) from `apps/mobile/index.html`.

6. **Limited production analytics console noise**
   - Analytics warning logs now emit only in development mode.

## Commands run for this audit

- `rg -n "(SUPABASE|API_KEY|SECRET|TOKEN|PASSWORD|PRIVATE|sk_live|sk_test|BEGIN RSA|DATABASE_URL|JWT|AUTH)" apps/mobile/src supabase apps/mobile/app.config.ts apps/mobile/index.html --glob '!**/*.png' --glob '!**/*.jpg'`
- `rg -n "console\.(log|debug|info|warn|error)|TODO|FIXME|__DEV__|test flag|debug" apps/mobile/src supabase/functions`
- `rg -n "process\.env|EXPO_PUBLIC|import\.meta\.env|Deno\.env|get\(" apps/mobile/src supabase/functions apps/mobile/app.config.ts`
- `pnpm --filter mobile lint`
- `pnpm --filter mobile typecheck`

## Remaining launch checks (must be verified in live infra)

The following cannot be fully proven from repo-only review and should be validated in deployed environments (staging + production):

1. **Domain / redirect correctness**
   - Verify canonical production domain redirects and TLS certificate chain in hosting platform.
2. **Webhook integrations**
   - Validate webhook signature verification and retry behavior for each external integration.
3. **Runtime monitoring and alerting**
   - Confirm SLO dashboards, on-call alert routing, and error budget thresholds are configured.
4. **Rollback drills**
   - Validate one-click rollback and database migration rollback strategy on real deployment pipeline.
5. **Staging hardening**
   - Confirm staging environment uses non-production credentials and remains non-indexable.

## Recommended env configuration updates

- In Supabase function secrets, set:
  - `CORS_ALLOWED_ORIGINS=https://lumepo.com,https://www.lumepo.com,https://<your-staging-domain>`
- In web client env, ensure:
  - `EXPO_PUBLIC_WEB_ORIGIN=https://lumepo.com`

## Launch-blocking status (repo scope)

- **No critical launch blockers found in repository code after applied fixes.**
- **Deployment/environment verifications above remain required before production launch sign-off.**
