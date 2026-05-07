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
- [ ] Delete account works (user removed from Supabase Auth)

## 3) Core app flows
- [ ] Home loads and renders correctly
- [ ] Night flow works (`NightMode` → `NightCheckIn` → `NightStep1/2/3` → `NightCheckOut`)
- [ ] Audio player play/pause/seek/progress behaviors are correct
- [ ] Audio catalog metadata/assets are synced (`apps/mobile/src/content/audioCatalog.ts` and `apps/mobile/assets/audio/*`)
- [ ] Audio catalog update guide reviewed when audio files change (`apps/mobile/docs/AUDIO_CATALOG_UPDATE_GUIDE.md`)
- [ ] Reminder settings save and load correctly

## 4) Web-specific checks
- [ ] Landing/auth/app routes resolve on direct URL open and refresh
- [ ] `/admin` renders authorized dashboard for admin user
- [ ] `/admin` shows unauthorized state for non-admin user
- [ ] Desktop responsive layouts render correctly, including the home screen audio sections and feedback card without doubled/offset shadows

## 5) Environment + deployment readiness
- [ ] `EXPO_PUBLIC_SUPABASE_URL` set in target env
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY` set in target env
- [ ] `EXPO_PUBLIC_WEB_ORIGIN` and `EXPO_PUBLIC_WEB_ALLOWED_ORIGINS` match deployed domain set
- [ ] Supabase Auth URL config and Google OAuth redirect URI are aligned with deployed web origin(s)

## 6) Supabase backend readiness
- [ ] `supabase migration list` shows every local migration applied in the target project, including admin analytics migrations through `20260507120000`
- [ ] `track-analytics-event` is deployed to the same Supabase project used by the app
- [ ] Admin account exists in `public.admin_users` and `public.is_admin()` returns `true` for that auth user
- [ ] A fresh audio play writes a row to `public.audio_play_sessions` and appears in `/admin` after refresh
