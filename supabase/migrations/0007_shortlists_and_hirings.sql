-- TalentRank — 0007 — Shortlists & Hirings
-- ---------------------------------------------------------------------------
-- Shortlists are studio-private collections of talents (organised around a
-- brief). Hirings are the formal "this studio hired this talent" record —
-- studios initiate them, talents confirm. Once confirmed, the talent's
-- availability flips to 'hired' (via trigger in 0010), which removes them
-- from rankings and explore until the mission ends.

create table if not exists public.shortlists (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,

  name text not null check (char_length(name) between 1 and 80),
  brief text,
  description text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shortlists_studio_idx on public.shortlists (studio_id, created_at desc);

drop trigger if exists shortlists_updated_at on public.shortlists;
create trigger shortlists_updated_at
  before update on public.shortlists
  for each row execute function public.set_updated_at();

create table if not exists public.shortlist_items (
  shortlist_id uuid not null references public.shortlists(id) on delete cascade,
  talent_id uuid not null references public.talents(id) on delete cascade,
  added_by uuid references public.profiles(id) on delete set null,
  note text,
  added_at timestamptz not null default now(),
  primary key (shortlist_id, talent_id)
);

create index if not exists shortlist_items_talent_idx on public.shortlist_items (talent_id);

-- ─── Hirings ──────────────────────────────────────────────────────────────
-- Lifecycle:
--   1. Studio creates row with status='pending'.
--   2. Talent receives notification (via app), can confirm (-> 'confirmed')
--      or dispute (-> 'disputed').
--   3. On 'confirmed', trigger sets talents.availability='hired' and
--      talents.hired_until=end_date. Talent disappears from rankings.
--   4. On 'ended', trigger restores availability to 'available'.

create table if not exists public.hirings (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  talent_id uuid not null references public.talents(id) on delete cascade,

  project_title text,
  description text,
  start_date date not null,
  end_date date,
  rate text, -- free-form, never required (privacy)

  status hiring_status not null default 'pending',
  confirmed_at timestamptz,
  ended_at timestamptz,

  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hirings_talent_idx on public.hirings (talent_id, status);
create index if not exists hirings_studio_idx on public.hirings (studio_id, status);

drop trigger if exists hirings_updated_at on public.hirings;
create trigger hirings_updated_at
  before update on public.hirings
  for each row execute function public.set_updated_at();

-- Sync talent.availability on hiring status change.
create or replace function public.sync_talent_availability_on_hiring()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'confirmed' and (old.status is null or old.status <> 'confirmed') then
    update public.talents
       set availability = 'hired',
           hired_until = new.end_date
     where id = new.talent_id;
    new.confirmed_at := now();
  elsif new.status = 'ended' and (old.status is null or old.status <> 'ended') then
    update public.talents
       set availability = 'available',
           hired_until = null
     where id = new.talent_id;
    new.ended_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists hirings_sync_availability on public.hirings;
create trigger hirings_sync_availability
  before insert or update of status on public.hirings
  for each row execute function public.sync_talent_availability_on_hiring();
