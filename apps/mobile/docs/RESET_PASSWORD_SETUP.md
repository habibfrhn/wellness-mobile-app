# Reset Password Setup & Validation

This guide covers the current reset-password flow for `apps/mobile` across local, preview, and production web environments.

## 1) Supabase Auth URL configuration (required)

In **Supabase Dashboard → Authentication → URL Configuration**:

1. Set **Site URL** to canonical app origin.
   - Local: `http://localhost:8081`
   - Production: `https://lumepo.com`
2. Add redirect URLs for callback + reset on every allowed origin.

Minimum set:

- `http://localhost:8081/auth/callback`
- `http://localhost:8081/auth/reset`
- `https://lumepo.com/auth/callback`
- `https://lumepo.com/auth/reset`
- `https://www.lumepo.com/auth/callback`
- `https://www.lumepo.com/auth/reset`

If URLs are missing/mismatched, reset links can open but fail session exchange.

## 2) App environment variables (required)

Create/update `apps/mobile/.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
EXPO_PUBLIC_WEB_ORIGIN=http://localhost:8081
EXPO_PUBLIC_WEB_ALLOWED_ORIGINS=http://localhost:8081,https://<preview-domain>.vercel.app,https://lumepo.com,https://www.lumepo.com
```

## 3) Local runtime steps

From repo root:

```bash
pnpm install
pnpm -C apps/mobile web
```

Use the actual host/port printed by Expo if different.

## 4) End-to-end verification checklist

1. Open **Lupa kata sandi** (`/lupa-kata-sandi`).
2. Submit an existing email.
3. Confirm generic success feedback appears.
4. Open the email and click reset link.
5. Confirm app resolves reset flow (`/auth/reset` or Expo-prefixed equivalent).
6. Submit new password on **Atur ulang kata sandi** screen.
7. Confirm success and return to login.
8. Re-open the used link.
9. Confirm app shows invalid/expired guidance and asks for a new link.

## 5) Operational notes

- Supabase may return `429` for repeated reset requests; UI includes cooldown feedback.
- Expo web path variants (`/auth/reset`, `/#/auth/reset`, `/--/auth/reset`) are normalized by auth link handling.
- This flow does not require SQL migrations.
