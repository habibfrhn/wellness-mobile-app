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
- [ ] Logout fully clears session and returns to auth entry
- [ ] Automated regression suite passes (`pnpm test`)
- [ ] Delete account works (user removed from Supabase Auth)

## 3) Core app flows
- [ ] Home loads and renders correctly
- [ ] Night flow works (`NightMode` → `NightCheckIn` → `NightStep1/2/3` → `NightCheckOut`)
- [ ] Audio player play/pause/seek/progress behaviors are correct
- [ ] Reminder settings save and load correctly

## 4) Web-specific checks
- [ ] Landing/auth/app routes resolve on direct URL open and refresh
- [ ] `/admin` renders authorized dashboard for admin user
- [ ] `/admin` shows unauthorized state for non-admin user
- [ ] Desktop responsive layouts render correctly

## 5) Environment + deployment readiness
- [ ] `EXPO_PUBLIC_SUPABASE_URL` set in target env
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY` set in target env
- [ ] `EXPO_PUBLIC_WEB_ORIGIN` and `EXPO_PUBLIC_WEB_ALLOWED_ORIGINS` match deployed domain set
- [ ] Supabase Auth URL config and Google OAuth redirect URI are aligned with deployed web origin(s)
