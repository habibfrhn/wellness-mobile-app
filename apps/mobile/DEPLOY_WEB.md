# Deploy Web (Expo + Vercel)

This runbook is for deploying the `apps/mobile` web target as a static SPA.

## 1) Build static export

From repo root:

```bash
pnpm -C apps/mobile export:web
```

Expected output: `apps/mobile/dist`.

## 2) Vercel project settings

Configure the Vercel project with:

- **Root Directory**: `apps/mobile`
- **Build Command**: `pnpm export:web`
- **Output Directory**: `dist`

`apps/mobile/vercel.json` already defines:

- extension-safe SPA rewrites,
- cache policy for app shell/auth/static assets,
- security headers baseline.

## 3) Required app environment variables (Vercel)

Set for both **Preview** and **Production**:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_WEB_ORIGIN`
- `EXPO_PUBLIC_WEB_ALLOWED_ORIGINS`

Optional toggles:

- `EXPO_PUBLIC_ANALYTICS_ENABLED=true`
- `EXPO_PUBLIC_AUTH_DEBUG=0`

## 4) Supabase + OAuth alignment checklist

To keep auth/reset/OAuth stable, keep these in sync:

1. **Google OAuth**
   - Redirect URI includes `https://<project-ref>.supabase.co/auth/v1/callback`.
2. **Supabase Auth URL config**
   - Site URL = canonical web origin.
   - Redirect URLs include `/auth/callback` and `/auth/reset` for every allowed origin.
3. **Vercel vars**
   - `EXPO_PUBLIC_WEB_ORIGIN` and `EXPO_PUBLIC_WEB_ALLOWED_ORIGINS` match the same domain set.

## 5) Edge functions required in production

Deploy and keep updated:

```bash
supabase functions deploy record-night-session
supabase functions deploy delete-account-v2
supabase functions deploy resend-verification-email
supabase functions deploy track-analytics-event --no-verify-jwt
```

Set Supabase function secrets/config:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CORS_ALLOWED_ORIGINS`

## 6) Post-deploy verification

- Open `/` and auth screens from direct URL + refresh.
- Validate signup/login/verify email flows.
- Validate forgot/reset password flow (`/auth/reset` email link flow).
- Validate Google OAuth callback completion.
- Validate `/admin` behavior for admin and non-admin users.
- Validate night flow submission, audio playback, and analytics ingestion.

## 7) Security operations checklist (April 2026 bulletin follow-up)

If relevant to your deployment timeline, complete:

1. Rotate Vercel tokens, Supabase sensitive keys, OAuth secrets, webhook secrets.
2. Enforce MFA/passkeys for GitHub + Vercel access.
3. Review deployment/activity logs for unauthorized changes.
4. Keep elevated monitoring for auth/deploy/function anomalies for 30 days.

## 8) Related docs

- `apps/mobile/docs/RESET_PASSWORD_SETUP.md`
- `apps/mobile/docs/ADMIN_ANALYTICS_SETUP.md`
- `apps/mobile/docs/RELEASE_CHECKLIST.md`
- `SECURITY_AUDIT.md`
