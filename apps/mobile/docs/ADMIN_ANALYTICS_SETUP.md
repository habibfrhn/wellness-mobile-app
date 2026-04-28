# Admin Analytics Setup (Remote Supabase)

This guide documents the current setup for the web admin dashboard at `/admin`.

## Current architecture

- Auth users live in `auth.users`.
- Admin mapping uses `public.admin_users(user_id uuid primary key)`.
- Access is backend-enforced by `public.is_admin()` and guarded analytics RPCs.
- Client analytics are ingested through edge function `track-analytics-event`.
- Dashboard reads:
  - `admin_analytics_product_actions(range_key)`
  - `admin_analytics_audio_engagement(range_key)`
  - `admin_analytics_tailored_sessions(range_key)`

## 1) Push SQL migrations

From repo root:

```bash
supabase migration list
supabase db push
```

If drift is reported, repair migration history before pushing.

## 2) Deploy analytics ingestion function

```bash
supabase functions deploy track-analytics-event --no-verify-jwt
supabase functions list
```

Set required function secrets/config in Supabase:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CORS_ALLOWED_ORIGINS`

## 3) Ensure an admin user exists

Create or verify an auth user, for example `admin@yourdomain.com`.

## 4) Map user into `admin_users`

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

## 5) Validate RPC access as admin

```sql
select public.is_admin();
select * from public.admin_analytics_product_actions('30d');
select * from public.admin_analytics_audio_engagement('30d') limit 20;
select * from public.admin_analytics_tailored_sessions('30d');
```

## 6) Validate `/admin` UI behavior

Run web app locally:

```bash
pnpm -C apps/mobile web
```

Open `http://localhost:8081/admin`.

Expected:

- Admin user: dashboard panels render.
- Non-admin user: unauthorized state.

## 7) Generate and verify test events

In a non-admin session:

1. Visit landing page.
2. Start auth flow.
3. Complete signup/login.
4. Play at least one audio and complete/abandon another.
5. Run a tailored session.

Then verify event population:

```sql
select event_name, count(*)
from public.analytics_events
group by event_name
order by count(*) desc, event_name asc;
```

## Troubleshooting

- `relation "public.admin_users" does not exist` → migrations were not pushed to target project.
- `/admin` unauthorized for intended admin user → mapping missing in `public.admin_users`.
- Admin dashboard empty with valid admin → `track-analytics-event` not deployed, misconfigured secrets, or no qualifying events yet.
