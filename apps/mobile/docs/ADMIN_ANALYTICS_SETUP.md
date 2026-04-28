# Admin Analytics Setup (Remote Supabase)

This guide documents the current setup for the web admin dashboard at `/admin`.

## Current implementation model

- Auth users are in `auth.users`.
- Admin authorization is mapped in `public.admin_users(user_id uuid primary key)`.
- Access is backend-enforced through `public.is_admin()` and admin RPCs.
- Client analytics are ingested through edge function `track-analytics-event`.
- Dashboard reads these RPCs:
  - `admin_analytics_product_actions(range_key)`
  - `admin_analytics_audio_engagement(range_key)`
  - `admin_analytics_tailored_sessions(range_key)`

## 1) Apply migrations to target Supabase project

From repo root (CLI linked to target project):

```bash
supabase migration list
supabase db push
```

If migration drift is reported, resolve it first and rerun.

## 2) Deploy analytics ingestion function

```bash
supabase functions deploy track-analytics-event --no-verify-jwt
supabase functions list
```

## 3) Verify function secrets

In Supabase project/function secrets, verify:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- Optional: `CORS_ALLOWED_ORIGINS`

Without these, analytics ingestion fails or is partially blocked.

## 4) Create/verify admin auth user

Create (or verify) an auth user in Supabase Auth, e.g. `admin@yourdomain.com`.

## 5) Map auth user to `admin_users`

Run in SQL editor:

```sql
insert into public.admin_users (user_id)
select id
from auth.users
where email = 'admin@yourdomain.com'
on conflict (user_id) do nothing;
```

Verification query:

```sql
select
  u.email,
  u.id as auth_user_id,
  exists(select 1 from public.admin_users au where au.user_id = u.id) as is_admin
from auth.users u
where u.email = 'admin@yourdomain.com';
```

## 6) Verify admin RPC access

Log in as mapped admin and validate:

```sql
select public.is_admin();
select * from public.admin_analytics_product_actions('30d');
select * from public.admin_analytics_audio_engagement('30d') limit 20;
select * from public.admin_analytics_tailored_sessions('30d');
```

## 7) Validate `/admin` UI

Run web app:

```bash
pnpm -C apps/mobile web
```

Expected behavior:

- Admin user: dashboard renders.
- Non-admin user: unauthorized state.

## 8) Generate and verify sample events

In non-admin session, perform landing/auth/audio/tailored-session actions, then run:

```sql
select event_name, count(*)
from public.analytics_events
group by event_name
order by count(*) desc, event_name asc;
```

## Troubleshooting

- `relation "public.admin_users" does not exist` → migrations not applied to selected project.
- Admin login works but `/admin` unauthorized → missing `admin_users` mapping.
- Admin authorized but dashboard empty → no qualifying events yet or ingestion function/secrets not configured.
