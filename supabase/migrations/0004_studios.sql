-- TalentRank — 0004 — Studios & Verification
-- ---------------------------------------------------------------------------
-- Studios are organisations. A studio profile is a profile + a studios row +
-- one or more members (studio_members). A studio can request verification;
-- once approved by an admin, `is_verified` is set and a "Verified" badge
-- appears on the studio page.

create table if not exists public.studios (
  id uuid primary key references public.profiles(id) on delete cascade,

  legal_name text,
  website_url text,
  description text,
  industry text,
  size_range text check (size_range is null or size_range in ('1-10', '11-50', '51-200', '201-1000', '1000+')),
  founded_year int check (founded_year is null or founded_year between 1900 and extract(year from now())::int + 1),
  hq_country_code char(2),

  -- Verification — set by admin after reviewing a request
  is_verified boolean not null default false,
  verified_at timestamptz,
  verified_by uuid references public.profiles(id),

  -- Used by the score function to weight verified work history.
  -- 1.0 = baseline, 2.0 = AAA studios, 3.0 = ILM/Pixar tier.
  prestige_weight numeric(3,2) not null default 1.0 check (prestige_weight between 0.1 and 5.0),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Members of a studio (anyone working in the studio org)
create table if not exists public.studio_members (
  studio_id uuid not null references public.studios(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'recruiter' check (role in ('owner', 'recruiter', 'member')),
  added_at timestamptz not null default now(),
  added_by uuid references public.profiles(id),
  primary key (studio_id, user_id)
);

create index if not exists studio_members_user_idx on public.studio_members (user_id);

-- Verification requests (one per studio at a time, audit log of submissions)
create table if not exists public.studio_verification_requests (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  submitted_by uuid not null references public.profiles(id) on delete cascade,
  evidence_url text,
  notes text,
  status verification_status not null default 'pending',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now()
);

create index if not exists studio_verifications_studio_idx
  on public.studio_verification_requests (studio_id, created_at desc);

drop trigger if exists studios_updated_at on public.studios;
create trigger studios_updated_at
  before update on public.studios
  for each row execute function public.set_updated_at();

-- Helper: is the current user a member of this studio (any role)?
create or replace function public.is_studio_member(p_studio_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.studio_members
    where studio_id = p_studio_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_studio_owner(p_studio_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.studio_members
    where studio_id = p_studio_id and user_id = auth.uid() and role = 'owner'
  );
$$;
