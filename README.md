# wellness-mobile-app

Sleep-first wellness MVP built as a mobile app with authenticated access, verified email onboarding, offline-friendly audio playback, and managed backend services via Supabase.

---

## What this project is

This repository contains a **React Native + Expo** mobile app for guided sleep content (soundscapes, guided sleep sessions, and affirmations), plus its backend integration and deployment configuration.

At a high level:
- Users sign up/login with Supabase Auth.
- Email verification is required before entering the main app.
- Users browse curated audio sessions and play them in-app.
- Playback state/progress is managed in the app layer.
- Account actions include password reset and account deletion.
- Account deletion is handled by a Supabase Edge Function.

---

## Tech stack

### Frontend (mobile client)
- **Framework:** React Native (via **Expo SDK 54**)
- **UI runtime:** React 19 + React Native 0.81
- **Language:** TypeScript
- **Navigation:** React Navigation (native stack)
- **State approach:** Screen/local React state + service modules (no global Redux-style store)
- **Local persistence:**
  - AsyncStorage (Supabase auth session persistence on native)
  - Expo SecureStore (chunked helper for larger secure values)
- **Audio:** `expo-audio`
- **Build/OTA pipeline:** EAS Build + Expo Updates

### Backend / platform
- **Primary backend platform:** Supabase
  - Supabase Auth for signup/login/session
  - Supabase project configuration managed in `supabase/config.toml`
- **Custom backend logic:** Supabase Edge Function (`delete-account`)
  - Runtime: Deno
  - Language: TypeScript
  - Responsibility: Validate caller JWT and delete the user through Supabase Admin API

### Tooling
- **Monorepo/workspace manager:** pnpm workspaces
- **Linting:** Expo ESLint config
- **Type checking:** TypeScript (`tsc --noEmit`)
- **Release checks:** shell-based pre-release script (`apps/mobile/scripts/pre-release.sh`)

---

## Repository layout

```text
.
├── apps/mobile                  # Expo React Native application
│   ├── App.tsx                  # App bootstrap, auth gating, update checks, deep-link handling
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── content/             # Local audio catalog metadata
│   │   ├── i18n/                # User-facing strings
│   │   ├── navigation/          # Auth stack + app stack
│   │   ├── screens/             # Route-level screen composition
│   │   ├── services/            # Supabase client, deep links, secure storage, startup helpers
│   │   └── theme/               # Design tokens
│   ├── assets/                  # Audio + image assets bundled with app
│   ├── scripts/                 # Local automation scripts
│   └── docs/                    # Release/store checklists
├── supabase/
│   ├── config.toml              # Supabase local/dev config
│   └── functions/
│       └── delete-account/      # Edge function for account deletion
├── package.json                 # Workspace-level scripts
└── pnpm-workspace.yaml          # Workspace package definitions
```

---

## Application architecture

## 1) App bootstrap and session gate
`apps/mobile/App.tsx` is the composition root and startup orchestrator:
- Prevents splash auto-hide, then hides splash after initialization.
- Reads initial deep links and subscribes to incoming auth links.
- Hydrates Supabase session and subscribes to auth state changes.
- Computes whether user should see auth flow or in-app flow.
- Checks for OTA updates (when enabled) and prompts user to apply.

This means there is a single top-level decision point:
- **AuthStack** if no valid verified session (or reset-password deep-link override).
- **AppStack** if authenticated and verified.

## 2) Navigation model
Two explicit stack navigators:
- `AuthStack` for onboarding/auth routes (welcome, signup, login, verify, forgot/reset password).
- `AppStack` for post-login routes (home, player, profile/account, settings).

Route types are strongly typed via TypeScript in `src/navigation/types.ts`, reducing runtime navigation mistakes.

## 3) Service layer pattern
Cross-cutting logic is extracted from screens into `src/services/*`:
- Supabase client creation and auth refresh behavior.
- Auth deep-link parsing/handling.
- Startup routing hints for auth entry points.
- Chunked secure storage helper.
- Update-pending state helper.

This keeps screens focused on UI composition and user interaction rather than infrastructure concerns.

## 4) Content model
Audio metadata is defined in `src/content/audioCatalog.ts`:
- Each track has ID, title/subtitle, creator, duration, asset reference, image references, premium flag, and type.
- `AudioId` union type provides compile-time safety for routes and lookups.
- Catalog helper functions support favorites toggling and deterministic lookup.

