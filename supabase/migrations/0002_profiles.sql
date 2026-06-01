-- TalentRank — 0002 — Profiles
-- ---------------------------------------------------------------------------
-- 1:1 with auth.users. A profile carries the public-facing identity (handle,
-- display name, country, avatar gradient). Specialised data lives in `talents`
-- or `studios`. Splitting like this keeps queries cheap and lets us add new
-- role types (e.g. 'agent') without bloating the base table.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null,

  -- Unique handle used in URLs. citext = case-insensitive comparison.
  -- Regex enforces: a-z, 0-9, dashes; must start & end with alphanumeric.
  username citext unique not null check (
    char_length(username) between 3 and 32
    and username ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$'
    and username !~ '--'
  ),
  display_name text not null check (char_length(display_name) between 1 and 80),
  country_code char(2) not null default 'XX',
  city text,
  bio text,

  -- Stylised avatar (per art-direction: no photo). Tailwind gradient classes.
  avatar_gradient text not null default 'from-cyan-400 via-cyan-600 to-indigo-900',
  avatar_initials text not null default 'TR' check (char_length(avatar_initials) between 1 and 4),

  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

comment on table public.profiles is
  'Base identity row, one per auth user. Extended by `talents` or `studios`.';
comment on column public.profiles.username is
  'Case-insensitive unique handle used in profile URLs (/talent/{username}).';

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_country_idx on public.profiles (country_code);
create index if not exists profiles_last_seen_idx on public.profiles (last_seen_at desc);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
