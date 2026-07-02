-- Golf Stats — Supabase schema
-- Paste this into: Supabase Dashboard → SQL Editor → New query → Run
--
-- Design: single-user cloud mirror of local IndexedDB. Data is stored as JSONB
-- blobs so the client can evolve its shape freely without migrations. All
-- analytics happen client-side.

-- --- Rounds -----------------------------------------------------------------
create table if not exists public.rounds (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists rounds_user_id_updated_at_idx
  on public.rounds (user_id, updated_at desc);

alter table public.rounds enable row level security;

drop policy if exists "rounds owner all" on public.rounds;
create policy "rounds owner all" on public.rounds
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- --- Shots ------------------------------------------------------------------
create table if not exists public.shots (
  id uuid primary key,
  round_id uuid not null references public.rounds(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists shots_round_id_idx on public.shots (round_id);
create index if not exists shots_user_id_updated_at_idx
  on public.shots (user_id, updated_at desc);

alter table public.shots enable row level security;

drop policy if exists "shots owner all" on public.shots;
create policy "shots owner all" on public.shots
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- --- Courses ----------------------------------------------------------------
create table if not exists public.courses (
  name text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (user_id, name)
);

alter table public.courses enable row level security;

drop policy if exists "courses owner all" on public.courses;
create policy "courses owner all" on public.courses
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
