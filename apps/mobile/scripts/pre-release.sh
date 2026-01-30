#!/usr/bin/env bash

set -euo pipefail

bold() {
  printf "\033[1m%s\033[0m\n" "$1"
}

status_ok() {
  printf "✅ %s\n" "$1"
}

status_warn() {
  printf "⚠️  %s\n" "$1"
}

status_fail() {
  printf "❌ %s\n" "$1"
}

check_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    status_fail "Missing ${name} in environment."
    return 1
  fi

  status_ok "${name} is set."
}

bold "Running automated pre-release checks"

bold "1) Code quality"
pnpm lint
status_ok "Lint passed."
pnpm typecheck
status_ok "Typecheck passed."

bold "2) Required environment variables (local)"
env_missing=0
check_env "EXPO_PUBLIC_SUPABASE_URL" || env_missing=1
check_env "EXPO_PUBLIC_SUPABASE_ANON_KEY" || env_missing=1

if [[ "${env_missing}" -eq 1 ]]; then
  status_warn "Set missing env vars locally or verify in EAS build profiles."
fi

bold "3) Manual QA checklist (run before submission)"
cat <<'EOF'
- Build sanity
  - pnpm -C apps/mobile start -c
  - Android preview build installs and opens without Metro
  - No red screens on cold start
- Auth
  - Sign up -> Verify Email -> link opens app -> logged in
  - Log out works
  - Delete account works (user removed from Supabase Auth)
- Audio playback
  - No autoplay on any screen
  - Play/Pause works
  - Seek bar works
  - Resume progress works (leave Player -> return -> continues)
  - Progress clears when finished
- UI/UX
  - Home scroll works (no cropped content)
  - Android nav bar not overlaying content (safe area / padding ok)
  - Strings all Indonesian (no “Play tonight”, etc.)
- EAS env (preview/prod)
  - EXPO_PUBLIC_SUPABASE_URL present in preview/prod
  - EXPO_PUBLIC_SUPABASE_ANON_KEY present in preview/prod
EOF

if [[ "${env_missing}" -eq 1 ]]; then
  status_warn "Pre-release checks completed with warnings."
else
  status_ok "Pre-release checks completed."
fi
