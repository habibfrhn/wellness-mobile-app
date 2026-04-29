# Authentication Architecture (Mobile + Web)

## Source of truth
- Supabase session state is the single source of truth.
- `App.tsx` subscribes to `supabase.auth.onAuthStateChange` and owns the app-level `session` state.
- Cold-start restoration uses `restoreSession()` with refresh-on-expiry semantics.
- OAuth/deep-link callbacks are processed before session restoration; callback-created sessions are prioritized to avoid startup overwrite races.

## Core flows
1. **Email/password login**
   - Login screens run `ensureAuthSessionIsHealthy()` preflight to clean stale/corrupt local auth artifacts before `signInWithPassword`.
   - Unverified users are redirected to verification flow and signed out defensively.
2. **Google OAuth**
   - OAuth start is centralized in `authOAuth.ts`.
   - Callback handling is centralized in `authLinks.ts` and supports code exchange, token-based session set, and OTP verification links.
3. **Password reset / recovery**
   - Recovery links map to `/auth/reset` and force `ResetPassword` start route.
4. **Logout / deletion cleanup**
   - `signOutToLogin()` performs remote + local signout and storage artifact cleanup across web/native.

## Configuration requirements
- Required env vars:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Supabase redirect URLs must include callback and reset URLs for each environment (localhost, production domains, Expo route variants).
- Web origins must be allowed in `webAuth.ts` origin validation.

## Diagnostics
- Auth logging is event-based via `authDebug.ts` and `logoutDebug.ts`.
- Logs include event names, high-level state flags, user id where needed, and safe metadata.
- Tokens, passwords, refresh tokens, and OAuth secrets must never be logged.

## Troubleshooting checklist
- Confirm env vars are present in current runtime.
- Confirm Supabase Auth redirect URLs and Google provider callback settings exactly match deployed origins.
- Validate `/auth/callback` and `/auth/reset` deep links open app and process once.
- If login intermittently fails after long idle periods, verify preflight `email_password_login_preflight` and restoration events in logs.
