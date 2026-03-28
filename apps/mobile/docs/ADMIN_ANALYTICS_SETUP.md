# Admin Analytics Setup (Path B: No Docker Desktop)

Use this guide when you want to finish the MVP admin analytics feature using a **remote Supabase project** only.

---

## 1) Push the migration without Docker

Run from repo root:

```bash
supabase migration list
supabase migration repair --status reverted 20260324110000 20260324142000
supabase db push
```

Notes:
- `supabase db pull` is intentionally skipped in this path because it requires Docker.
- If `migration list` shows different missing version IDs, use those IDs in `migration repair`.

---

## 2) Create (or confirm) your admin user in Auth

Use your app signup flow (or Supabase dashboard Auth UI) to ensure the admin account exists.

Example admin email:
- `admin@yourdomain.com`

---

## 3) Grant admin access

Open Supabase SQL Editor and run:

```sql
insert into public.admin_users (user_id)
select id
from auth.users
where email = 'admin@yourdomain.com'
on conflict (user_id) do nothing;
```

---

## 4) Verify admin authorization logic

Still in SQL Editor, confirm the user is present:

```sql
select au.user_id, u.email
from public.admin_users au
join auth.users u on u.id = au.user_id
order by u.email;
```

---

## 5) Open the admin panel

Run web app:

```bash
pnpm -C apps/mobile web
```

Visit:
- `http://localhost:8081/admin` (or your Expo web port)

Login with the admin account from Step 2.

Expected:
- Admin user sees dashboard cards/tables.
- Non-admin user gets unauthorized state.

---

## 6) Validate event ingestion quickly

In a normal browser session, perform:
1. Open landing page.
2. Click login/signup CTA.
3. Complete signup (for a new user) or login.
4. Play an audio track; let one complete; abandon another.
5. Run one tailored session and exit early once.

Then run in SQL Editor:

```sql
select event_name, count(*) as total
from public.analytics_events
group by event_name
order by total desc, event_name asc;
```

You should see event rows for:
- `landing_page_view`
- `landing_cta_click`
- `signup_start`
- `signup_complete`
- `audio_play`
- `audio_complete` / `audio_abandon`
- `tailored_session_start`
- `tailored_session_complete` / `tailored_session_dropoff`

---

## 7) Validate dashboard views directly

Run:

```sql
select * from public.analytics_funnel_summary;
select * from public.analytics_audio_summary order by play_count desc limit 20;
select * from public.analytics_tailored_summary;
```

If these return rows, the `/admin` screen should render meaningful metrics for admin users.
