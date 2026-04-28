# Testing Guide (TDD-ready)

This project uses Node.js built-in **`node:test`** runner with TypeScript strip-types execution (`node --test --experimental-strip-types`).

## Goals

- Catch regressions in critical auth/navigation/account/analytics/session flows early.
- Keep tests deterministic with isolated pure-service logic.
- Keep tests fast enough for local development and CI gating.

## Current automated coverage focus

Tests live in `apps/mobile/tests/*.test.ts` and currently cover:

- `authSecurityCore` — password validation and auth/reset error mapping
- `authProviders` — provider normalization, password-management eligibility, verification rules
- `webAuthCore` — web origin allowlisting, redirect origin selection, auth path normalization
- `adminAnalyticsCore` — unauthorized detection, RPC result normalization/filtering
- `nightStreakCore` — streak date-key generation and hero-state derivation logic

## Commands

From repo root:

```bash
pnpm test
pnpm test:ci
```

From `apps/mobile` directly:

```bash
pnpm test
pnpm test:watch
pnpm test:ci
```

`test:ci` also emits coverage via `--experimental-test-coverage`.

## TDD workflow (recommended)

1. Add/adjust a failing test for the bug or behavior change.
2. Implement minimal code change to make the test pass.
3. Run local tests quickly with `pnpm test`.
4. Run full pre-merge quality gate:

```bash
pnpm lint
pnpm typecheck
pnpm test:ci
```

## Current scope limitations

- Current suite is service-layer focused and does not yet include UI/screen integration tests.
- External services (Supabase Auth/OAuth/network) are covered via logic-layer normalization tests, not live integration tests.
