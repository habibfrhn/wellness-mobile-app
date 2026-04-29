# Test Coverage Roadmap (Auth/Admin/Critical Paths)

This document tracks the production-readiness test plan requested for the web target of `apps/mobile`.

## Current automated coverage (implemented)
- Service-level auth/session/token behavior (`authSession.test.ts`)
- Google OAuth start/failure behavior (`authOAuth.test.ts`)
- Auth provider + verification helpers (`authProviders.test.ts`)
- Delete-account critical path behavior (`deleteAccount.test.ts`)
- Admin analytics authorization + normalization behavior (`adminAnalytics.test.ts`)
- Web auth origin/path helpers (`webAuth.test.ts`)

## Remaining required coverage

### 1) UI integration tests (highest priority)
- Sign up/login/logout screen flows
- Forgot/reset/change password screen flows
- Delete-account screen flow (modal, confirmation input, success/failure states)
- Protected-route rendering:
  - unauthenticated
  - authenticated
  - unauthorized (admin denied)
  - expired session requiring recovery

### 2) Admin + RBAC integration coverage
- Admin login flow
- `/admin` route guard behavior
- Non-admin denied behavior and messaging
- Admin critical actions success/failure states

### 3) OAuth callback completion coverage
- Auth callback URL handling (`handleAuthLink`) after provider redirect
- Missing/invalid callback payload handling
- Recovery/reset-link callback path behavior

### 4) E2E coverage (web target)
- Highest-risk journeys:
  1. Email sign up -> verify email gate -> login
  2. Forgot password -> reset password -> re-login
  3. Google OAuth login -> verified session landing
  4. Admin login -> admin dashboard access guard
  5. Delete account -> sign out + blocked re-entry behavior

### 5) Broader critical app flows
- Onboarding/profile/settings/notification critical paths
- API timeout/error/unauthorized handling across key services
- Regression tests for previously fixed critical bugs

## CI commands
Run in authenticated package-registry environment:

```bash
pnpm install
pnpm -C apps/mobile exec vitest --version
pnpm -C apps/mobile test
```

## Environment note
This container currently cannot fetch `vitest` from npm (`ERR_PNPM_FETCH_403`), so local execution here is blocked until registry auth is available.
