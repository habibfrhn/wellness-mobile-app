# Reset Password Setup & Validation

This guide covers the **current** reset-password flow for `apps/mobile` across local, preview, and production web environments.

## 1) Supabase Auth URL configuration (required)

In **Supabase Dashboard → Authentication → URL Configuration**:

1. Set **Site URL** to canonical app origin.
   - Local: `http://localhost:8081`
   - Production: `https://lumepo.com`
2. Add redirect URLs for callback + reset on every allowed web origin:
   - `http://localhost:8081/auth/callback`
   - `http://localhost:8081/auth/reset`
   - `https://lumepo.com/auth/callback`
   - `https://lumepo.com/auth/reset`
   - `https://www.lumepo.com/auth/callback`
   - `https://www.lumepo.com/auth/reset`
   - `https://*.vercel.app/auth/callback`
   - `https://*.vercel.app/auth/reset`

If these are missing/mismatched, users may open the email link but fail session exchange.

## 2) App environment variables (required)

Create/update `apps/mobile/.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
EXPO_PUBLIC_WEB_ORIGIN=http://localhost:8081
EXPO_PUBLIC_WEB_ALLOWED_ORIGINS=http://localhost:8081,https://lumepo.com,https://www.lumepo.com,https://*.vercel.app
```

## 3) Local runtime steps

From repo root:

```bash
pnpm install
pnpm -C apps/mobile web
```

Use the actual host/port printed by Expo if it differs from `localhost:8081`.

## 4) End-to-end verification checklist

1. Open **Lupa kata sandi** (`/lupa-kata-sandi`).
2. Submit an existing email.
3. Confirm generic success feedback appears.
4. Open email and click reset link.
5. Confirm app resolves into reset flow (`/auth/reset` or Expo-prefixed equivalent).
6. Submit new password on **Atur ulang kata sandi** screen.
7. Confirm success and return to login.
8. Re-open used link.
9. Confirm app shows invalid/expired guidance and asks user to request a new link.

## 5) Operational notes

- Supabase can return throttling responses (`status=429`, `over_email_send_rate_limit`, `over_request_rate_limit`) for repeated reset requests; UI maps these into a predictable 60s resend cooldown per normalized email.
- Expo web path variants (`/auth/reset`, `/#/auth/reset`, `/--/auth/reset`) are handled by auth link normalization logic.
- This reset flow requires the `request-password-reset-email` Edge Function to be deployed and healthy; direct fallback is only a resilience path, not the primary architecture.

- Non-throttled successful requests apply a 15s local cooldown to prevent accidental rapid repeats while maintaining reliable delivery behavior for verified accounts.


## 6) Server-enforced reset email flow

- Client requests forgot-password emails through `request-password-reset-email` Edge Function, not direct provider calls.
- Edge Function enforces server-side cooldown and returns structured codes (`RATE_LIMITED`, `RESET_REQUEST_ACCEPTED`, `RESET_REQUEST_FAILED`).
- UI cooldown remains advisory for user feedback and button pacing only.


## 7) Fallback + error behavior (May 3, 2026)

- Primary path: client invokes `request-password-reset-email` Edge Function.
- If Edge invocation is unavailable (deploy gap, temporary function outage, or non-structured transport error), client falls back to direct `supabase.auth.resetPasswordForEmail` to preserve reset availability.
- `RATE_LIMITED` remains strict and deterministic in both paths.
- Privacy behavior is preserved: unknown provider responses do not reveal account existence.
- User-facing helper mapping:
  - rate-limited -> explicit wait guidance
  - operational SMTP/network failures -> operational error helper
  - successful/unknown privacy-safe provider responses -> generic success helper
