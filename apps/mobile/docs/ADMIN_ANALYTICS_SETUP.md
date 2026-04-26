# Admin Analytics Setup

Setup guide for web admin analytics (`/admin`) using Supabase.

## 1) Apply backend schema

From repo root (linked to target Supabase project):

```bash
supabase migration list
supabase db push
```

## 2) Deploy analytics ingestion function

```bash
supabase functions deploy track-analytics-event --no-verify-jwt
supabase functions list
```

## 3) Ensure admin user exists

Create/verify a user in Supabase Auth (`auth.users`), then map that user in `public.admin_users`:

```sql
insert into public.admin_users (user_id)
select id
from auth.users
where email = 'admin@yourdomain.com'
on conflict (user_id) do nothing;
```

Verify mapping:

```sql
select
  u.email,
  u.id as auth_user_id,
  exists(select 1 from public.admin_users au where au.user_id = u.id) as is_admin
from auth.users u
where u.email = 'admin@yourdomain.com';
```

## 4) Validate RPC access

As admin session:

```sql
select public.is_admin();
select * from public.admin_analytics_product_actions('30d');
select * from public.admin_analytics_audio_engagement('30d') limit 20;
select * from public.admin_analytics_tailored_sessions('30d');
```

## 5) Validate UI behavior

Run web app locally:

```bash
pnpm -C apps/mobile web
```

- Admin user should see dashboard data.
- Non-admin user should see unauthorized state.
- Auth callback/login should succeed first (verify `/masuk` and `/auth/callback` work on the same deployed origin).

## 6) Troubleshooting

- `admin_users` missing: migrations not applied to that project.
- Admin user unauthorized: missing `admin_users` mapping.
- Empty metrics: function not deployed yet or no qualifying events ingested.
