-- Golf Stats — keepalive table
-- Run once in: Supabase Dashboard → SQL Editor → New query → Run
--
-- A tiny public table the scheduled GitHub Action queries every few days to
-- generate database activity, so the free-tier project's 7-day inactivity
-- pause timer never expires.

create table if not exists public.keepalive (
  id int primary key,
  last_ping timestamptz not null default now()
);

insert into public.keepalive (id) values (1)
  on conflict (id) do nothing;

alter table public.keepalive enable row level security;

-- Allow anyone (anon key) to read this single non-sensitive row.
drop policy if exists "keepalive public read" on public.keepalive;
create policy "keepalive public read" on public.keepalive
  for select
  using (true);
