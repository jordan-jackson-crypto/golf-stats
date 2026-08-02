-- Golf Stats — game_sessions table (practice points-games)
-- Run this once in: Supabase Dashboard → SQL Editor → New query → Run
-- Only needed if you want practice game scores to sync to the cloud.
-- (The app works fine locally without it.)

create table if not exists public.game_sessions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists game_sessions_user_id_updated_at_idx
  on public.game_sessions (user_id, updated_at desc);

alter table public.game_sessions enable row level security;

drop policy if exists "game_sessions owner all" on public.game_sessions;
create policy "game_sessions owner all" on public.game_sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
