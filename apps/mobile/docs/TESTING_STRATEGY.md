# Web Regression Testing Strategy (Auth + Admin)

This project now uses **Vitest** for deterministic CI-friendly regression tests of critical web production flows.

## Goals
- Catch regressions in auth/session handling before deploy.
- Protect admin authorization/data-refresh behavior.
- Keep tests fast, isolated, and explicit about broken behavior.

## Commands
- `pnpm test` — run all regression tests once.
- `pnpm test:watch` — run tests in watch mode for local TDD.

## Coverage focus
Current automated suite (`test/auth-and-admin-regression.test.ts`) covers:

### Auth flows
- Google OAuth initiation (signup/login entry path).
- Callback code exchange success/failure (expired/invalid link surface).
- Access token + refresh token callback handling.
- Session restore behavior.
- Session refresh near expiry.
- Expired refresh token fallback (local session clear path).
- Delete-account flow with token validation + post-delete sign-out.
- Delete-account error mapping (including rate limit class).

### Admin flows
- Unauthorized error detection (`admin access required`, `42501`, etc.).
- Admin analytics response normalization to stable numeric output.

## Test design principles
- Mock Supabase Auth, RPC, and Edge Function calls; never call external providers in unit tests.
- Keep assertions behavior-driven and explicit.
- Prefer service-level regression tests for auth/admin logic where failures are high impact.
- Failures should identify the exact contract that changed.

## CI guidance
Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` in CI for each PR to enforce regression gates on auth/admin behavior.
