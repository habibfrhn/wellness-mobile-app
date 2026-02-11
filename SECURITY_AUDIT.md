# Security Audit (Repository + Git History)

Date: 2026-02-11

## Scope
- Verify no real `.env` files were committed.
- Verify no exposed API keys in current files.
- Verify no leaked Supabase anon/service/public keys in current files or git history.

## Commands used
- `git ls-files | rg -n '(^|/)\.env($|\.|/)|(^|/)\.envrc$|(^|/)\.direnv/'`
- `git log --all --name-only --pretty=format: | rg -n '(^|/)\.env($|\.|/)|(^|/)\.envrc$|(^|/)\.direnv/'`
- `rg -n --hidden --glob '!.git' --glob '!pnpm-lock.yaml' --glob '!**/*.svg' "(AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z\-_]{35}|xox[baprs]-[0-9A-Za-z-]{10,}|ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{20,}|sk_live_[0-9a-zA-Z]{20,}|SUPABASE_(ANON|SERVICE_ROLE|SECRET|API)_KEY\\s*=\\s*['\\\"]?[A-Za-z0-9\\-_=\\.]{20,}|eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\\.[A-Za-z0-9_-]{20,}\\.[A-Za-z0-9_-]{20,})"`
- `git rev-list --all | xargs -I{} git grep -n -I -E "(AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z\-_]{35}|xox[baprs]-[0-9A-Za-z-]{10,}|ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{20,}|sk_live_[0-9a-zA-Z]{20,}|SUPABASE_ANON_KEY\\s*=\\s*['\\\"][A-Za-z0-9\\-_=\\.]{20,}|SUPABASE_SERVICE_ROLE_KEY\\s*=\\s*['\\\"][A-Za-z0-9\\-_=\\.]{20,}|EXPO_PUBLIC_SUPABASE_ANON_KEY\\s*=\\s*['\\\"][A-Za-z0-9\\-_=\\.]{20,}|eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\\.[A-Za-z0-9_-]{20,}\\.[A-Za-z0-9_-]{20,})" {} -- . 2>/dev/null`

## Findings
- Tracked env-like files: none.
- Env-like files in full git history: `.env.example` was present historically.
- No high-risk API key patterns detected in current files.
- No high-risk API key patterns detected across all commits.
- One non-secret env variable usage exists in source code (`process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY`), but no literal key value is committed.

## Conclusion
No committed `.env` secrets or exposed Supabase anon/service/public key values were found in repository history based on this scan set.
