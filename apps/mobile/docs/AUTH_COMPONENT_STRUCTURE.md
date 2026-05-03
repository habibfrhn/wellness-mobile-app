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
- `ALREADY_VERIFIED` is currently inferred from provider resend error messages in the Edge Function mapping layer; keep this mapping list maintained and tested after Supabase/Auth provider updates.
- Maintenance rule: when editing auth screen CTAs, rename handler functions to reflect user intent (`goToLogin`, `onResend`, etc.) so future diffs stay readable and reduce semantic drift.


### Temporary debugging log points (verification resend)
- Debug tracing points are emitted only through `logAuthDebugEvent` and are visible when `EXPO_PUBLIC_AUTH_DEBUG=1` (disabled in normal production builds):
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
- Do not add raw `console.*` calls for verify resend flow; use `logAuthDebugEvent` so diagnostics are environment-gated and safe by default.


## Maintainability audit update (May 1, 2026)

Findings from review of the latest resend changes:
- **Lean state is preserved**: verification screen keeps a small UI state surface (`busy`, `cooldownSeconds`, helper text, helper tone) and avoids duplicate decision state.
- **No dead code found in resend path**: client decision handling is centralized in `attemptResend` + `authResend.ts` typed result mapping.
- **Important nuance**: `ALREADY_VERIFIED` is provider-message mapped (not a pre-check query). This is simpler operationally, but brittle if upstream error text changes.

Decisions:
1. Keep provider-message mapping approach for now (lower complexity, no extra admin lookup call in hot path).
2. Treat unknown edge-function codes as actionable helper + alert (never silent failure).
3. Keep temporary debug logging in place only while diagnosing resend issues; remove or gate logs once production behavior is stable.

Prevention notes:
- When modifying resend logic, update all three layers together: `VerifyEmailScreen.tsx`, `authResend.ts`, and `resend-verification-email` Edge Function.
- If provider error text changes, update `isAlreadyVerified` / `isLinkStillValid` mapping phrases and re-run end-to-end verification scenarios.
- Documentation must reflect actual implementation details (e.g., mapped-provider detection vs server-side pre-check) to avoid misleading future changes.


## Production logging cleanup (May 1, 2026)

- Verification resend debug output is now gated by `EXPO_PUBLIC_AUTH_DEBUG=1` via `src/services/authDebug.ts`.
- Direct `console.info` / `console.warn` tracing was removed from verify resend screen/service to avoid noisy production consoles.
- Keep only safe metadata in debug payloads (event codes, cooldown seconds, masked email label).
- If additional diagnostics are needed, add them through `logAuthDebugEvent` only.


## Login + forgot-password account-existence behavior (May 1, 2026)

- **Login**: Supabase password sign-in does not safely expose whether the email is unregistered vs wrong password in this client flow.
  - Invalid credentials use a single privacy-preserving helper message and do not disclose whether the account exists or the password is wrong.
  - Do not add account-enumeration helper branches without explicit security review.
- **Forgot password**: flow is privacy-preserving and does not reveal whether an email is registered.
  - Success-style helper copy explicitly states conditional delivery: if the email is registered, reset link is sent.
  - Rate limit, operational/network, and invalid-email states provide distinct user guidance.

### Security and UX decisions
- Do not add client-side account existence checks for forgot-password responses.
- Avoid misleading unconditional success wording; use conditional copy that explains privacy intent.
- Keep helper feedback inline and consistent across success/error states.

### Prevention notes
- If backend policy changes to support trusted account-existence checks, update docs and copy together before changing UI behavior.
- Keep `authSecurity.ts` message classifiers aligned with any provider error message changes.


## Auth helper-message policy (May 3, 2026)

- Login, signup, and forgot-password flows should return one clear inline helper per failure state.
- Prefer field-specific helpers for blank/invalid input before calling backend APIs.
- Signup should not silently redirect when email already exists; show explicit next-step helper (Masuk / Lupa kata sandi).
- Forgot-password uses privacy-preserving behavior by default and does not disclose account existence from helper messages.
- Avoid vague retry-only copy; always include immediate user action (fix input, check inbox/spam, go to login, or use forgot-password).

### Maintenance guidance
- Keep provider message classifiers in `authSecurity.ts` synchronized with provider message changes.
- When changing helper copy, update `strings.ts` and this document in the same PR.


## Auth maintainability audit (May 3, 2026)

- Removed brittle login helper heuristic that inferred account state from password length.
- Login helper behavior now uses a single invalid-credential helper for privacy and consistency.
- Kept fallback path for unknown auth responses (`errorInvalidCredentials` / generic auth fallback) so UI remains deterministic when provider messages change.

