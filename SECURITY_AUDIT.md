# Post-Incident Security Audit & Hardening Report

Date: 2026-04-21  
Scope: `apps/mobile` web app, Vercel deployment configuration, Supabase edge functions, auth/session flows, and repository-level deployment docs.
Reference bulletin: https://vercel.com/kb/bulletin/vercel-april-2026-security-incident

## Incident context considered

Based on Vercel's April 2026 bulletin (last updated April 21, 2026), customer risk is concentrated around:
- unauthorized access to some Vercel-hosted environment variables that were **not** marked sensitive,
- potential exposure of tokens/credentials stored in Vercel env vars,
- need to rotate deployment/access credentials and review activity/deploy logs,
- recommendation to enforce MFA and stronger deployment protections.

## Assessment summary (repo + config review)

### 1) Vercel setup and deployment flow
Assessed:
- `apps/mobile/vercel.json` headers, rewrites, and ignore command behavior.
- Web deploy docs (`apps/mobile/DEPLOY_WEB.md`) for security controls and secret handling.

Result:
- Project uses static export and SPA rewrites, with existing secure header baseline.
- No Vercel runtime/server code in repo, so primary exposure surface is environment variables, deployment tokens, Git integration access, and project/team settings in Vercel UI.

### 2) Environment variables and secret exposure paths
Assessed:
- Public client env usage (`EXPO_PUBLIC_*`) in `apps/mobile/src/services/*` and app bootstrap.
- Supabase function secret usage (`Deno.env.get(...)`) in edge functions.
- Existing docs for operational env setup.

Result:
- Client code correctly uses only public keys for browser builds.
- Service-role and backend secrets are referenced only in edge-function runtime.
- If any non-sensitive Vercel variables were configured in Vercel UI during incident window, those should be treated as potentially exposed.

### 3) Auth/session/cookie/JWT/OAuth posture
Assessed:
- Deep-link and callback handling (`authLinks.ts`, `webAuth.ts`, `App.tsx`).
- Session restore and sign-out cleanup (`authSession.ts`).
- Admin gating path and backend constraints.

Result:
- Auth callback origins are validated.
- Session artifacts and Supabase auth storage cleanup are present on logout.
- Admin access remains backend-enforced via RPC/DB checks.
- No evidence in repo of service-role key leakage to client.
- Additional hardening added after post-deploy logout failures were reported:
  - logout flow now tolerates storage write failures and network/sign-out exceptions and still performs local session cleanup.
  - web origin fallback for auth callbacks is now explicit and no longer trusts arbitrary `https://` origins when allowlist env is missing.

### 4) Serverless/edge functions and abuse controls
Assessed:
- `track-analytics-event`, `record-night-session`, `delete-user-account` validation, auth checks, rate limiting, CORS, and logging.

Result:
- Payload validation and rate limiting were already present.
- We identified and hardened permissive CORS fallback behavior and removed sensitive token-preview logging.

## Hardening changes applied in this patch

1. **Removed wildcard CORS fallback in web-exposed Supabase functions**
   - File: `supabase/functions/track-analytics-event/index.ts`
   - File: `supabase/functions/delete-user-account/index.ts`
   - File: `supabase/functions/delete-account-v2/index.ts`
   - File: `supabase/functions/resend-verification-email/index.ts`
   - Change:
     - Replaced permissive `*` fallback with explicit allowlist behavior in all web-exposed functions reviewed.
     - Allowlist now always includes canonical production origins + explicit localhost dev origins.
   - Security impact:
     - Reduces browser-origin abuse risk if env-based CORS config is missing or misconfigured.

2. **Stopped bearer-token preview logging in account deletion functions**
   - File: `supabase/functions/delete-user-account/index.ts`
   - File: `supabase/functions/delete-account-v2/index.ts`
   - Change:
     - Deleted token masking/preview logging lines.
   - Security impact:
     - Reduces credential leakage risk in function logs.

