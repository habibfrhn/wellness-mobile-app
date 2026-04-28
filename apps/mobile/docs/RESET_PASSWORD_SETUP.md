# Reset Password Setup & Validation

This guide covers the current reset-password flow for `apps/mobile` on web.

## 1) Supabase Auth URL configuration (required)

In **Supabase Dashboard → Authentication → URL Configuration**:

1. Set **Site URL** to your canonical app origin.
   - Local example: `http://localhost:8081`
   - Production example: `https://lumepo.com`
2. Add redirect URLs for callback + reset on every allowed origin:
   - `http://localhost:8081/auth/callback`
   - `http://localhost:8081/auth/reset`
   - `https://lumepo.com/auth/callback`
   - `https://lumepo.com/auth/reset`
   - `https://www.lumepo.com/auth/callback`
   - `https://www.lumepo.com/auth/reset`

If misconfigured, users can open email links but fail session exchange/reset handoff.

## 2) App environment variables (required)

Create/update `apps/mobile/.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
EXPO_PUBLIC_WEB_ORIGIN=http://localhost:8081
EXPO_PUBLIC_WEB_ALLOWED_ORIGINS=http://localhost:8081,https://lumepo.com,https://www.lumepo.com
```

## 3) Local runtime steps

From repo root:

```bash
pnpm install
pnpm -C apps/mobile web
```

Use the actual host/port printed by Expo if it differs from `localhost:8081`.

## 4) End-to-end validation checklist

1. Open **Lupa kata sandi** (`/lupa-kata-sandi`).
2. Submit an existing email.
3. Confirm generic success feedback appears.
4. Open reset email and click the link.
5. Confirm app resolves into `/auth/reset` (or Expo-prefixed equivalent).
6. Submit new password on **Atur ulang kata sandi** screen.
7. Confirm success and return to login.
8. Re-open the used link.
9. Confirm app displays invalid/expired guidance and prompts a new request.

## 5) Operational notes

- Supabase may return `429` on repeated reset requests.
- Expo web variants (`/auth/reset`, `/#/auth/reset`, `/--/auth/reset`) are normalized by auth-link handling.
- This flow does not require additional SQL migrations.
