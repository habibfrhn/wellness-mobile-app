# Release Checklist (MVP)

## 1) Code quality gates

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm pre-release`

## 2) Auth & session

- [ ] Sign up → verify email → session established
- [ ] Email/password login works
- [ ] Google OAuth login works
- [ ] Forgot/reset password works end-to-end (`/auth/reset` flow)
- [ ] Resend verification email flow works
- [ ] Logout fully clears session and returns to auth entry
- [ ] Delete account works (user removed from Supabase Auth)

## 3) Core app flows

- [ ] Home loads and renders correctly
- [ ] Night flow works (`NightMode` → `NightCheckIn` → `NightStep1/2/3` → `NightCheckOut`)
- [ ] Audio player play/pause/seek/progress behaviors are correct
- [ ] Reminder settings save/load correctly

## 4) Web-specific checks

- [ ] Landing/auth/app routes resolve on direct URL open + browser refresh
- [ ] `/admin` renders dashboard for authorized admin user
- [ ] `/admin` shows unauthorized state for non-admin user
- [ ] Desktop responsive layouts render correctly

## 5) Environment + deployment readiness

- [ ] `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` set in target app env
- [ ] `EXPO_PUBLIC_WEB_ORIGIN` + `EXPO_PUBLIC_WEB_ALLOWED_ORIGINS` match deployed domains
- [ ] Supabase Auth URL config and Google OAuth redirect URI match deployed origins
- [ ] Supabase function secrets (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CORS_ALLOWED_ORIGINS`) are set
- [ ] Required edge functions are deployed (`track-analytics-event`, `record-night-session`, `delete-account-v2`, `resend-verification-email`)
