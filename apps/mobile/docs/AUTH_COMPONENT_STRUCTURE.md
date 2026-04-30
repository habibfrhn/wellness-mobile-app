# Auth/OAuth Component Structure

This document maps the current auth surface into focused units so future changes can stay targeted.

## Screen layer (UI only)

- `src/screens/Auth/LoginScreen.tsx` (native)
- `src/screens/Auth/LoginScreen.web.tsx` (web)
- `src/screens/Auth/SignUpScreen.tsx`
- `src/screens/Auth/ForgotPasswordScreen.tsx`
- `src/screens/App/ResetPasswordScreen.tsx`

Screen responsibilities:
- field validation and UI state
- navigation to auth routes
- calling service-layer auth functions

## Service layer (auth logic)

- `src/services/authEmailPassword.ts`
  - central email/password sign-in execution + verification gating
  - shared by native and web login screens
- `src/services/authOAuth.ts`
  - OAuth start/initiation logic (Google)
- `src/services/authLinks.ts`
  - callback/reset deep-link parsing + session exchange/set/verify flow
- `src/services/webAuth.ts`
  - web origin allowlist, wildcard matching, callback/reset URL builders
- `src/services/authSession.ts`
  - restore/refresh/signout/session cleanup behavior
- `src/services/authSecurity.ts`
  - auth error classification/safe user-facing messages
- `src/services/authValidation.ts`
  - shared email normalization/validation used by login/signup/forgot-password screens
- `src/services/authDebug.ts`
  - opt-in debug event logger controlled by `EXPO_PUBLIC_AUTH_DEBUG=1`

## App orchestration

- `App.tsx` is the single source of truth for web auth/app stack routing.
- Session-driven root redirects happen in `App.tsx` (Auth/Landing/App decision).
- Login screens should only perform success completion steps specific to the surface (for web: final `/beranda` URL update).

## Change rules (to reduce regressions)

1. Keep network/session logic in services, not screen files.
2. Reuse `authEmailPassword.ts` for email/password behavior changes.
3. Update both web and native screens only for UI/navigation concerns.
4. If origin rules change, update `webAuth.ts` + deployment docs together.
5. If callback/reset behavior changes, update `authLinks.ts` + `RESET_PASSWORD_SETUP.md`.
