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

Expected output directory:

- `apps/mobile/dist`

## 2) Vercel project settings

Set Vercel project config to:

- **Root Directory**: `apps/mobile`
- **Build Command**: `pnpm export:web`
- **Output Directory**: `dist`

`apps/mobile/vercel.json` already defines:

- SPA rewrites for extensionless routes,
- cache headers for app shell/auth/static assets,
- security headers baseline,
- no `ignoreCommand`, so every production-branch commit triggers a fresh deployment.

## 3) Required web auth environment variables

Set these in Vercel for **Preview** and **Production**:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_WEB_ORIGIN` (canonical deployed origin, e.g. `https://lumepo.com`)
- `EXPO_PUBLIC_WEB_ALLOWED_ORIGINS` (comma-separated allowlist including all valid origins, including wildcard preview entries such as `https://*.vercel.app`)

Recommended optional toggles:

- `EXPO_PUBLIC_ANALYTICS_ENABLED=true`
- `EXPO_PUBLIC_AUTH_DEBUG=0`

## 4) Supabase and OAuth parity checklist

To keep login/reset/OAuth stable, these must match exactly:

1. **Google OAuth client**
   - Authorized redirect URI includes:
     - `https://<project-ref>.supabase.co/auth/v1/callback`
2. **Supabase Auth URL config**
   - Site URL: canonical web origin (`https://lumepo.com` in production)
   - Redirect URLs include callback + reset for all allowed origins.
   - For stable preview auth across redeploys, add wildcard redirect entries:
     - `https://*.vercel.app/auth/callback`
     - `https://*.vercel.app/auth/reset`
3. **Vercel env vars**
   - `EXPO_PUBLIC_WEB_ORIGIN` and `EXPO_PUBLIC_WEB_ALLOWED_ORIGINS` align with the same domain set.

## 5) Post-deploy verification

- Open deployed `/` landing page and auth entry points.
- Verify email/password login + signup + verify flow.
- Verify forgot/reset password (`/auth/reset`) end-to-end.
- Verify Google OAuth callback completion.
- Verify `/admin` access behavior for admin vs non-admin users.
- Verify audio playback and analytics event ingestion.

## 6) April 2026 incident-response checklist (required when applicable)

If this project was deployed during the April 2026 Vercel incident window, complete:

1. Rotate Vercel tokens, Supabase sensitive keys, OAuth secrets, webhook secrets.
2. Enforce MFA/passkeys for Vercel + GitHub org/team members.
3. Review Vercel activity + deployment logs for suspicious changes.
4. Keep elevated monitoring on auth/deploy/function anomalies for at least 30 days.

## 7) Operational guardrails

- Keep `/`, `/index.html`, and extensionless SPA shell routes uncacheable (`private, no-store`) to prevent stale entry bundles loading removed chunk files after deploys (observed as `AsyncRequireError`/404 on `_expo/static/js/web/*` in Edge and other browsers).
- Keep `/api/*` and auth redirect routes uncacheable.
- Keep static asset caching immutable only for hashed asset paths that are still present in the current deployment output.
- Keep SPA rewrite restricted to extensionless routes.
- Never store service-role credentials in `EXPO_PUBLIC_*` env variables.

## 8) Related docs

- Reset flow setup: `apps/mobile/docs/RESET_PASSWORD_SETUP.md`
- Admin analytics setup: `apps/mobile/docs/ADMIN_ANALYTICS_SETUP.md`
- Security baseline: `SECURITY_AUDIT.md`

## 9) Browser compatibility smoke checks (Chrome, Edge, Safari, Firefox)

After each production deploy, validate in at least one fresh session per browser:

- Open `/` then navigate to Login and Sign Up.
- Confirm no 404 for dynamic chunks under `/_expo/static/js/web/`.
- Confirm no `AsyncRequireError` or MIME errors for JS chunks.
- Verify auth callback and reset links complete and route correctly.

If a browser shows blank auth screens with missing chunk errors, capture the failing chunk URL and verify it exists in the deployed `dist/_expo/static/js/web/` output for that deployment; missing files usually indicate stale app-shell caching versus latest assets.
