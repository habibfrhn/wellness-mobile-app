# Deploy Web (Expo + Vercel)

## 1) Build static web export

From repo root:

```bash
pnpm -C apps/mobile export:web
```

Alternative workspace form:

```bash
pnpm --filter mobile export:web
```

Expected output directory: `apps/mobile/dist`.

## 2) Vercel project settings

Configure Vercel project with:

- **Root Directory**: `apps/mobile`
- **Build Command**: `pnpm export:web`
- **Output Directory**: `dist`

`apps/mobile/vercel.json` already includes:

- SPA rewrites for extensionless routes,
- cache headers for app shell/auth/static assets,
- security headers baseline,
- no `ignoreCommand` (every production-branch commit deploys).

## 3) Required app environment variables (Vercel)

Set for **Preview** and **Production**:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_WEB_ORIGIN` (canonical production origin, e.g. `https://lumepo.com`)
- `EXPO_PUBLIC_WEB_ALLOWED_ORIGINS` (comma-separated full allowlist)

Optional toggles:

- `EXPO_PUBLIC_ANALYTICS_ENABLED=true`
- `EXPO_PUBLIC_AUTH_DEBUG=0`

## 4) Supabase Auth + OAuth parity checklist

Keep these aligned to avoid callback/reset failures:

1. **Google OAuth client**
   - Authorized redirect URI includes: `https://<project-ref>.supabase.co/auth/v1/callback`.
2. **Supabase Auth URL configuration**
   - Site URL = canonical deployed origin.
   - Redirect URLs include callback + reset paths for every allowed web origin.
3. **Vercel env vars**
   - `EXPO_PUBLIC_WEB_ORIGIN` and `EXPO_PUBLIC_WEB_ALLOWED_ORIGINS` match the same domain set.

## 5) Edge Function secrets and deploys

In Supabase project secrets, verify:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CORS_ALLOWED_ORIGINS` (all web origins that should call browser-facing functions)

Deploy functions used by the web app and operations flows:

```bash
supabase functions deploy track-analytics-event --no-verify-jwt
supabase functions deploy resend-verification-email
supabase functions deploy delete-account-v2
supabase functions deploy record-night-session
supabase functions list
```

## 6) Post-deploy verification

- `/` landing + auth entry points.
- Email/password sign-up and login.
- Verify-email flow and resend-verification path.
- Forgot/reset password flow (`/auth/reset` deep link path handling).
- Google OAuth callback completion.
- `/admin` behavior for admin vs non-admin.
- Audio playback and analytics ingestion.
- Account deletion flow.

## 7) April 2026 incident-response checklist (required when applicable)

If your deployment window overlaps the April 2026 Vercel incident:

1. Rotate Vercel tokens, Supabase sensitive keys, OAuth secrets, webhook secrets.
2. Enforce MFA/passkeys for Vercel + GitHub org/team members.
3. Review Vercel activity and deployment logs for suspicious changes.
4. Keep elevated monitoring on auth/deploy/function anomalies for at least 30 days.

## 8) Operational guardrails

- Keep `/api/*` and auth redirect routes uncacheable.
- Keep immutable caching only for hashed static asset paths.
- Keep SPA rewrite limited to extensionless paths.
- Never store service-role credentials in `EXPO_PUBLIC_*` env variables.

## 9) Related docs

- `apps/mobile/docs/RESET_PASSWORD_SETUP.md`
- `apps/mobile/docs/ADMIN_ANALYTICS_SETUP.md`
- `SECURITY_AUDIT.md`

## 10) Documentation sync requirement

When deployment/auth/origin settings change, update the same PR:

- `README.md` (onboarding + env variables)
- `SECURITY_AUDIT.md` (security posture/manual controls)
- `apps/mobile/docs/RESET_PASSWORD_SETUP.md` and `apps/mobile/docs/ADMIN_ANALYTICS_SETUP.md` (flow-specific runbooks)