3. **Strengthened static web response hardening headers on Vercel**
   - File: `apps/mobile/vercel.json`
   - Added headers:
     - `Origin-Agent-Cluster: ?1`
     - `X-Permitted-Cross-Domain-Policies: none`
   - Security impact:
     - Tighter browser isolation baseline and reduced legacy cross-domain policy exposure.

4. **Added incident-specific deployment/security runbook updates**
   - File: `apps/mobile/DEPLOY_WEB.md`
   - Change:
     - Added Vercel April 2026 incident response checklist and least-privilege/rotation guidance.

5. **Updated repository security docs**
   - File: `README.md`
   - Change:
     - Added explicit pointer to incident response and credential-rotation checklist.

6. **Hardened auth logout resiliency and fallback OAuth origin policy**
   - File: `apps/mobile/src/services/authSession.ts`
   - File: `apps/mobile/src/services/webAuth.ts`
   - Change:
     - Added guarded error handling for logout persistence, remote signout, session refresh retry, and browser storage cleanup paths.
     - Restricted no-env fallback web auth origins to explicit known production + local dev origins.
   - Security/availability impact:
     - Prevents hidden logout failures from storage/runtime exceptions.
     - Reduces risk of permissive callback-origin acceptance from unapproved origins.

## Risk summary

### What was vulnerable
- Potentially permissive CORS defaults (`*`) in multiple web-exposed Supabase edge functions when `CORS_ALLOWED_ORIGINS` was not set.
- Partial credential fingerprint logging (`tokenPreview`) in account deletion function logs.
- Standard Vercel customer exposure risk if non-sensitive env vars were set in Vercel during incident window.

### What was fixed
- CORS defaults hardened to explicit allowlists.
- Token preview logging removed from account deletion flow.
- Additional browser hardening headers added to web deployment config.
- Incident-response and least-privilege checklist documented in deploy docs.
- Logout flow reliability and auth callback fallback-origin checks were strengthened.

### What still requires manual action
- Verify Vercel team/project audit logs for suspicious activity and unexpected deployments.
- Enforce Vercel MFA/passkeys and deployment protection settings in dashboard.
- Confirm GitHub integration scope is minimum required repos and branch protections are enforced.
- Validate Supabase dashboard auth logs and Edge Function invocation anomalies across incident window.

### Credentials that must be rotated manually
Rotate these in provider dashboards/secrets managers (repo cannot rotate automatically):
- Vercel access tokens (user + CI + bot tokens).
- Vercel project environment variables that were non-sensitive or potentially readable.
- Supabase service-role key and any function secrets used in Vercel-managed env vars.
- Supabase JWT secret **if compromise is suspected** (requires coordinated token invalidation window).
- OAuth provider credentials (Google client secret and any other OAuth client secrets used by auth stack).
- Webhook signing secrets for all inbound/outbound integrations.
- Database credentials/connection strings exposed through deployment env configuration.
- GitHub PATs/app tokens used by CI/CD or Vercel integration.

### Post-incident monitoring to keep in place
- Vercel:
  - Daily review of deployment/activity logs until at least 30 days after full rotation.
  - Alerts for unusual deploy frequency, environment variable edits, and protection-token usage.
- Supabase:
  - Monitor auth anomalies (sudden sign-in spikes, geographic anomalies, repeated refresh/session failures).
  - Monitor edge-function 401/403/429/5xx deltas and per-origin request outliers.
- App/Auth:
  - Monitor reset-password and callback failure rates; investigate spikes.
  - Continue strict origin/path validation for auth links.
- GitHub:
  - Monitor security log, token usage, unusual OAuth app authorizations, and workflow permission drift.

## Validation commands run

- `rg -n "CORS_ALLOWED_ORIGINS|Access-Control-Allow-Origin|tokenPreview|maskToken" supabase/functions`
- `pnpm --filter mobile lint`
- `pnpm --filter mobile typecheck`
