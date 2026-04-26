# Reset Password Setup & Validation

Current setup for reset-password flow in `apps/mobile` (local + preview + production web).

## 1) Required app env vars

In `apps/mobile/.env` (local) and Vercel env vars (Preview + Production):

```bash
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
EXPO_PUBLIC_WEB_ORIGIN=http://localhost:8081
EXPO_PUBLIC_WEB_ALLOWED_ORIGINS=http://localhost:8081,https://lumepo.com,https://www.lumepo.com
```

## 2) Supabase Auth URL configuration

In **Supabase Dashboard → Authentication → URL Configuration**:

- Set **Site URL** to canonical production origin.
- Add Redirect URLs for all allowed origins with both paths:
  - `/auth/callback`
  - `/auth/reset`

Example URLs:

- `http://localhost:8081/auth/callback`
- `http://localhost:8081/auth/reset`
- `https://lumepo.com/auth/callback`
- `https://lumepo.com/auth/reset`
- `https://www.lumepo.com/auth/callback`
- `https://www.lumepo.com/auth/reset`

## 3) Local verification

From repo root:

```bash
pnpm install
pnpm -C apps/mobile web
```

Then verify:

1. Open `/lupa-kata-sandi`.
2. Submit registered email.
3. Open reset link from email.
4. Confirm app resolves to reset flow (`/auth/reset`, `/#/auth/reset`, or `/--/auth/reset`).
5. Submit new password.
6. Confirm login succeeds with new password.

## 4) Failure patterns

- Link opens but reset flow fails: usually missing/mismatched Supabase Redirect URLs.
- Callback/reset rejected: usually `EXPO_PUBLIC_WEB_ALLOWED_ORIGINS` missing origin.
- Works in Preview but not Production: Production env vars are missing or different.

## 5) Notes

- Repeated reset requests may return rate limiting (`429`).
- Reset flow behavior is handled in app auth link parsing/session exchange; no dedicated migration is required just for reset flow.
