# Release Checklist (Production Readiness)

Use this checklist before and after releasing.

## A) Pre-merge / pre-release checks

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm pre-release`
- [ ] `pnpm -C apps/mobile export:web`

## B) Environment + config checks

- [ ] `EXPO_PUBLIC_SUPABASE_URL` set for target environment
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY` set for target environment
- [ ] `EXPO_PUBLIC_WEB_ORIGIN` matches canonical domain
- [ ] `EXPO_PUBLIC_WEB_ALLOWED_ORIGINS` includes all allowed callback/reset origins
- [ ] Supabase Auth Site URL + Redirect URLs match deployed domains
- [ ] Google OAuth redirect URI includes Supabase callback endpoint

## C) Core functional checks

- [ ] Sign up → verify email → login flow works
- [ ] Email/password login works
- [ ] Google OAuth login works
- [ ] Forgot/reset password works (`/auth/reset`)
- [ ] Logout clears session and returns to auth entry
- [ ] Delete account flow works
- [ ] Night flow works end-to-end
- [ ] Audio play/pause/seek/progress works
- [ ] Reminder settings persist correctly

## D) Web checks

- [ ] Route refresh and direct URL open work
- [ ] `/admin` authorized state works for admin
- [ ] `/admin` unauthorized state works for non-admin
- [ ] Desktop/tablet/mobile web layouts are usable

## E) Production deployment verification (Vercel)

- [ ] Latest release commit is on `main`
- [ ] Vercel deployment from branch `main` is `Ready`
- [ ] Deployment environment is `Production` (not Preview)
- [ ] Build logs show successful install/build/export
- [ ] Production domain alias points to newest deployment
- [ ] Live production URL serves expected latest behavior

## F) Post-deploy smoke test

- [ ] Login/logout on production
- [ ] Reset password link flow on production
- [ ] `/admin` access behavior on production
- [ ] Audio playback + analytics event ingestion sanity check