## 5) Theming + strings
- Tokens live in `src/theme/tokens.ts`.
- User-facing strings live in `src/i18n/strings.ts` (Indonesian copy currently).

This separation supports consistent styling and easier localization updates.

---

## Backend architecture details

This project uses a **managed backend architecture** rather than a traditional always-on custom API server.

### Supabase Auth integration
Mobile app uses `@supabase/supabase-js` with:
- URL + anon key from Expo public env vars.
- Session persistence enabled.
- Token auto-refresh enabled.
- Native storage bridge via AsyncStorage (non-web platforms).

### Edge Function: delete-account
`supabase/functions/delete-account/index.ts` handles account deletion:
1. Accepts only `POST`.
2. Requires `x-user-jwt` header.
3. Validates the JWT by calling `auth.getUser()` using anon-key client.
4. Uses service-role client to delete the authenticated user by ID.
5. Returns JSON response with appropriate status codes.

This splits trust correctly between user context validation and privileged admin operation.

---

## Runtime/data flow (request-level view)

1. User opens app.
2. App initializes services and loads current auth session.
3. If deep link indicates reset flow, auth route is overridden to reset screen.
4. User signs in/up via Supabase Auth.
5. Verified users land in app stack and browse/play local bundled audio content.
6. Sensitive local values (when used) can be persisted via secure chunked storage helper.
7. If user requests deletion, app calls `delete-account` function with user JWT.
8. Edge function validates + deletes user and returns status.

---

## Environment variables

For local development (typically in `apps/mobile/.env`):

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

For deployed builds (EAS preview/production), set the same variables in EAS environment configuration.

---

## Getting started

### Prerequisites
- Node.js (LTS recommended)
- pnpm (workspace uses pnpm)
- Expo tooling (via `npx expo`/project scripts)
- Supabase project credentials

### Install dependencies
```bash
pnpm install
```

### Run mobile app (from repo root)
```bash
pnpm -C apps/mobile start
```

Useful variants:
```bash
pnpm -C apps/mobile android
pnpm -C apps/mobile ios
pnpm -C apps/mobile web
```

---

## Quality checks

From repo root:
```bash
pnpm lint
pnpm typecheck
```

Pre-release flow (mobile app scope):
```bash
pnpm -C apps/mobile pre-release
```

This script runs lint/typecheck and prints a manual QA checklist for auth, playback, UI, and env readiness.

---

## Build and release overview

- Expo app configuration lives in root/app-level `app.json` and `eas.json`.
- EAS profiles include development, preview, and production variants.
- OTA update checks are integrated in app startup logic (when Expo Updates is enabled).

For operational checklists, see:
- `apps/mobile/docs/RELEASE_CHECKLIST.md`
- `apps/mobile/docs/STORE_SUBMISSION_CHECKLIST.md`

---

## Web responsive layout policy

The app now uses a viewport-based responsive wrapper for select **web-only** screens.

- `apps/mobile/src/hooks/useViewportWidth.ts` tracks `window.innerWidth` and updates on resize (SSR-safe with `typeof window !== "undefined"`).
- `apps/mobile/src/components/WebResponsiveFrame.tsx` applies breakpoint behavior:
  - `Platform.OS !== "web"` → render children unchanged.
  - `window.innerWidth <= 640` → render children unchanged (mobile-like web).
  - `window.innerWidth > 640` → render children in a centered frame (`maxWidth: 480`, padding, neutral background, subtle elevation).
- Applied in web screens only:
  - `apps/mobile/src/screens/LandingScreen.web.tsx`
  - `apps/mobile/src/screens/App/HomeScreen.web.tsx`
  - `apps/mobile/src/screens/Auth/LoginScreen.web.tsx`

Guardrails:
- Do not use user-agent detection for layout decisions.
- Do not change native iOS/Android layout behavior when improving web layout.
- Prefer `.web.tsx` entry points for web-specific presentation changes.

## Notes for contributors

- Keep screens focused on composition; place reusable visuals in `src/components`.
- Prefer shared strings from `src/i18n/strings.ts` for user-visible copy.
- Prefer theme tokens from `src/theme/tokens.ts` over ad-hoc values.
- If adding audio entries, ensure metadata (duration/category/cover-thumbnail pairing) stays accurate.

