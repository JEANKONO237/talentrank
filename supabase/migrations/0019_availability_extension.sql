-- TalentRank — 0019 — Availability extension
-- ---------------------------------------------------------------------------
-- The product asked for finer availability states beyond simple
-- available/open/on-mission. We add:
--   • freelance-only — open to freelance contracts only
--   • remote-only    — open to remote roles only
--   • available-in-30d — explicit short-horizon availability
--
-- These complement `availability_status` rather than replacing it: a talent
-- can be 'available' + freelance-only + remote-only. We model them as
-- boolean flags on talents (simple, queryable, indexable) rather than
-- exploding the enum (which would force exclusivity).

alter table public.talents
  add column if not exists freelance_only boolean not null default false,
  add column if not exists remote_only    boolean not null default false,
  add column if not exists available_in_days int check (available_in_days is null or available_in_days between 0 and 365);

create index if not exists talents_freelance_only_idx on public.talents (freelance_only) where freelance_only;
create index if not exists talents_remote_only_idx    on public.talents (remote_only) where remote_only;
create index if not exists talents_available_in_idx   on public.talents (available_in_days) where available_in_days is not null;

-- Extend the public_talents view with the new fields.
drop view if exists public.public_talents cascade;
create or replace view public.public_talents
with (security_invoker = true)
as
select
  p.id,
  p.username,
  p.display_name,
  p.avatar_initials,
  p.avatar_gradient,
  p.country_code,
  p.city,
  p.bio,
  p.last_seen_at,
  p.created_at as joined_at,
  t.discipline,
  t.profession_id,
  prof.label as profession_label,
  prof.short_label as profession_short_label,
  prof.category_id as profession_category,
  t.tagline,
  t.years_experience,
  t.availability,
  t.availability_note,
  t.work_mode,
  t.contract_type,
  t.freelance_only,
  t.remote_only,
  t.available_in_days,
  t.showreel_url,
  t.website_url,
  t.artstation_url,
  t.vimeo_url,
  t.youtube_url,
  t.linkedin_url,
  t.specialties,
  t.software,
  t.languages,
  t.hired_until,
  coalesce(ts.score, 0) as score,
  coalesce(ts.percentile, 100) as percentile,
  ts.global_rank,
  ts.discipline_rank,
  ts.country_rank,
  coalesce(ts.tier, 'new'::tier_id) as tier,
  coalesce(ts.breakdown, '{}'::jsonb) as breakdown,
  coalesce(
    (select array_agg(badge_id order by awarded_at desc) from public.talent_badges where talent_id = t.id),
    '{}'::text[]
  ) as badges,
  coalesce(
    (select count(*)::int from public.portfolio_items where talent_id = t.id),
    0
  ) as portfolio_count
from public.profiles p
join public.talents t on t.id = p.id
left join public.professions prof on prof.id = t.profession_id
left join public.talent_scores ts on ts.talent_id = t.id
where not t.is_hidden and t.availability <> 'hired';

create or replace view public.trending_talents
with (security_invoker = true)
as
select pt.* from public.public_talents pt
where pt.last_seen_at > now() - interval '7 days'
order by pt.score desc, pt.last_seen_at desc;
