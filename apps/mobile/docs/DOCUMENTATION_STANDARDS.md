# Documentation Standards (Best Practices)

Use this checklist whenever code or config changes affect product behavior, setup, security, or operations.

## 1) Single source of truth rules

- Keep **root `README.md`** as the canonical onboarding entrypoint.
- Keep **`apps/mobile/DEPLOY_WEB.md`** as the canonical web deployment runbook.
- Keep **`SECURITY_AUDIT.md`** as the canonical security posture + manual responsibility baseline.
- Keep feature-specific setup docs in `apps/mobile/docs/*` and link them from `README.md`.

## 2) Change-triggered documentation updates

Update docs in the same PR when any of the following change:

- route names/paths in `apps/mobile/App.tsx`
- environment variables in `apps/mobile/src/services/*` or edge functions
- Supabase RPC names / SQL policies / admin access model
- Edge Function secrets, auth requirements, CORS behavior, or deployment commands
- release/build scripts (`package.json`, `apps/mobile/package.json`, `apps/mobile/scripts/*`)

## 3) Accuracy checks before merge

From repo root, run:

```bash
rg --files -g '*.md'
rg -n "EXPO_PUBLIC_|SUPABASE_|CORS_ALLOWED_ORIGINS|admin_analytics_|is_admin\(|/auth/(callback|reset)" README.md SECURITY_AUDIT.md apps/mobile/DEPLOY_WEB.md apps/mobile/docs
pnpm lint
pnpm typecheck
```

## 4) Writing quality rules

- Prefer concrete paths and commands over prose-only instructions.
- Avoid speculative language; document only behavior observable in current code.
- Remove stale alternatives when one path is canonical.
- Keep checklists short and executable.
- Add date stamps only where audit timing matters (for example in `SECURITY_AUDIT.md`).

## 5) Operational risk controls

- Keep web origins synchronized across:
  - `EXPO_PUBLIC_WEB_ORIGIN`
  - `EXPO_PUBLIC_WEB_ALLOWED_ORIGINS`
  - Supabase Auth URL configuration
  - Supabase function secret `CORS_ALLOWED_ORIGINS`
- Treat docs drift as a release risk: block release if critical setup docs are outdated.
