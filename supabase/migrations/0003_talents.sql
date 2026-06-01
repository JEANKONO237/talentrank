-- TalentRank — 0003 — Talents
-- ---------------------------------------------------------------------------
-- The creative profile. One row per profile with role='talent'. Arrays (text[])
-- for specialties/software/languages keep filtering fast without M:N joins.
-- The avatar uses the profile's gradient; per art-direction we don't store
-- avatar uploads.

create table if not exists public.talents (
  id uuid primary key references public.profiles(id) on delete cascade,

  -- Discipline (the primary creative role)
  discipline discipline_id not null,
  tagline text check (tagline is null or char_length(tagline) <= 140),

  -- Experience
  years_experience int not null default 0 check (years_experience between 0 and 60),

  -- Availability & contract
  availability availability_status not null default 'open',
  availability_note text,
  work_mode work_mode not null default 'remote',
  contract_type contract_type not null default 'any',
  hired_until date, -- set when availability='hired' via confirmed hiring

  -- External links (showreel is the most important — feeds into score)
  showreel_url text,
  website_url text,
  artstation_url text,
  vimeo_url text,
  youtube_url text,
  linkedin_url text,

  -- Free-form tag arrays. Indexed via GIN below.
  specialties text[] not null default '{}',
  software text[] not null default '{}',
  languages text[] not null default '{}',

  -- Visibility control
  is_hidden boolean not null default false,

  -- Counters maintained by triggers (cheap reads for dashboards)
  profile_views int not null default 0,
  recruiter_views int not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.talents.is_hidden is
  'Soft hide. When true, the talent is excluded from public_talents view and rankings.';
comment on column public.talents.hired_until is
  'Set automatically when a hiring is confirmed. Profile remains accessible but ranked out.';

create index if not exists talents_discipline_idx on public.talents (discipline);
create index if not exists talents_availability_idx on public.talents (availability);
create index if not exists talents_software_gin on public.talents using gin (software);
create index if not exists talents_languages_gin on public.talents using gin (languages);
create index if not exists talents_specialties_gin on public.talents using gin (specialties);

drop trigger if exists talents_updated_at on public.talents;
create trigger talents_updated_at
  before update on public.talents
  for each row execute function public.set_updated_at();
