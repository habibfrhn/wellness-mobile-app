# Test Strategy (Web + Auth/Admin Quality Gate)

## Automated test matrix (current)

### Auth provider/linking regression (unit)
- `tests/authProviders.test.mjs`
  - Provider normalization + ordering
  - Linked account behavior (`email` + `google`)
  - OAuth-only verification behavior
  - Password-management eligibility

## CI quality gate
- Workflow: `.github/workflows/quality-gate.yml`
- Required commands:
  - `pnpm test`
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm build:web`

## Local run
From repo root:
```bash
pnpm test
pnpm lint
pnpm typecheck
pnpm build:web
```

## Remaining prioritized gaps
1. Service tests for auth error-classification, reset-link handling, session restoration/refresh/logout, and delete-account flows.
2. Screen-level auth integration tests (`LoginScreen`, `SignUpScreen`, `ForgotPasswordScreen`, `ResetPasswordScreen`, `VerifyEmailScreen`) for loading/disabled/double-submit/navigation behavior.
3. OAuth callback/deep-link integration tests across `authLinks.ts`, `webAuth.ts`, `authOAuth.ts`.
4. Delete-account edge function contract tests (`supabase/functions/delete-account-v2/index.ts`) across invalid token/user-not-found/admin-delete failure branches.
5. Admin dashboard sync tests for post-action refresh + stale optimistic UI rollback.
6. Coverage threshold enforcement for auth/session/admin modules once a dedicated test runner with built-in coverage is introduced.
