# Release Checklist (MVP)

## 1) Code quality gates

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm pre-release`
- [ ] `pnpm test`

## 2) Auth & account flow

- [ ] Sign up → verify email → app access granted.
- [ ] Email/password login works.
- [ ] Google OAuth login works.
- [ ] Forgot/reset password works end-to-end (`/auth/reset` intake → `/atur-ulang-kata-sandi` screen).
- [ ] Logout clears local session and returns user to auth entry.
- [ ] Delete account works end-to-end (`delete-account-v2` path).

## 3) Core app flows

- [ ] Home loads and key sections render.
- [ ] Night flow works (`NightMode` → `NightCheckIn` → `NightStep1/2/3` → `NightCheckOut`).
- [ ] Audio player play/pause/seek/progress behavior is correct.
- [ ] Reminder settings save and load correctly.

## 4) Web-specific checks

- [ ] Landing/auth/app routes resolve on direct open + refresh.
- [ ] `/admin` renders dashboard for mapped admin user.
- [ ] `/admin` shows unauthorized state for non-admin user.
- [ ] Desktop responsive layout is intact.

## 5) Analytics and admin checks

- [ ] `track-analytics-event` deployed to target Supabase project.
- [ ] Events are arriving in `analytics_events`.
- [ ] Admin RPCs return data for selected date ranges.

## 6) Environment and deployment readiness

- [ ] `EXPO_PUBLIC_SUPABASE_URL` set in target environment.
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY` set in target environment.
- [ ] `EXPO_PUBLIC_WEB_ORIGIN` + `EXPO_PUBLIC_WEB_ALLOWED_ORIGINS` match deployed domain set.
- [ ] Supabase Auth URL config and Google OAuth redirect URI align with deployed origins.
- [ ] Vercel project settings match `apps/mobile/DEPLOY_WEB.md`.
