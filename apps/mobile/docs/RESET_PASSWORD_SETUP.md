# Reset Password Setup & Validation Guide

This guide documents the required setup so the reset-password flow works in local, preview, and production environments for `apps/mobile`.

## 1) Required Supabase dashboard configuration

1. Open **Supabase Dashboard → Authentication → URL Configuration**.
2. Set **Site URL** to your primary web app URL.
   - Local: `http://localhost:8081`
   - Production example: `https://app.your-domain.com`
3. Add every reset/callback URL variant to **Redirect URLs**:
   - `http://localhost:8081/auth/reset`
   - `http://localhost:8081/auth/callback`
   - `https://app.your-domain.com/auth/reset`
   - `https://app.your-domain.com/auth/callback`
4. Save changes.

> If redirect URLs are missing or mismatched, reset links may open but fail to establish a valid session.

## 2) Required environment variables (`apps/mobile`)

Create/update `apps/mobile/.env` for local Expo web:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
EXPO_PUBLIC_WEB_ORIGIN=http://localhost:8081
EXPO_PUBLIC_WEB_ALLOWED_ORIGINS=http://localhost:8081,https://app.your-domain.com
```

For deployed environments, set the same vars in your platform (for example Vercel / EAS environment settings), with production-safe values.

## 3) CLI / local runtime steps

From repository root:

```bash
pnpm install
pnpm --filter mobile start --web
```

Open the shown local URL (usually `http://localhost:8081`).

## 4) End-to-end verification checklist

Use a test user with email/password auth enabled:

1. Go to **Lupa kata sandi** (`ForgotPassword`).
2. Submit a valid email using **Kirim Email Reset**.
3. Confirm success message appears (generic, non-enumerating).
4. Open the email and click the reset link.
5. Confirm app lands in reset flow (`/auth/reset`) and opens **Atur ulang kata sandi** screen.
6. Enter a valid new password and submit.
7. Confirm success message appears and user is returned to login.
8. Attempt reusing the same link.
9. Confirm user sees invalid/used/expired guidance and is sent back to request a new link.

## 5) Operational notes

- Supabase can return `429` when reset emails are requested too frequently. The app now surfaces a rate-limit message and enforces a short client cooldown to reduce repeated calls.
- Expo web can use `/#/` or `/--/` style paths during development. Reset/callback path handling must accept those variants to avoid false invalid-link states.
