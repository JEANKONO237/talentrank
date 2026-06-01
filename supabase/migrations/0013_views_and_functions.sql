-- TalentRank — 0013 — Public views & helper functions
-- ---------------------------------------------------------------------------
-- The app reads through views to keep query logic in SQL and indexable.
--   • public_talents — what Explore + Ranking + Talent cards consume.
--   • trending_talents — last-7-days activity, ordered by score.
--   • discipline_leaders — top N per discipline.

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
  t.tagline,
  t.years_experience,
  t.availability,
  t.availability_note,
  t.work_mode,
  t.contract_type,
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
left join public.talent_scores ts on ts.talent_id = t.id
where not t.is_hidden and t.availability <> 'hired';

comment on view public.public_talents is
  'Canonical view for Explore / Ranking / talent cards. Excludes hired & hidden talents.';

create or replace view public.trending_talents
with (security_invoker = true)
as
select pt.* from public.public_talents pt
where pt.last_seen_at > now() - interval '7 days'
order by pt.score desc, pt.last_seen_at desc;

-- ─── Touch last_seen_at ──────────────────────────────────────────────────
-- Called by the app on key user actions (server action middleware).

create or replace function public.touch_last_seen()
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles set last_seen_at = now() where id = auth.uid();
$$;

-- ─── Open / find a conversation between studio and talent ───────────────
create or replace function public.open_conversation(p_studio_id uuid, p_talent_id uuid, p_subject text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.is_studio_member(p_studio_id) then
    raise exception 'forbidden: not a studio member';
  end if;

  insert into public.conversations (studio_id, talent_id, subject, created_by)
  values (p_studio_id, p_talent_id, p_subject, auth.uid())
  on conflict (studio_id, talent_id) do update set
    subject = coalesce(excluded.subject, public.conversations.subject)
  returning id into v_id;

  return v_id;
end;
$$;

-- ─── Confirm a hiring (called by talent) ─────────────────────────────────
create or replace function public.confirm_hiring(p_hiring_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_talent uuid;
begin
  select talent_id into v_talent from public.hirings where id = p_hiring_id;
  if v_talent is null then raise exception 'hiring not found'; end if;
  if v_talent <> auth.uid() then raise exception 'forbidden: only the talent can confirm'; end if;

  update public.hirings set status = 'confirmed' where id = p_hiring_id;
end;
$$;

-- ─── End a hiring (either party can end) ────────────────────────────────
create or replace function public.end_hiring(p_hiring_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_talent uuid;
  v_studio uuid;
begin
  select talent_id, studio_id into v_talent, v_studio from public.hirings where id = p_hiring_id;
  if v_talent is null then raise exception 'hiring not found'; end if;
  if v_talent <> auth.uid() and not public.is_studio_member(v_studio) then
    raise exception 'forbidden';
  end if;
  update public.hirings set status = 'ended' where id = p_hiring_id;
end;
$$;

-- ─── Public profile metrics (for talent dashboard) ──────────────────────
create or replace function public.my_profile_metrics()
returns table (
  profile_views int,
  recruiter_views int,
  shortlisted_count int,
  unread_messages int,
  score int,
  percentile numeric,
  tier tier_id
)
language sql
security definer
set search_path = public
as $$
  select
    t.profile_views,
    t.recruiter_views,
    coalesce((select count(*)::int from public.shortlist_items si where si.talent_id = auth.uid()), 0) as shortlisted_count,
    coalesce((select sum(unread_for_talent)::int from public.conversations where talent_id = auth.uid()), 0) as unread_messages,
    coalesce(ts.score, 0) as score,
    coalesce(ts.percentile, 100) as percentile,
    coalesce(ts.tier, 'new'::tier_id) as tier
  from public.talents t
  left join public.talent_scores ts on ts.talent_id = t.id
  where t.id = auth.uid();
$$;
