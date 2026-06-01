-- TalentRank — 0006 — Talent Score System
-- ---------------------------------------------------------------------------
-- The talent score is the heart of TalentRank. It's deliberately built as
-- "prestige + signal", not gamification. The formula is transparent (stored
-- as a JSON breakdown per talent) and weighted so that:
--   • Experience and studio prestige dominate at the top of the curve.
--   • Portfolio depth + verified showreel matter at every level.
--   • Activity matters but doesn't dominate — we don't want a "post farm".
--   • Badges are derived signals, not free points.
--
-- The score is recomputed via triggers when a relevant table changes, and
-- ranks (global / discipline / country) are refreshed by a periodic call
-- to refresh_all_ranks() (recommended every 5 min via Supabase Cron).

-- ─── Endorsements ─────────────────────────────────────────────────────────
-- A talent or studio endorses a talent. Studios weigh more (weight=2.0)
-- than peers (weight=1.0). Verified studios weigh even more (handled in the
-- score function via prestige_weight).

create table if not exists public.endorsements (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references public.talents(id) on delete cascade,
  endorser_id uuid not null references public.profiles(id) on delete cascade,
  endorser_studio_id uuid references public.studios(id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  unique (talent_id, endorser_id)
);

create index if not exists endorsements_talent_idx on public.endorsements (talent_id);

-- ─── Score snapshot (one row per talent, in-sync via triggers) ────────────
create table if not exists public.talent_scores (
  talent_id uuid primary key references public.talents(id) on delete cascade,

  score int not null default 0 check (score between 0 and 100),
  percentile numeric(5,2) not null default 100 check (percentile between 0 and 100),

  global_rank int,
  discipline_rank int,
  country_rank int,

  tier tier_id not null default 'new',
  breakdown jsonb not null default '{}',

  computed_at timestamptz not null default now()
);

create index if not exists talent_scores_score_idx on public.talent_scores (score desc);
create index if not exists talent_scores_global_rank_idx on public.talent_scores (global_rank) where global_rank is not null;

-- ─── Audit log: every score factor change ─────────────────────────────────
create table if not exists public.score_events (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references public.talents(id) on delete cascade,
  factor text not null,
  old_value numeric,
  new_value numeric,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists score_events_talent_idx
  on public.score_events (talent_id, created_at desc);

-- ─── Compute function ────────────────────────────────────────────────────
-- Pure function (does not write). Returns { score, breakdown, tier }.
-- Each factor capped at its max, then summed. Total caps at 100.

create or replace function public.compute_talent_score(p_talent_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_talent record;
  v_profile record;

  -- Counters
  v_portfolio_count int := 0;
  v_featured_count int := 0;
  v_verified_exp_count int := 0;
  v_total_exp_count int := 0;
  v_studio_prestige_sum numeric := 0;
  v_endorsement_sum numeric := 0;
  v_endorsement_studio_sum numeric := 0;
  v_software_count int := 0;
  v_badge_count int := 0;
  v_completed_hirings int := 0;

  -- Component scores (each capped at its max — see comments)
  v_experience numeric;          -- 0..15
  v_notable_studios numeric;     -- 0..15
  v_portfolio numeric;           -- 0..12
  v_activity numeric;            -- 0..10
  v_endorsements numeric;        -- 0..12
  v_engagement numeric;          -- 0..8
  v_showreel numeric;            -- 0..6
  v_software_mastery numeric;    -- 0..8
  v_badges numeric;              -- 0..6
  v_rarity numeric;              -- 0..4
  v_completed_projects numeric;  -- 0..4

  v_total numeric;
  v_score int;
  v_tier tier_id;
begin
  select * into v_talent from public.talents where id = p_talent_id;
  if not found then return null; end if;
  select * into v_profile from public.profiles where id = p_talent_id;

  -- 1. Experience years (log curve, plateau at ~15y)
  v_experience := least(15, 15 * ln(1 + v_talent.years_experience) / ln(16));

  -- 2. Notable studios (verified experiences only, weighted by prestige)
  select
    count(*),
    count(*) filter (where is_verified),
    coalesce(sum(coalesce(sp.prestige_weight, 1.0)) filter (where e.is_verified), 0)
  into v_total_exp_count, v_verified_exp_count, v_studio_prestige_sum
  from public.experiences e
  left join public.studios sp on sp.id = e.studio_id
  where e.talent_id = p_talent_id;

  v_notable_studios := least(15, v_studio_prestige_sum * 2.5);

  -- 3. Portfolio quality (count + featured bonus)
  select count(*), count(*) filter (where is_featured)
  into v_portfolio_count, v_featured_count
  from public.portfolio_items where talent_id = p_talent_id;

  v_portfolio := least(12, v_portfolio_count * 1.0 + v_featured_count * 1.5);

  -- 4. Activity (recency of last_seen)
  v_activity := case
    when v_profile.last_seen_at > now() - interval '7 days'  then 10
    when v_profile.last_seen_at > now() - interval '30 days' then 7
    when v_profile.last_seen_at > now() - interval '90 days' then 4
    else 1
  end;

  -- 5. Endorsements (studio endorsements weigh 2x peer)
  select
    coalesce(sum(case when e.endorser_studio_id is not null then 2.0 else 1.0 end), 0),
    coalesce(sum(case when e.endorser_studio_id is not null then 1.0 else 0.0 end), 0)
  into v_endorsement_sum, v_endorsement_studio_sum
  from public.endorsements e where e.talent_id = p_talent_id;

  v_endorsements := least(12, v_endorsement_sum * 1.2);

  -- 6. Engagement (profile completion proxy)
  v_engagement := (
    (case when v_talent.tagline is not null and char_length(v_talent.tagline) > 10 then 2 else 0 end)
    + (case when v_profile.bio is not null and char_length(v_profile.bio) > 80 then 2 else 0 end)
    + (case when coalesce(array_length(v_talent.specialties, 1), 0) >= 2 then 2 else 0 end)
    + (case when coalesce(array_length(v_talent.languages, 1), 0) >= 2 then 1 else 0 end)
    + (case when v_profile.city is not null then 1 else 0 end)
  );

  -- 7. Showreel (binary, but a verified one weighs more — TBD via badge)
  v_showreel := case when v_talent.showreel_url is not null then 6 else 0 end;

  -- 8. Software mastery (sub-linear)
  v_software_count := coalesce(array_length(v_talent.software, 1), 0);
  v_software_mastery := least(8, sqrt(v_software_count) * 2.5);

  -- 9. Badges (system-awarded badges only — talent_badges)
  select count(*) into v_badge_count from public.talent_badges where talent_id = p_talent_id;
  v_badges := least(6, v_badge_count * 0.9);

  -- 10. Rarity — discipline-level scarcity. Approximated as
  -- (1 - share_of_discipline) * 4. Computed only if there are >=20 talents in
  -- the discipline; otherwise default to 2 (neutral).
  declare
    v_discipline_share numeric;
    v_discipline_total int;
  begin
    select count(*) into v_discipline_total
    from public.talents where discipline = v_talent.discipline and not is_hidden;

    if v_discipline_total >= 20 then
      v_discipline_share := 1.0 / greatest(v_discipline_total, 1);
      v_rarity := least(4, (1 - v_discipline_share) * 4);
    else
      v_rarity := 2;
    end if;
  end;

  -- 11. Completed projects (confirmed hirings that have ended)
  select count(*) into v_completed_hirings
  from public.hirings
  where talent_id = p_talent_id and status = 'ended';

  v_completed_projects := least(4, v_completed_hirings * 0.5);

  -- ─── Sum + cap ──────────────────────────────────────────────────────────
  v_total := v_experience
    + v_notable_studios
    + v_portfolio
    + v_activity
    + v_endorsements
    + v_engagement
    + v_showreel
    + v_software_mastery
    + v_badges
    + v_rarity
    + v_completed_projects;

  v_score := least(100, greatest(0, round(v_total)::int));

  -- ─── Tier (recomputed from percentile in refresh_talent_score) ──────────
  v_tier := 'new';

  return jsonb_build_object(
    'score', v_score,
    'tier',  v_tier,
    'breakdown', jsonb_build_object(
      'experience',          round(v_experience::numeric, 1),
      'notable_studios',     round(v_notable_studios::numeric, 1),
      'portfolio',           round(v_portfolio::numeric, 1),
      'activity',            round(v_activity::numeric, 1),
      'endorsements',        round(v_endorsements::numeric, 1),
      'engagement',          round(v_engagement::numeric, 1),
      'showreel',            round(v_showreel::numeric, 1),
      'software_mastery',    round(v_software_mastery::numeric, 1),
      'badges',              round(v_badges::numeric, 1),
      'rarity',              round(v_rarity::numeric, 1),
      'completed_projects',  round(v_completed_projects::numeric, 1)
    )
  );
end;
$$;

comment on function public.compute_talent_score(uuid) is
  'Pure, deterministic talent score. Returns {score:int, breakdown:jsonb}. Capped at 100.';

-- ─── Tier from percentile ─────────────────────────────────────────────────
create or replace function public.tier_from_percentile(p numeric)
returns tier_id language sql immutable as $$
  select case
    when p <= 1  then 'elite'::tier_id
    when p <= 5  then 'senior'::tier_id
    when p <= 10 then 'trending'::tier_id
    when p <= 25 then 'rising'::tier_id
    when p <= 50 then 'emerging'::tier_id
    else 'new'::tier_id
  end;
$$;

-- ─── Refresh a single talent's score ─────────────────────────────────────
create or replace function public.refresh_talent_score(p_talent_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
  v_score int;
  v_total int;
  v_higher int;
  v_pct numeric;
begin
  v_result := compute_talent_score(p_talent_id);
  if v_result is null then return; end if;
  v_score := (v_result->>'score')::int;

  -- Percentile = % of visible talents with a strictly higher score.
  -- Tied scores share a percentile band (good — feels less arbitrary).
  select count(*) into v_total
  from public.talent_scores ts
  join public.talents t on t.id = ts.talent_id
  where not t.is_hidden and t.availability <> 'hired';

  if v_total = 0 then
    v_pct := 0;
  else
    select count(*) into v_higher
    from public.talent_scores ts
    join public.talents t on t.id = ts.talent_id
    where ts.score > v_score and not t.is_hidden and t.availability <> 'hired';
    v_pct := (v_higher::numeric / v_total) * 100;
  end if;

  insert into public.talent_scores (talent_id, score, percentile, tier, breakdown, computed_at)
  values (
    p_talent_id,
    v_score,
    v_pct,
    tier_from_percentile(v_pct),
    v_result->'breakdown',
    now()
  )
  on conflict (talent_id) do update set
    score      = excluded.score,
    percentile = excluded.percentile,
    tier       = excluded.tier,
    breakdown  = excluded.breakdown,
    computed_at = excluded.computed_at;
end;
$$;

-- ─── Refresh all ranks (run on a schedule) ───────────────────────────────
-- Excludes hidden + hired talents from all rankings — they disappear cleanly
-- without losing their score history.

create or replace function public.refresh_all_ranks()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  with ranked as (
    select ts.talent_id,
           row_number() over (order by ts.score desc, ts.computed_at asc) as r
    from public.talent_scores ts
    join public.talents t on t.id = ts.talent_id
    where not t.is_hidden and t.availability <> 'hired'
  )
  update public.talent_scores ts
     set global_rank = ranked.r
    from ranked
   where ranked.talent_id = ts.talent_id;

  with ranked as (
    select ts.talent_id,
           row_number() over (
             partition by t.discipline
             order by ts.score desc, ts.computed_at asc
           ) as r
    from public.talent_scores ts
    join public.talents t on t.id = ts.talent_id
    where not t.is_hidden and t.availability <> 'hired'
  )
  update public.talent_scores ts
     set discipline_rank = ranked.r
    from ranked
   where ranked.talent_id = ts.talent_id;

  with ranked as (
    select ts.talent_id,
           row_number() over (
             partition by p.country_code
             order by ts.score desc, ts.computed_at asc
           ) as r
    from public.talent_scores ts
    join public.talents t on t.id = ts.talent_id
    join public.profiles p on p.id = t.id
    where not t.is_hidden and t.availability <> 'hired'
  )
  update public.talent_scores ts
     set country_rank = ranked.r
    from ranked
   where ranked.talent_id = ts.talent_id;
end;
$$;

comment on function public.refresh_all_ranks() is
  'Recompute global / discipline / country ranks. Hired & hidden talents excluded. Run every 5 min via Supabase Cron.';
