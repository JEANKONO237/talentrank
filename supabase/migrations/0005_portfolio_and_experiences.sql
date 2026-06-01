-- TalentRank — 0005 — Portfolio items & Experiences
-- ---------------------------------------------------------------------------
-- A talent's body of work. Portfolio items reference Supabase Storage paths
-- for uploaded files OR external URLs for embedded video (YouTube/Vimeo).
-- The `position` column is the user-controlled order; a partial unique index
-- enforces "at most one cover per talent".

create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references public.talents(id) on delete cascade,

  kind text not null check (kind in ('image', 'video')),
  title text not null check (char_length(title) between 1 and 120),
  subtitle text,
  description text,

  -- Source: either a Storage path (uploaded) OR an external embed URL.
  -- Exactly one should be set, but we don't hard-enforce so users can move
  -- between the two without invalid intermediate states.
  storage_path text,
  external_url text,
  thumbnail_path text, -- generated server-side (sprint 3)

  ratio text not null default '16/9' check (ratio in ('16/9', '4/5', '1/1', '9/16', '21/9')),

  -- Visual gradient used as placeholder while assets load. Optional override.
  gradient text,

  position int not null default 0,
  is_featured boolean not null default false,
  is_cover boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.portfolio_items.is_cover is
  'The single hero piece displayed on the talent card. Enforced by partial unique index.';

create index if not exists portfolio_items_talent_order_idx
  on public.portfolio_items (talent_id, position);
create index if not exists portfolio_items_featured_idx
  on public.portfolio_items (talent_id) where is_featured;
create unique index if not exists portfolio_items_one_cover
  on public.portfolio_items (talent_id) where is_cover;

drop trigger if exists portfolio_items_updated_at on public.portfolio_items;
create trigger portfolio_items_updated_at
  before update on public.portfolio_items
  for each row execute function public.set_updated_at();

-- ─── Experiences ──────────────────────────────────────────────────────────
-- Career history. If `studio_id` is set, the studio can verify the entry
-- (which then weighs into the talent score via prestige_weight).

create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references public.talents(id) on delete cascade,

  studio_name text not null,
  studio_id uuid references public.studios(id) on delete set null,

  role text not null,
  period text not null, -- human-readable "2022 – Present"
  start_year int check (start_year is null or start_year between 1950 and extract(year from now())::int + 1),
  end_year int check (end_year is null or end_year between 1950 and extract(year from now())::int + 1),
  detail text,

  position int not null default 0,
  is_verified boolean not null default false,
  verified_by uuid references public.studios(id),
  verified_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists experiences_talent_order_idx
  on public.experiences (talent_id, position);
create index if not exists experiences_studio_idx
  on public.experiences (studio_id);

drop trigger if exists experiences_updated_at on public.experiences;
create trigger experiences_updated_at
  before update on public.experiences
  for each row execute function public.set_updated_at();
