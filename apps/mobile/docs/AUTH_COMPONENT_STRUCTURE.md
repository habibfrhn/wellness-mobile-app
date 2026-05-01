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
- `src/services/emailVerificationRedirect.ts`
  - persists pending signup email verification context so callback links without explicit `type=signup` still redirect to Login
- `src/services/authSecurity.ts`
  - auth error classification/safe user-facing messages
- `src/services/authValidation.ts`
  - shared email normalization/validation used by login/signup/forgot-password screens
- `src/services/authDebug.ts`
  - opt-in debug event logger controlled by `EXPO_PUBLIC_AUTH_DEBUG=1`

## App orchestration

- `App.tsx` is the single source of truth for web auth/app stack routing.
- Session-driven root redirects happen in `App.tsx` (Auth/Landing/App decision).
- Web bootstrap in `App.tsx` must process auth links from both dedicated paths (`/auth/callback`, `/auth/reset`) and root URLs that still carry auth params (`code`, `token_hash`, `type`, etc.).
- Login screens should only perform success completion steps specific to the surface (for web: final `/beranda` URL update).

## Change rules (to reduce regressions)

1. Keep network/session logic in services, not screen files.
2. Reuse `authEmailPassword.ts` for email/password behavior changes.
3. Update both web and native screens only for UI/navigation concerns.
4. If origin rules change, update `webAuth.ts` + deployment docs together.
5. If callback/reset behavior changes, update `authLinks.ts` + `RESET_PASSWORD_SETUP.md`.
6. If auth-session recovery/logging behavior changes, update `authSession.ts` + `DEPLOY_WEB.md` notes together and verify web console-noise filters only suppress known non-actionable messages.

## Auth redirect debugging checklist

When verification/reset links do not route as expected in production:

1. Confirm `signUp(... options.emailRedirectTo)` and reset redirect values are built from `src/services/supabase.ts` (`AUTH_CALLBACK`, `AUTH_RESET`).
2. Confirm origin allowlist logic in `src/services/webAuth.ts` accepts the active domain (including preview wildcards when used).
3. Confirm `App.tsx` auth bootstrap still checks current web URL for auth params, not only `/auth/*` paths.
4. Confirm Supabase URL Configuration includes every deployed callback/reset URL variant.
5. Confirm `vercel.json` keeps `/auth/callback` and `/auth/reset` uncacheable and SPA-rewritten.
6. If you see `Invalid Refresh Token: Refresh Token Not Found` on landing, treat it as a stale-client-session signal first: verify session artifact cleanup and re-test in a fresh browser profile before escalating.


## Email verification redirect guarantees

- After successful email/password signup, store pending signup verification context (email + timestamp).
- During callback handling, if `linkType` is missing/unknown but callback session email matches pending signup context, treat it as verification completion and force redirect to Login (signed-out).
- Clear pending verification context after verification completion and after successful login to avoid stale cross-flow effects.
- Keep this guard scoped to signup verification only; do not broaden to generic callback flows without explicit review.

## Verified email flow (current behavior)

### Account-state behavior

- `signInWithEmailPassword` is the single gate for email/password login success.
- If Supabase returns `email not confirmed` (or equivalent), app routes to `VerifyEmail`.
- If Supabase returns a session but `email_confirmed_at` is still missing, app signs out immediately and routes to `VerifyEmail` (defense-in-depth for inconsistent provider responses).
- Verified users clear pending signup verification state on login success.

### Resend + link-validity rules

- Signup sends one verification email via Supabase Auth `signUp`.
- Verify screen **does not auto-resend** on mount (prevents accidental duplicate sends and unnecessary rate-limit hits).
- Resend is user-initiated and backed by edge function `resend-verification-email`.
- Rate limits:
  - cooldown window: 60 seconds (`RATE_LIMITED`)
  - valid-link window: 1 hour (`LINK_STILL_VALID`) to favor existing-link usage over duplicate email generation
- UI behavior:
  - on `LINK_STILL_VALID`: show guidance that existing link remains valid and to check inbox/spam
  - on `RATE_LIMITED`: show wait message + cooldown timer
  - on resend success: show confirmation + inbox/spam guidance

### User-facing messaging standards

- Signup context messaging: “verification email already sent, usually valid for ~1 hour”.
- Login-unverified/recovery context messaging: “login blocked until verification; use latest inbox link first”.
- Every resend state avoids sensitive internal detail and keeps user action-oriented guidance:
  1. Check inbox
  2. Check Spam/Promotions
  3. Wait for cooldown/validity window before retry

### Prevention notes for future auth changes

- Do not re-introduce automatic resend on `VerifyEmail` mount without explicit abuse/rate-limit review.
- Keep login verification checks centralized in `authEmailPassword.ts`; avoid duplicating verification logic in screen files.
- If link-validity or cooldown durations change, update all three together in one PR:
  1. edge function constants
  2. verify screen helper behavior
  3. user-facing strings/documentation
