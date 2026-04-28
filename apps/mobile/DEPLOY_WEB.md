# Deploy Web (Expo export + Vercel)

This document covers the current deployment flow for `apps/mobile` as a static Expo web export hosted on Vercel.

## 1) Build web export

From repo root:

```bash
pnpm -C apps/mobile export:web
```

Alternative workspace command:

```bash
pnpm --filter mobile export:web
```

Build output:

- `apps/mobile/dist`

## 2) Vercel project settings

Use these Vercel project values:

- **Root Directory**: `apps/mobile`
- **Build Command**: `pnpm export:web`
- **Output Directory**: `dist`

`apps/mobile/vercel.json` already provides:

- extension-safe SPA rewrites,
- cache headers for HTML/auth/static assets,
- hardened security headers,
- preview no-index header for `*.vercel.app` hosts.

## 3) Required app environment variables (Vercel)

Set for both **Preview** and **Production**:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_WEB_ORIGIN`
- `EXPO_PUBLIC_WEB_ALLOWED_ORIGINS`

Recommended optional toggles:

- `EXPO_PUBLIC_ANALYTICS_ENABLED=true`
- `EXPO_PUBLIC_AUTH_DEBUG=0`

## 4) Required parity checks (OAuth + auth links)

Keep these aligned across providers:

1. **Google OAuth client**
   - Authorized redirect URI includes: `https://<project-ref>.supabase.co/auth/v1/callback`
2. **Supabase Auth URL configuration**
   - Site URL matches canonical web origin.
   - Redirect URLs include callback/reset paths for every allowed origin.
3. **Vercel app env values**
   - `EXPO_PUBLIC_WEB_ORIGIN` and `EXPO_PUBLIC_WEB_ALLOWED_ORIGINS` match the same deployed domain set.

## 5) Edge-function environment checks (analytics)

For `track-analytics-event`, ensure Supabase project/function secrets are present and current:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- Optional: `CORS_ALLOWED_ORIGINS` (comma-separated additional allowed origins)

The function already hard-allows:

- `https://lumepo.com`
- `https://www.lumepo.com`
- `http://localhost:8081`
- `http://127.0.0.1:8081`
- matching Vercel preview hosts (`https://wellness-mobile-*.vercel.app`)

## 6) Post-deploy verification checklist

- Run `pnpm lint`, `pnpm typecheck`, and `pnpm test`.
- Open `/` and validate landing/auth entry routes.
- Verify signup/login/verification flow.
- Verify forgot/reset password flow through `/auth/reset` intake.
- Verify Google OAuth callback completion.
- Verify `/admin` behavior for admin vs non-admin users.
- Verify analytics ingestion (events reaching `analytics_events`).

## 7) Security operations note

If operating during or after a known provider incident window, run your organization’s credential rotation and access-review process (Vercel, Supabase, OAuth providers, webhooks), then monitor anomalies.

## 8) Related docs

- `README.md`
- `apps/mobile/docs/RESET_PASSWORD_SETUP.md`
- `apps/mobile/docs/ADMIN_ANALYTICS_SETUP.md`
- `SECURITY_AUDIT.md`
