# Lumepo (wellness-mobile-app)

Sleep-focused wellness MVP built with Expo (React Native) and Supabase.

The app helps users build a nightly wind-down ritual with guided audio content, simple night check-in/check-out flows, and lightweight behavior analytics for product validation.

## What exists today

### Product purpose
- Help users close the day calmly through short, structured night routines.
- Offer curated audio tracks (guided sessions, affirmations, and soundscapes).
- Track high-level behavioral events to support product decisions.

### Platforms
- **Native:** iOS and Android via Expo.
- **Web:** Expo web export deployed as SPA (Vercel config in `apps/mobile/vercel.json`).

### Current top-level user flows
1. **Landing (web)** → user can explore marketing-style landing content and enter auth.
2. **Auth**
   - Email/password signup + login.
   - Google OAuth continuation.
   - Email verification gate before entering the app flow.
   - Forgot/reset password via Supabase auth links.
3. **Main app**
   - Home feed with greeting, sleep CTA, audio lists, and (web) feedback CTA.
   - Tailored night flow (`NightMode` → `NightCheckIn` → steps → `NightCheckOut`).
   - Audio player flow (single track and small playlist variants for tailored sessions).
4. **Account/settings**
   - Profile/account screen, settings, reminder settings, privacy policy, terms.
   - Delete account (via Supabase Edge Function).
5. **Admin analytics (web)**
   - `/admin` route (and related admin query/hash paths) shows admin login/access check and dashboard if user is authorized.

## Important screens and routes

### Root behavior (`apps/mobile/App.tsx`)
- Bootstraps session, auth-link handling, splash/update behavior, and root routing.
- Web root can render `Landing`, `Auth`, `App`, or admin dashboard depending on route/session state.
- `AuthStack` and `AppStack` remain separate and strongly typed.

### Auth stack (`apps/mobile/src/navigation/AuthStack.tsx`)
- `Welcome` (native only in normal flow)
- `SignUp`
- `Login`
- `VerifyEmail`
- `ForgotPassword`
- `ResetPassword`

### App stack (`apps/mobile/src/navigation/AppStack.tsx`)
- `Home`
- `Player`
- `NightMode`, `NightCheckIn`, `NightStep1`, `NightStep2`, `NightStep3`, `NightCheckOut`
- `Account`, `Settings`, `ReminderSettings`
- `PrivacyPolicy`, `TermsConditions`, `ResetPassword`

## Tech stack

### Client
- Expo SDK 54 + React Native 0.81 + React 19
- TypeScript
- React Navigation (native stack)
- Supabase JS client (`@supabase/supabase-js`)
- Expo modules: audio, linking, notifications, updates, secure store
- AsyncStorage for local persistence and some cached progress

### Backend / data platform
- Supabase Auth (email/password + OAuth provider support)
- Supabase Postgres + RLS/RPC policies (via migrations in `supabase/migrations`)
- Supabase Edge Functions:
  - `record-night-session`
  - `track-analytics-event`
  - `delete-user-account`

## Project structure

```text
.
├── apps/mobile
│   ├── App.tsx
│   ├── app.config.ts
│   ├── index.html
│   ├── vercel.json
│   ├── docs/
│   ├── scripts/
│   └── src/
│       ├── components/
│       ├── constants/
│       ├── content/
│       ├── hooks/
│       ├── i18n/
│       ├── navigation/
│       ├── screens/
│       ├── services/
│       └── theme/
├── supabase
│   ├── config.toml
│   ├── functions/
│   └── migrations/
├── AGENTS.md
└── SECURITY_AUDIT.md
```

## Setup (local development)

### Prerequisites
- Node.js LTS
- pnpm (repo uses `pnpm@10`)
- Expo CLI via package scripts
- Supabase project credentials

### Install
```bash
pnpm install
```

### Required environment variables
Create `apps/mobile/.env` for local development:

```bash
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
# optional (recommended for web auth redirects)
EXPO_PUBLIC_WEB_ORIGIN=http://localhost:8081
```

Notes:
- `EXPO_PUBLIC_*` values are bundled client-side. Never place server secrets here.
- Service-role keys must stay in Supabase function secrets only.

### Run
From repo root:

```bash
pnpm -C apps/mobile start
```

Platform shortcuts:

```bash
pnpm -C apps/mobile ios
pnpm -C apps/mobile android
pnpm -C apps/mobile web
```

## Auth flow details

- Supabase session is hydrated on app start.
- Email verification is checked via `session.user.email_confirmed_at`.
- Deep links and web callback/reset paths are normalized through auth link services.
- Web auth callback/reset UI states are handled explicitly to avoid raw auth errors in-route.

## Database/backend dependencies

### Tables/functions used by app flows (non-exhaustive)
- `night_streak_progress` for streak state.
- `night_sessions` writes via `record-night-session` function.
- Analytics ingestion and admin analytics RPCs/tables from migrations.
- `admin_users` + `is_admin()` for admin access control.

### Edge function behavior
- `record-night-session`: authenticated session required; validates payload and rate limits before writing.
- `track-analytics-event`: accepts approved event schema, supports auth/anon ingestion, rate limited.
- `delete-user-account`: requires bearer token, validates user, rate limits, then deletes via service-role admin API.

## Admin features

- Admin dashboard is web-only and route-driven (`/admin` variants).
- Access is enforced by backend `is_admin()` checks and admin analytics RPC restrictions.
- Client never includes service-role credentials.
- Setup/bootstrap instructions for admin data are in `apps/mobile/docs/ADMIN_ANALYTICS_SETUP.md`.

## Analytics & event tracking

- Client events are sent through `src/services/analytics.ts`.
- Current tracked categories include landing funnel, audio engagement, and tailored session behavior.
- Event payloads are sanitized client-side, validated again in edge function/database constraints, and rate limited.

## Feedback form integration

- Web home screen includes a feedback CTA component (`HomeFeedbackSection.web.tsx`).
- It opens an external Jotform URL in the browser.
- No backend proxy is used in this repo for feedback submission.

## UI and responsive behavior

- Design tokens: `apps/mobile/src/theme/tokens.ts`
- Shared strings: `apps/mobile/src/i18n/strings.ts`
- Web responsiveness uses viewport width hooks/utilities (`useViewportWidth`, `constants/webLayout`) and `.web.tsx` screen variants.
- `WebResponsiveFrame` is used to keep desktop web layout framed while preserving native behavior.

## Deployment notes

### Web deployment
- Static export output: `apps/mobile/dist`
- Build command: `pnpm export:web` (inside `apps/mobile`)
- Vercel headers/rewrites are defined in `apps/mobile/vercel.json`.
- Additional web deploy notes: `apps/mobile/DEPLOY_WEB.md`

### Mobile release process
- App config: `apps/mobile/app.config.ts`
- EAS profiles/config: `apps/mobile/eas.json` (and root `eas.json`)
- Checklists:
  - `apps/mobile/docs/RELEASE_CHECKLIST.md`
  - `apps/mobile/docs/STORE_SUBMISSION_CHECKLIST.md`

## Quality checks

From repo root:

```bash
pnpm lint
pnpm typecheck
pnpm pre-release
```

If lint/typecheck fail, verify whether failures are from current changes or existing repo issues before release decisions.

## Security and operational docs

- `SECURITY_AUDIT.md` contains the latest pre-deployment security review notes and required environment/infrastructure follow-ups.
- For Supabase deployment hardening, keep function secrets, auth redirect URLs, and admin bootstrap SQL aligned with deployed domains.
