# Admin Analytics Setup (Remote Supabase)

This guide documents the current setup for the web admin dashboard (`/admin`) against a remote Supabase project.

## Current architecture

- User identities live in `auth.users`.
- Admin mapping is `public.admin_users(user_id uuid primary key)`.
- Admin access is server-enforced via `public.is_admin()` + guarded RPCs.
- Client events are ingested through edge function `track-analytics-event`.
- Dashboard reads:
  - `admin_analytics_product_actions(range_key)`
  - `admin_analytics_audio_engagement(range_key)`
  - `admin_analytics_tailored_sessions(range_key)`

## 1) Link and push migrations

From repo root:

```bash
supabase link --project-ref <project-ref>
supabase migration list
supabase db push
```

If `migration list` reports local/remote drift, repair history and run `supabase db push` again.

## 2) Configure function secrets

Ensure remote Supabase secrets include:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CORS_ALLOWED_ORIGINS` (comma-separated allowlist for browser origins)

## 3) Deploy analytics ingestion function

```bash
supabase functions deploy track-analytics-event --no-verify-jwt
supabase functions list
```

If `track-analytics-event` is not deployed, dashboard metrics stay empty because clients no longer write directly to analytics tables.

## 4) Ensure an admin auth user exists

Create or verify an email/password user in Supabase Auth (`auth.users`) — e.g. `admin@yourdomain.com`.

## 5) Map user to `admin_users`

Run in Supabase SQL editor:

```sql
insert into public.admin_users (user_id)
select id
from auth.users
where email = 'admin@yourdomain.com'
on conflict (user_id) do nothing;
```

Quick verification:

```sql
select
  u.email,
  u.id as auth_user_id,
  exists(select 1 from public.admin_users au where au.user_id = u.id) as is_admin
from auth.users u
where u.email = 'admin@yourdomain.com';
```

## 6) Verify RPC access as admin

```sql
select public.is_admin();
select * from public.admin_analytics_product_actions('30d');
select * from public.admin_analytics_audio_engagement('30d') limit 20;
select * from public.admin_analytics_tailored_sessions('30d');
```

## 7) Validate `/admin` UI

```bash
pnpm -C apps/mobile web
```

Open `http://localhost:8081/admin`.

Expected:

- Admin user: dashboard loads cards/tables.
- Non-admin user: unauthorized state.

## 8) Generate test events

In a non-admin session:

1. Open landing page.
2. Start auth flow.
3. Complete signup/login.
4. Play at least one audio and complete/abandon another.
5. Run a tailored session.

Then verify data exists:

```sql
select event_name, count(*)
from public.analytics_events
group by event_name
order by count(*) desc, event_name asc;
```

## Troubleshooting

- `relation "public.admin_users" does not exist` → migrations not pushed to selected project.
- Admin login works but `/admin` is unauthorized → user not in `admin_users`.
- Dashboard empty but admin authorized → function not deployed, function secrets missing, or no qualifying events yet.
