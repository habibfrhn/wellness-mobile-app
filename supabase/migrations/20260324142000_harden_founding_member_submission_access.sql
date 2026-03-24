alter table public.founding_member_submissions enable row level security;

drop policy if exists "founding_member_submissions_insert_authenticated" on public.founding_member_submissions;

create policy "founding_member_submissions_insert_own"
on public.founding_member_submissions for insert
to authenticated
with check (auth.uid() = user_id);

-- keep select scope restricted to caller-owned rows only.
drop policy if exists "founding_member_submissions_select_own" on public.founding_member_submissions;
create policy "founding_member_submissions_select_own"
on public.founding_member_submissions for select
to authenticated
using (auth.uid() = user_id);
