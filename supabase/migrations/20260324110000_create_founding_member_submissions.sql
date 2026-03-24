create table if not exists public.founding_member_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  name text not null,
  email text not null,
  sleep_issue text not null,
  sleep_frequency text not null check (sleep_frequency in ('hampir_setiap_malam', 'beberapa_kali_seminggu', 'kadang_kadang')),
  joining_reason text not null,
  feedback_willingness text not null check (feedback_willingness in ('ya', 'mungkin', 'tidak')),
  interview_willingness text not null check (interview_willingness in ('ya', 'mungkin', 'tidak')),
  payment_willingness text not null check (payment_willingness in ('ya', 'mungkin', 'tidak')),
  preferred_monthly_price text not null check (preferred_monthly_price in ('29000', '49000', '79000', '99000_plus')),
  consent_to_contact boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists founding_member_submissions_created_at_idx
  on public.founding_member_submissions (created_at desc);

create index if not exists founding_member_submissions_user_id_idx
  on public.founding_member_submissions (user_id);

alter table public.founding_member_submissions enable row level security;

create policy "founding_member_submissions_insert_authenticated"
on public.founding_member_submissions for insert
to authenticated
with check (true);

create policy "founding_member_submissions_select_own"
on public.founding_member_submissions for select
to authenticated
using (auth.uid() = user_id);
