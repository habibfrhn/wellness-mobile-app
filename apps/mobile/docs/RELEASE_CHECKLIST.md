# Release Checklist (MVP)

Use this before shipping preview/production mobile or web changes.

## 1) Code quality gates

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm pre-release`

## 2) Auth & account flows

- [ ] Sign up → verify email → verified login works.
- [ ] Email/password login works.
- [ ] Google OAuth login works.
- [ ] Forgot/reset password flow works from email link (`/auth/reset` handling).
- [ ] Resend verification email works with expected cooldown behavior.
- [ ] Logout clears session and returns to auth entry.
- [ ] Delete account succeeds and user is removed from Supabase Auth.

## 3) Core user flows

- [ ] Home loads and personalized data renders.
- [ ] Night flow works (`NightMode` → `NightCheckIn` → `NightStep1/2/3` → `NightCheckOut`).
- [ ] Night session save/streak update works (no edge-function errors).
- [ ] Audio player play/pause/seek/progress behavior is correct.
- [ ] Reminder settings save/load correctly.

## 4) Web-specific checks

- [ ] Localized landing/auth/app routes resolve on direct open + refresh.
- [ ] `/admin` renders dashboard for admin users.
- [ ] `/admin` blocks non-admin users.
- [ ] Desktop responsive layout behaves as expected.

## 5) Environment and deployment readiness

- [ ] `EXPO_PUBLIC_SUPABASE_URL` configured.
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY` configured.
- [ ] `EXPO_PUBLIC_WEB_ORIGIN` and `EXPO_PUBLIC_WEB_ALLOWED_ORIGINS` aligned with deployed domain set.
- [ ] Supabase Auth URL config + Google OAuth redirect URI aligned.
- [ ] Required edge functions deployed: `record-night-session`, `delete-account-v2`, `resend-verification-email`, `track-analytics-event`.
