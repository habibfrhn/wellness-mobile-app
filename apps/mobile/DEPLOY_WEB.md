# Deploy Web (Expo + Vercel)

This runbook is for production web deployments of `apps/mobile`.

## 1) Source of truth

- Vercel config: repository root `vercel.json`
- Production branch: `main`
- Build command: `pnpm -C apps/mobile export:web`
- Output directory: `apps/mobile/dist`

`apps/mobile/vercel.json` exists only as compatibility fallback for projects that intentionally set Vercel Root Directory to `apps/mobile`.

## 2) Vercel project settings to verify

In **Vercel → Project → Settings**:

- Git repository points to this repo
- Production Branch is `main`
- Install Command is `pnpm install --frozen-lockfile`
- Build Command is `pnpm -C apps/mobile export:web`
- Output Directory is `apps/mobile/dist`
- Root Directory is repository root (`.`) when using repo-level `vercel.json`

## 3) Required environment variables

Set these for **Production** and **Preview** environments:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_WEB_ORIGIN`
- `EXPO_PUBLIC_WEB_ALLOWED_ORIGINS`

Optional:

- `EXPO_PUBLIC_ANALYTICS_ENABLED=true`
- `EXPO_PUBLIC_AUTH_DEBUG=0`

## 4) Deployment steps

From repository root:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm -C apps/mobile export:web
```

Push to `main`.

## 5) Verify latest `main` commit is serving Production

1. In GitHub, copy latest commit SHA from `main`.
2. In **Vercel → Deployments**, find newest deployment for branch `main`.
3. Confirm deployment status is **Ready**.
4. Confirm environment is **Production** (not Preview).
5. Open deployment details and verify commit SHA matches latest `main`.
6. Open deployment **Build Logs** and confirm install/build/export completed successfully.
7. In **Vercel → Settings → Domains**, confirm production domain alias points to that deployment.
8. Load production URL and verify expected UI/version behavior.

## 6) Common reasons latest commit is not in production

- Build failed in Vercel logs
- Deployment skipped/cancelled
- Wrong Production Branch configured (not `main`)
- Wrong Root Directory/build/output settings
- Required env vars missing in **Production** scope
- Commit deployed to Preview but not promoted to Production
- Production domain alias still points to older deployment

## 7) Fast recovery steps

1. Fix the underlying setting/build/env issue.
2. Re-deploy the latest `main` commit.
3. If deployment is Ready but not live, use **Promote to Production**.
4. Re-check domain alias assignment.
5. Re-run smoke checks: auth login, reset password, `/admin` authorization, audio playback.

## 8) OAuth/Supabase alignment checklist

- Supabase Auth Site URL matches canonical production origin.
- Supabase Redirect URLs include `/auth/callback` and `/auth/reset` for all allowed origins.
- Google OAuth redirect includes: `https://<project-ref>.supabase.co/auth/v1/callback`.
- `EXPO_PUBLIC_WEB_ORIGIN` and `EXPO_PUBLIC_WEB_ALLOWED_ORIGINS` match deployed domains.

## 9) Related docs

- `README.md`
- `apps/mobile/docs/RELEASE_CHECKLIST.md`
- `apps/mobile/docs/TROUBLESHOOTING.md`
- `apps/mobile/docs/RESET_PASSWORD_SETUP.md`
- `SECURITY_AUDIT.md`
