# Reset Password Setup & Validation

This guide documents the current reset-password behavior for `apps/mobile` web.

## 1) Configure Supabase Auth URL settings

In **Supabase Dashboard → Authentication → URL Configuration**:

1. Set **Site URL** to your canonical web origin.
2. Add redirect URLs for callback + reset on every allowed origin.

Example set:

- `http://localhost:8081/auth/callback`
- `http://localhost:8081/auth/reset`
- `https://lumepo.com/auth/callback`
- `https://lumepo.com/auth/reset`
- `https://www.lumepo.com/auth/callback`
- `https://www.lumepo.com/auth/reset`

If these are missing or mismatched, reset links may fail session exchange.

## 2) Configure app env vars

Create/update `apps/mobile/.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
EXPO_PUBLIC_WEB_ORIGIN=http://localhost:8081
EXPO_PUBLIC_WEB_ALLOWED_ORIGINS=http://localhost:8081,https://lumepo.com,https://www.lumepo.com
```

## 3) Run local web app

From repo root:

```bash
pnpm install
pnpm -C apps/mobile web
```

Use the exact host/port Expo prints if it differs from `localhost:8081`.

## 4) Understand route behavior (important)

- Intake routes handled by auth link logic: `/auth/reset` and `/--/auth/reset`.
- User-facing reset screen route in app navigation: `/atur-ulang-kata-sandi`.

This is expected: auth links are consumed via `/auth/reset`, then app navigation moves to the localized screen route.

## 5) End-to-end test checklist

1. Open `/lupa-kata-sandi`.
2. Submit an existing account email.
3. Confirm generic success feedback.
4. Open reset email and click the link.
5. Confirm app receives link via `/auth/reset` (or Expo-prefixed equivalent).
6. Confirm reset screen opens (`/atur-ulang-kata-sandi`).
7. Submit a new password.
8. Confirm success and login capability with new password.
9. Re-open the same reset link and confirm invalid/expired guidance.

## 6) Operational notes

- Repeated reset requests can return `429`; app UI handles this with rate-limit messaging.
- No migration or edge-function deployment is required solely for reset-flow behavior.
