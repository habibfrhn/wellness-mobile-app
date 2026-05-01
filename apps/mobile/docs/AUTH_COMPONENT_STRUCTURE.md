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

## Email verification UX + resend rules (May 1, 2026)

### Screen copy and CTA behavior (`src/screens/Auth/VerifyEmailScreen.tsx`)
- Primary guidance is concise and in Bahasa Indonesia: users are told to click the email verification link, then return and press **Masuk**.
- CTA set is intentionally minimal:
  - **Masuk** uses primary button styling and routes to Login with prefilled email.
  - **Kirim ulang link verifikasi** uses secondary/outline styling (wording uses `link`, not `tautan`).
- “Buka aplikasi email” and “Kembali ke masuk” are removed to avoid redundant actions and reduce cognitive load.

### Resend behavior and account-state handling
- Helper message is hidden by default and only appears after user taps **Kirim ulang link verifikasi**.
- Resend endpoint (`supabase/functions/resend-verification-email`) enforces two protections:
  1. short cooldown bucket (anti-spam/abuse), and
  2. verification-link validity window bucket.
- If current verification link is still valid, client does **not** send a new link and shows an error helper (red): “Link verifikasi masih valid. Cek email atau folder Spam, lalu gunakan link yang sudah dikirim.”
- If the previous link is no longer valid, client requests a new verification link and shows a success helper (green): “Link verifikasi berhasil dikirim.”
- If the account is already verified, client does **not** send a new link and shows an error helper (red): “Akun sudah terverifikasi. Silakan lanjut ke Masuk.”
- Fallback helper for unknown resend errors should remain actionable (not generic retry-only), guiding users to check email/Spam/Promosi first and return to **Masuk** after verification.

### Validation and consistency notes
- Keep unverified-account gating in `src/services/authEmailPassword.ts` and route unverified sign-ins to Verify Email screen.
- Keep resend decision codes stable across edge function + client mapping (`RATE_LIMITED`, `LINK_STILL_VALID`) to avoid UX regressions.
- Keep language consistent: use **link** across this verification flow.

### Prevention notes for future auth changes
- Do not auto-trigger resend on screen mount; this can produce noisy sends and premature helper text.
- Any change to resend cooldown/window semantics must update both:
  - `supabase/functions/resend-verification-email/index.ts`, and
  - `src/services/authResend.ts` + `src/i18n/strings.ts` helper copy.
- If you alter verification callback routing, re-verify pending-signup redirect guarantees in this document’s “Email verification redirect guarantees” section.


## Post-change audit notes (May 1, 2026)

- Removed dead verification copy keys that were no longer rendered by `VerifyEmailScreen` to keep `strings.ts` aligned with live UI usage.
- Kept resend state minimal (`resendHelperText` + tone) and retained existing backend-driven decision codes (`RATE_LIMITED`, `LINK_STILL_VALID`) to avoid duplicated client-side validity logic.
- Confirmed no mount-time resend side effect remains, preventing accidental sends and unnecessary load on auth/email infrastructure.
- Added explicit server-side already-verified guard (`ALREADY_VERIFIED`) so resend behavior stays deterministic and does not depend on provider message parsing alone.
- Maintenance rule: when editing auth screen CTAs, rename handler functions to reflect user intent (`goToLogin`, `onResend`, etc.) so future diffs stay readable and reduce semantic drift.


### Temporary debugging log points (verification resend)
- Browser console tracing points (safe/no full email):
  - `button_click`
  - `handler_start`
  - `request_start`
  - `account_state_result`
  - `resend_decision`
  - `success_response`
  - `response_error` / `handler_error`
- Known failure points to verify first:
  1. CORS mismatch or blocked origin in Edge Function.
  2. Invalid/missing auth redirect config.
  3. Edge Function returns non-mapped error code (falls back to generic helper + alert).
- Prevention: keep client decision handling aligned with edge codes (`RATE_LIMITED`, `LINK_STILL_VALID`, `ALREADY_VERIFIED`).
- Do not reintroduce vague fallback copy; unknown resend failures must still provide immediate next-step guidance before suggesting retry.
