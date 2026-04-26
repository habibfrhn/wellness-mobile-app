# Troubleshooting Guide

Use this guide for production and local issues in `apps/mobile`.

## 1) Vercel: latest `main` commit not visible in production

### Checks

1. Confirm commit exists on GitHub `main`.
2. In Vercel Deployments, check newest deployment for branch `main`.
3. Confirm status `Ready` and environment `Production`.
4. Confirm deployment commit SHA matches latest GitHub `main` SHA.
5. Open build logs and look for install/build/export failures.
6. Confirm project settings:
   - Production Branch = `main`
   - Build Command = `pnpm -C apps/mobile export:web`
   - Output Directory = `apps/mobile/dist`
7. Confirm required `EXPO_PUBLIC_*` env vars exist in **Production** scope.
8. Confirm production domain alias points to newest production deployment.

### Fixes

- Build failed: fix logs error, redeploy.
- Deployed to Preview only: promote or redeploy as Production.
- Wrong branch/root/output: correct settings, redeploy latest `main`.
- Old alias target: reassign production domain alias to newest deployment.

## 2) Web auth callback/reset fails

### Symptoms

- OAuth returns but user is not logged in.
- Reset link opens app but reset flow does not complete.

### Checks

1. Verify Supabase Auth URL config includes all callback/reset URLs.
2. Verify `EXPO_PUBLIC_WEB_ORIGIN` and `EXPO_PUBLIC_WEB_ALLOWED_ORIGINS` are correct.
3. Verify callback/reset path used is `/auth/callback` or `/auth/reset` (or Expo web variants).
4. If using multiple subdomains, verify allowlist uses explicit entries or wildcard syntax (example: `https://*.lumepo.com`).
5. Check browser console for `[auth]` logs like `oauth_callback_rejected`, `oauth_callback_missing_expected_params`, or `email_password_login_result`.

### Fixes

- Update Supabase Redirect URLs.
- Correct Production env vars in Vercel.
- Re-test with fresh auth/reset link.

## 3) Login / sign-up pages do not open correctly on production web

### Checks

1. Open `/masuk` and `/daftar` directly in production.
2. Confirm no infinite redirects between `/`, `/masuk`, and `/daftar`.
3. Confirm console has `login_screen_mount` / `signup_screen_mount` auth debug events.
4. Confirm `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are present in production environment variables.

### Fixes

- If paths fail only on one domain/subdomain, align `EXPO_PUBLIC_WEB_ALLOWED_ORIGINS` and Supabase Redirect URLs for that exact origin.
- If callback arrives but session is missing, re-check provider redirect URI in Supabase and OAuth provider dashboard.
- Re-deploy after env updates and retest with a fresh private/incognito browser session.

## 4) `/admin` route shows unauthorized unexpectedly

### Checks

1. Confirm signed-in user exists in `public.admin_users`.
2. Run `select public.is_admin();` as that user.
3. Confirm admin analytics RPC grants/policies are present (migrations applied).
4. Confirm dashboard requests succeed in browser network panel.

### Fixes

- Add admin mapping in `admin_users`.
- Apply missing migrations.
- Re-login after role/mapping changes.

## 5) Local app fails to start due to missing env vars

### Checks

- Ensure `apps/mobile/.env` contains:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Restart Expo after changing env vars.

### Fixes

```bash
pnpm install
pnpm -C apps/mobile start -c
```

## 6) Quality gates fail

Run from repo root:

```bash
pnpm lint
pnpm typecheck
pnpm -C apps/mobile export:web
```

Address failures before merging to `main`.
