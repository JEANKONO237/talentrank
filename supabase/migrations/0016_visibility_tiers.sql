-- TalentRank — 0016 — Visibility tiers (public vs verified-recruiter-only)
-- ---------------------------------------------------------------------------
-- Public payload (anyone can read via public_talents view):
--   pseudo/display_name, profession, score, badges, ranking, public portfolio,
--   city, country, availability, languages, software, specialties.
--
-- Private payload (verified studio members ONLY):
--   email, phone, salary expectations, CV file path, notice period, full
--   address, sensitive notes.
--
-- This migration introduces `talent_private` (1:1 with talents) and locks it
-- behind RLS. The view `recruiter_talent_view` joins public+private for the
-- recruiter-side UI. Public surfaces continue to use `public_talents`.

create table if not exists public.talent_private (
  talent_id uuid primary key references public.talents(id) on delete cascade,

  email text,           -- mirrors auth.users.email — refresh from app
  phone text,
  full_address text,
  notice_period_days int check (notice_period_days is null or notice_period_days between 0 and 365),

  expected_salary_min int,  -- in EUR-cents, optional, talent-defined
  expected_salary_max int,
  expected_currency char(3) default 'EUR',

  cv_storage_path text,      -- bucket: `cvs`
  cover_letter_path text,    -- bucket: `cvs` — sometimes useful for senior roles

  private_note text,         -- a private blurb the talent leaves for recruiters

  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists talent_private_email_idx on public.talent_private (email);

drop trigger if exists talent_private_updated_at on public.talent_private;
create trigger talent_private_updated_at
  before update on public.talent_private
  for each row execute function public.set_updated_at();

-- ─── RLS ────────────────────────────────────────────────────────────────
-- The talent themselves can read & write their own private row.
-- VERIFIED studio members can read private rows of talents they have an
-- active interest in (i.e. saved to a shortlist OR sent an interview
-- proposal). This prevents bulk scraping of contact info.

alter table public.talent_private enable row level security;

drop policy if exists talent_private_self_select on public.talent_private;
create policy talent_private_self_select on public.talent_private
  for select using (auth.uid() = talent_id);

drop policy if exists talent_private_self_cud on public.talent_private;
create policy talent_private_self_cud on public.talent_private
  for all using (auth.uid() = talent_id) with check (auth.uid() = talent_id);

-- Verified studios can read private data of talents they have a relationship with.
-- Relationship = shortlist OR interview_proposal (created in 0017) OR confirmed hiring.
drop policy if exists talent_private_recruiter_select on public.talent_private;
create policy talent_private_recruiter_select on public.talent_private
  for select using (
    exists (
      select 1
      from public.studio_members sm
      join public.studios s on s.id = sm.studio_id
      where sm.user_id = auth.uid()
        and s.is_verified = true
        and (
          -- talent is on one of our shortlists
          exists (
            select 1 from public.shortlist_items si
            join public.shortlists sl on sl.id = si.shortlist_id
            where si.talent_id = talent_private.talent_id and sl.studio_id = s.id
          )
          -- OR we have a hiring on file
          or exists (
            select 1 from public.hirings h
            where h.talent_id = talent_private.talent_id and h.studio_id = s.id
          )
        )
    )
  );

-- ─── Helper for the app to refresh email when auth.users.email changes ──
create or replace function public.sync_talent_private_email()
returns trigger language plpgsql security definer as $$
begin
  update public.talent_private set email = new.email where talent_id = new.id;
  return new;
end $$;

-- ─── Create cvs bucket (private — never public) ─────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cvs', 'cvs', false, 20971520, array['application/pdf','image/jpeg','image/png','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Owner can upload to `${talent_id}/...`, owner can read, verified
-- recruiters with a relationship can also read.
drop policy if exists "cvs insert owner" on storage.objects;
create policy "cvs insert owner" on storage.objects
  for insert with check (
    bucket_id = 'cvs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "cvs update owner" on storage.objects;
create policy "cvs update owner" on storage.objects
  for update using (
    bucket_id = 'cvs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "cvs delete owner" on storage.objects;
create policy "cvs delete owner" on storage.objects
  for delete using (
    bucket_id = 'cvs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "cvs select owner" on storage.objects;
create policy "cvs select owner" on storage.objects
  for select using (
    bucket_id = 'cvs'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or exists (
        select 1
        from public.studio_members sm
        join public.studios s on s.id = sm.studio_id
        where sm.user_id = auth.uid()
          and s.is_verified = true
          and (
            exists (
              select 1 from public.shortlist_items si
              join public.shortlists sl on sl.id = si.shortlist_id
              where si.talent_id::text = (storage.foldername(name))[1] and sl.studio_id = s.id
            )
            or exists (
              select 1 from public.hirings h
              where h.talent_id::text = (storage.foldername(name))[1] and h.studio_id = s.id
            )
          )
      )
    )
  );
