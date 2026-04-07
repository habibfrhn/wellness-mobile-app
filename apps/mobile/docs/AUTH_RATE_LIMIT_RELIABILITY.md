# Auth & Rate-Limit Reliability (MVP)

## Why this matters
Supabase's built-in email sender is intended for development/low-volume testing. For production reliability, use **custom SMTP** and verify auth/rate-limit settings in Dashboard.

## Current audit findings (April 7, 2026)
1. Auth resend UX had a 30s client cooldown; backend already enforces 60s (`auth.email.max_frequency = "60s"`).
2. Delete-account edge functions were duplicated and had fail-open behavior when the rate-limit RPC failed.
3. Night-session recording was mostly idempotent (upsert), but retries could still consume rate-limit budget before short-circuiting.
4. 429 observability existed in scattered logs but not in a consistent structured format across edge functions.
5. Existing signup/sign-in IP limits (`sign_in_sign_ups = 30` per 5 minutes per IP) are currently reasonable for MVP and are unchanged.

## Required Supabase Dashboard actions (manual)

### 1) Custom SMTP (required for production)
Dashboard path: **Authentication → Providers → Email**

- Enable **Custom SMTP**.
- Configure SMTP host/port/user/password from your transactional provider (Postmark, SendGrid, Resend SMTP, SES SMTP, etc.).
- Set sender email/domain and ensure SPF, DKIM, and DMARC are correctly configured.
- Send and verify test messages for:
  - signup confirmation
  - password reset
  - email change

> Keep built-in sender disabled for production traffic.

### 2) CAPTCHA / Turnstile for abuse control
Dashboard path: **Authentication → Security (CAPTCHA)**

- Enable CAPTCHA provider (recommended: **Cloudflare Turnstile**).
- Add site key + secret in Supabase Dashboard.
- Ensure client integration is turned on for signup / password-reset surfaces.
- Verify fallback UX does not block legitimate users when CAPTCHA provider is degraded.

### 3) Auth rate limits
Dashboard path: **Authentication → Rate Limits**

Keep current sign-in/signup IP limit unchanged unless abuse patterns demand otherwise:
- `sign_in_sign_ups`: **30 / 5 minutes / IP** (unchanged)

Validate these settings are explicit and monitored:
- email send limits (confirmation/reset)
- token verification limits
- token refresh limits

## Operational monitoring expectations
- Track all 429s from edge functions using structured logs (`event=rate_limit_429`).
- Alert when 429s exceed normal baseline for:
  - `track-analytics-event`
  - `record-night-session`
  - `delete-account-v2`

## MVP guardrails
- Analytics rate-limit failures must remain non-blocking for user UX.
- Deletion rate limiting should fail closed for safety and observability (no silent bypass).
- Keep auth limits conservative and only relax with evidence from logs and support incidents.
