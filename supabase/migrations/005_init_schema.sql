-- 005_init_schema.sql
-- Initial Supabase schema for Aetheria Chronicles (public lore tables + private world tables)

create extension if not exists "pgcrypto";

-- 4.1 locations (public read)
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  x numeric not null,
  y numeric not null,
  description text,
  lore text,
  image_url text,
  status text not null,
  created_at timestamptz not null default now()
);

alter table public.locations enable row level security;
create policy "Public read locations"
  on public.locations
  for select
  using (true);

-- 4.2 characters (public read)
create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text,
  faction text,
  description text,
  lore text,
  image_url text,
  stories jsonb,
  current_location_id uuid not null references public.locations(id),
  home_location_id uuid references public.locations(id),
  discovery_stage text not null,
  bio text,
  rp_prompt text,
  attributes jsonb,
  created_at timestamptz not null default now()
);

alter table public.characters enable row level security;
create policy "Public read characters"
  on public.characters
  for select
  using (true);

-- 4.3 timeline_events (public read)
create table if not exists public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date_label text,
  summary text,
  status text not null,
  created_at timestamptz not null default now()
);

alter table public.timeline_events enable row level security;
create policy "Public read timeline events"
  on public.timeline_events
  for select
  using (true);

-- 4.4 world_state (private singleton)
create table if not exists public.world_state (
  id text primary key default 'global',
  summary text,
  memory jsonb,
  updated_at timestamptz,
  source text
);

alter table public.world_state enable row level security;

-- 4.5 world_events (private append-only)
create table if not exists public.world_events (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  payload jsonb not null,
  source text not null,
  confidence numeric,
  approved boolean default false,
  created_at timestamptz not null default now(),
  applied_at timestamptz
);

alter table public.world_events enable row level security;