### Maintenance notes
- Treat provider-message parsing as best-effort only; always retain a safe fallback message branch.
- If Supabase error text changes, update classifiers in `authSecurity.ts` and verify login/forgot-password helpers together.
- Avoid deriving account-state messages from unrelated client-side heuristics (length checks, local assumptions, etc.).


## Forgot-password rate-limit architecture (May 3, 2026)

- Forgot-password now separates concerns into two focused layers:
  - `src/services/authSecurity.ts` classifies auth failures (including strict rate-limit detection from status/code markers).
  - `src/services/requestPasswordReset.ts` owns server-response mapping + fallback behavior.
- Rate-limit detection uses stable indicators (`status=429`, `over_email_send_rate_limit`, `over_request_rate_limit`) before message fallback, reducing false positives from generic phrases.
- Cooldown enforcement is server/provider-side; forgot-password screen no longer runs a local countdown timer.
- Privacy behavior remains unchanged: forgot-password helper copy does not reveal whether an email is registered.

### Edge cases
- Switching to a different email loads that email's cooldown state (if any) instead of reusing stale state from previous input.
- Unknown provider errors in fallback path are treated as operational failures to avoid false-positive "email sent" feedback.
- Client does not block repeated clicks with timer state; abuse prevention remains server/provider enforced.

### Maintenance guidance
- Keep forgot-password request result handling centralized in `requestPasswordResetEmail`; avoid rebuilding timer/cooldown gates in the screen layer.
- When Supabase error payload semantics change, update `isRateLimitedAuthError` and re-test forgot-password + signup paths together.


## Unified auth-email rate-limit architecture (May 3, 2026)

- Verification resend and forgot-password now both use server-enforced Edge Functions with structured result codes.
  - `supabase/functions/resend-verification-email/index.ts`
  - `supabase/functions/request-password-reset-email/index.ts`
- Client cooldowns remain UX-only and are not treated as abuse controls.
- Primary server decision code contract:
  - `RATE_LIMITED` -> 429 with `retryAfterSec`
  - `LINK_STILL_VALID` (verification resend only) -> 409
  - `ALREADY_VERIFIED` (verification resend only) -> 409
  - `RESET_REQUEST_ACCEPTED` (forgot-password success) -> 200
  - `RESET_REQUEST_FAILED` (forgot-password operational/provider failure) -> 200, non-disclosing error state for client
- Both flows now share the same anti-abuse principle: normalized email + request IP hash bucketed per 60-second window via RPC-backed counters.
- Supabase/Brevo throttling is treated as provider-level enforcement and is mapped to `RATE_LIMITED` without brittle client parsing.

### SMTP operations checklist

- Supabase Auth must be configured with custom SMTP credentials for Brevo in the hosted project settings.
- Confirm SPF, DKIM, and sender domain verification in Brevo before production sends.
- Use Supabase Auth email logs + Brevo transactional logs together for delivery troubleshooting.
- If Brevo blocks traffic by source IP, allow Supabase outbound sender infrastructure per Brevo policy; do not hardcode app-server IP assumptions.


### Forgot-password reliability guardrail

- `requestPasswordResetEmail` now uses a two-stage send strategy:
  1. Edge Function path (`request-password-reset-email`) for server-enforced cooldown and structured codes.
  2. Direct Supabase reset fallback when edge invocation fails without structured code (keeps forgot-password usable during partial deploy/outage states).
- Keep fallback privacy-safe: do not expose account-existence signals from provider responses.
- When modifying this flow, verify both stages with manual tests (edge healthy + edge unavailable).


### Audit findings (May 3, 2026)

- Removed unused `channel` metadata from forgot-password service result to keep response contracts minimal and avoid unused-state drift in UI callers.
- Kept fallback responsibility isolated in `requestPasswordResetEmail` so screen logic stays focused on helper UX + cooldown rendering only.
- Preserved deterministic structured-code handling (`RATE_LIMITED`, `RESET_REQUEST_FAILED`) while treating unknown fallback errors as operational failures for feedback accuracy.


### Forgot-password validation + helper contract (May 3, 2026)

- Submit button is intentionally clickable for guided validation UX; validation feedback happens on press.
- Validation order is strict and explicit:
  1. empty email -> `helperEmptyEmail`
  2. invalid email format -> `helperInvalidEmail`
  3. valid email -> send request
- Unknown fallback/provider transport errors are treated as operational failures (not forced success) to avoid false-positive delivery feedback.
- Keep helper copy in `strings.ts` synchronized with this contract when updating UX text.

- Removed unused cooldown timer state from `ForgotPasswordScreen` because submit is intentionally clickable and server/provider limits are authoritative.
