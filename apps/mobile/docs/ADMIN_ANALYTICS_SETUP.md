# Admin Analytics Setup (Remote Supabase)

This guide documents the **current** setup path for the web admin dashboard (`/admin`) using a remote Supabase project.

## Current architecture

- User identities live in `auth.users`.
- Admin authorization is mapped in `public.admin_users(user_id uuid primary key)`.
- Admin data access is server-enforced with `public.is_admin()` and guarded RPCs.
- Client analytics events are ingested through `track-analytics-event` edge function.
- Dashboard currently reads:
  - `admin_analytics_product_actions(range_key)`
  - `admin_analytics_audio_engagement(range_key)`

## 1) Push SQL migrations

From repo root (linked to target Supabase project):

```bash
supabase migration list
supabase db push
```

If `migration list` reports remote/local drift, repair as needed then run `supabase db push` again.

## 2) Deploy analytics ingestion function

```bash
supabase functions deploy track-analytics-event --no-verify-jwt
supabase functions list
```

`track-analytics-event` must be deployed; otherwise dashboard metrics will remain empty because client no longer writes directly to tables.

## 3) Ensure an admin auth user exists

Create or verify an email/password user in Supabase Auth (`auth.users`), for example:

- `admin@yourdomain.com`

## 4) Map user to `admin_users`

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

## 5) Verify dashboard RPCs are callable for admin

Log in as admin user on web, then validate manually in SQL editor if needed:

```sql
select public.is_admin();
select * from public.admin_analytics_product_actions('30d');
select * from public.admin_analytics_audio_engagement('30d') limit 20;
```

## 6) Validate `/admin` UI

Run local web app:

```bash
pnpm -C apps/mobile web
```

Open one of:

- `http://localhost:8081/admin`

Expected behavior:

- Admin user: dashboard cards/tables render.
- Non-admin user: unauthorized state.

## 7) Generate test events

In a non-admin session:

1. Visit landing page.
2. Start auth flow.
3. Complete signup/login.
4. Play at least one audio and complete/abandon another.

Then verify data exists:

```sql
select event_name, count(*)
from public.analytics_events
group by event_name
order by count(*) desc, event_name asc;
```

## Troubleshooting

- `relation "public.admin_users" does not exist` → migrations not pushed to selected project.
- Admin login works but `/admin` unauthorized → user not mapped in `admin_users`.
- Dashboard empty but admin authorized → `track-analytics-event` not deployed or no qualifying events yet.
