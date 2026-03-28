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

Important:
- Inserting into `public.admin_users` only grants **admin authorization**.
- It does **not** create/reset a password.
- Login password is managed by Supabase Auth (`auth.users`) for that email.

If login says `Invalid login credentials`, do one of these:
1. Create/sign up that exact email first (if account does not exist), or
2. Reset password for that email via your app's **Forgot Password** flow, or
3. In Supabase Dashboard → Authentication → Users, send a password reset / magic link.
4. If the user was created with provider type **Social** (for example Google), use **Lanjutkan dengan Google** on admin login instead of password.

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

If you get:
- `ERROR: 42P01: relation "public.admin_users" does not exist`

it means the admin analytics migration has not been applied to the currently selected database/project yet.

Use this quick diagnosis in SQL Editor:

```sql
select to_regclass('public.admin_users') as admin_users_table;
```

Expected:
- returns `public.admin_users` (table exists)
- `null` means migration is missing on this environment

Then rerun from your CLI in the same linked project:

```bash
supabase migration list
supabase db push
```

Also confirm SQL Editor is pointed at the same project/environment where you pushed.

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
- If your local server does not rewrite unknown paths (you see a 404), use:
  - `http://localhost:8081/?admin=1`
  - or `http://localhost:8081/#/admin`

Important:
- Use the **exact host/port printed by Expo** in your terminal.
- If Expo starts on another port (for example `19006`), replace `8081` in the URLs.
- If you are on LAN mode, open the LAN URL shown by Expo.

Login with the admin account from Step 2.

Expected:
- Admin user sees dashboard cards/tables.
- Non-admin user gets unauthorized state.

If the panel loads but says unauthorized:

```sql
select public.is_admin() as is_admin_for_current_session;
```

If that returns `false`, the logged-in user is not present in `public.admin_users` yet.

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
