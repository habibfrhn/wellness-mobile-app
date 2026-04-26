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

Use repository-level `vercel.json` (at `/vercel.json`) as the source of truth for deploy settings.

Expected project config in Vercel dashboard:

- **Production Branch**: `main`
- **Install Command**: `pnpm install --frozen-lockfile`
- **Build Command**: `pnpm -C apps/mobile export:web`
- **Output Directory**: `apps/mobile/dist`

`/vercel.json` enforces:

- deploy build/export from this monorepo root,
- production deployment enabled for `main`,
- the same SPA/cache/security headers previously defined in `apps/mobile/vercel.json`.

`apps/mobile/vercel.json` remains for backward compatibility with projects that keep `apps/mobile` as Root Directory.

- SPA rewrites for extensionless routes,
- cache headers for app shell/auth/static assets,
- security headers baseline,
- no `ignoreCommand`, so every production-branch commit triggers a fresh deployment.


## 2.1) If latest `main` commit is not live in Production

Check in this exact order:

1. Vercel **Project → Settings → Git**
   - Repository must be this repo.
   - **Production Branch** must be `main` (not `master`/`work`/custom).
   - Auto-assign custom production domains must be enabled.
2. Vercel **Deployments**
   - Find newest deployment for branch `main`.
   - Confirm its state is **Ready** and environment is **Production** (not Preview).
3. Open that deployment and verify: commit SHA matches latest `main`.
4. If the latest `main` deployment is Ready but not serving traffic, open deployment menu and click **Promote to Production**.
5. In **Settings → Domains**, verify production domain aliases point to the newest production deployment.
6. In **Settings → Environment Variables**, confirm required `EXPO_PUBLIC_*` vars exist in **Production**, not only Preview/Development.

Manual dashboard action is expected when a previous deployment is still pinned/promoted or when a ready deployment has not been aliased to production domain yet.

## 3) Required web auth environment variables

Set these in Vercel for **Preview** and **Production**:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_WEB_ORIGIN` (canonical deployed origin, e.g. `https://lumepo.com`)
- `EXPO_PUBLIC_WEB_ALLOWED_ORIGINS` (comma-separated allowlist including all valid origins)

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

- Keep `/api/*` and auth redirect routes uncacheable.
- Keep static asset caching immutable only for hashed asset paths.
- Keep SPA rewrite restricted to extensionless routes.
- Never store service-role credentials in `EXPO_PUBLIC_*` env variables.

## 8) Related docs

- Reset flow setup: `apps/mobile/docs/RESET_PASSWORD_SETUP.md`
- Admin analytics setup: `apps/mobile/docs/ADMIN_ANALYTICS_SETUP.md`
- Security baseline: `SECURITY_AUDIT.md`
