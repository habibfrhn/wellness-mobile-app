# Vercel April 2026 Incident Response Audit (Lumepo)

Date: 2026-04-21  
Scope: `apps/mobile` web app, Vercel deployment config, Supabase edge functions/migrations, and auth/admin flows in this repository.

Reference bulletin: https://vercel.com/kb/bulletin/vercel-april-2026-security-incident

## Executive risk summary

### What was vulnerable
1. **Potential credential exposure path via Vercel non-sensitive env vars**
   - Per Vercel bulletin (updated April 21, 2026), environment variables not marked as sensitive should be treated as potentially exposed.
   - This project relies on Vercel-managed environment variables for web auth origins and potentially other integrations documented in deploy runbooks.

2. **Server-side abuse fallback risk in analytics ingestion**
   - `track-analytics-event` previously continued processing when rate-limit RPC checks were unavailable.
   - In degraded DB/rate-limit conditions, this could allow higher-volume ingestion abuse.

3. **Token-adjacent log leakage risk in account deletion functions**
   - Two account-deletion edge functions logged masked token previews.
   - Even masked previews are unnecessary in post-incident conditions and can increase forensic/log handling risk.

4. **CORS default permissiveness risk for analytics ingestion**
   - If no explicit `CORS_ALLOWED_ORIGINS` was configured, browser-origin checks were permissive.

### What was fixed in-repo
1. **Fail-closed analytics rate limiting**
   - `track-analytics-event` now returns `503` when rate-limit counter updates are unavailable, instead of ingesting events without enforcement.
2. **Stricter analytics CORS fallback behavior**
   - `track-analytics-event` no longer uses wildcard `*` fallback when `CORS_ALLOWED_ORIGINS` is missing.
   - It now only allows known production origins by default.
3. **Clearer origin-deny error signaling**
   - Added explicit `ORIGIN_NOT_ALLOWED` error code for denied browser origins in relevant edge functions.
4. **Reduced token handling in logs**
   - Removed masked token preview logging from account deletion functions.

### What still requires manual action (cannot be auto-rotated from this repo)
- Rotate Vercel account/team tokens, project env vars, deployment protection tokens, and any connected third-party secrets.
- Rotate Supabase service-role/DB credentials and all provider secrets stored in Supabase or Vercel.
- Rotate OAuth client secrets (Google and any others), webhook secrets, SMTP/provider API keys, and GitHub tokens.
- Review Vercel activity/deployment logs and Supabase auth/function logs for suspicious activity since **April 19, 2026**.
- Validate 2FA/passkeys and least-privilege access on Vercel, GitHub, Supabase, Google Workspace/Cloud.

### Credentials that must be rotated manually
Treat as rotate-now unless already rotated after April 19, 2026:
- **Vercel**: personal/team access tokens, deployment protection bypass tokens, project env vars (especially any non-sensitive vars).
- **Supabase**: `SUPABASE_SERVICE_ROLE_KEY`, DB passwords/connection strings, JWT signing/legacy secrets (if applicable), function-level provider secrets.
- **OAuth**: Google OAuth client secret(s), other provider client secrets.
- **Integrations**: webhook signing secrets, analytics vendor tokens, email provider/API keys, storage/CDN tokens.
- **GitHub/CI**: PATs, GitHub App private keys, Actions secrets used for deploy automation.

### Post-incident monitoring to keep in place
- Continuous review of Vercel activity log + deployment diff anomalies.
- Alerts on unusual auth/login patterns (new geos/devices, admin-auth failures, repeated reset attempts).
- Alerts on Supabase function error-rate spikes and rate-limit denial spikes.
- Weekly secret inventory + ownership review; quarterly forced rotation for high-impact secrets.
- Strict least-privilege reviews and quarterly access recertification across Vercel/GitHub/Supabase/Google.

## Detailed assessment by requested area

### 1) Vercel setup / deployment flow / Git integrations / CI-CD
- Reviewed `apps/mobile/vercel.json` headers/rewrites and documented deploy flow in `apps/mobile/DEPLOY_WEB.md`.
- Repo contains no `.github/workflows` pipeline definitions; deployment integration risk primarily resides in external Vercel/GitHub configuration.
- Main actionable repo hardening is defensive runtime behavior (edge functions + CORS/rate-limit fail-closed), implemented in this change.

### 2) Environment variables and secrets handling
- `README.md` already states `EXPO_PUBLIC_*` variables are client-bundled and must not contain server secrets.
- No direct in-repo secret material identified in tracked source reviewed during this audit.
- Secret rotation/invalidation must be executed in Vercel/Supabase/GitHub/provider consoles.

### 3) Auth/session/cookies/JWT/OAuth/privileged route audit
- Auth/admin architecture remains server-enforced through Supabase auth and admin RPC checks.
- Hardening applied by reducing token-adjacent logs in delete-account functions.
- Web origin enforcement improved for browser-invoked analytics endpoint; origin denials now explicit.

### 4) Deployment settings/logs/middleware/edge/serverless/access controls
- Updated edge function behavior to avoid “continue on rate-limit subsystem failure.”
- CORS behavior tightened for browser requests hitting analytics ingestion.
- Manual follow-up required: inspect Vercel and Supabase logs for IOC window from April 19, 2026 onward.

### 5) Least privilege across connected services
Required manual policy state (outside repo):
- Vercel: minimal team roles, mandatory MFA/passkeys, token TTL and owner mapping.
- GitHub: least-privilege PAT scopes, branch protections, environment protection rules.
- Supabase: restrict service-role usage to edge functions; no client exposure.
- Google OAuth/Workspace: remove unknown OAuth grants/apps, restrict high-risk scopes.

## Commands executed for this audit
- `rg --files -g 'AGENTS.md'`
- `rg --files .github apps/mobile supabase`
- `rg -n "vercel|Vercel|token|secret|oauth|jwt|cookie|session|middleware|edge function|rate limit|webhook|deployment protection|github" apps/mobile supabase .github README.md SECURITY_AUDIT.md`
- `cat apps/mobile/vercel.json`
- `cat apps/mobile/DEPLOY_WEB.md`
- `sed -n '1,240p' supabase/functions/track-analytics-event/index.ts`
- `sed -n '240,520p' supabase/functions/track-analytics-event/index.ts`
- `sed -n '120,220p' supabase/functions/delete-user-account/index.ts`
- `sed -n '120,240p' supabase/functions/delete-account-v2/index.ts`

## Immediate manual runbook (operator checklist)
1. Rotate all Vercel project env vars that were ever set as non-sensitive or of unknown sensitivity state.
2. Rotate Vercel tokens and Deployment Protection tokens.
3. Rotate Supabase service-role key and provider secrets; redeploy functions.
4. Rotate OAuth client secrets and webhook secrets; invalidate old sessions if your risk model requires it.
5. Rotate GitHub tokens / CI deploy secrets and re-authorize integrations.
6. Review logs for suspicious deployments, env edits, unusual auth flows, and anomalous function invocations.
7. Confirm MFA/passkeys and least-privilege role assignments across all connected platforms.
