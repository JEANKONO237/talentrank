-- TalentRank — 0018 — Score history (daily snapshots for evolution curve)
-- ---------------------------------------------------------------------------
-- The talent sees their market value evolve in real time. We snapshot
-- (talent_id, day, score, percentile, tier) once per day per talent.
--
-- Inserts are cheap; reads are by (talent_id, day desc) for sparkline / chart.

create table if not exists public.talent_score_history (
  id bigserial primary key,
  talent_id uuid not null references public.talents(id) on delete cascade,

  score int not null check (score between 0 and 100),
  percentile numeric(5,2) not null check (percentile between 0 and 100),
  tier tier_id not null,

  global_rank int,
  discipline_rank int,
  country_rank int,

  recorded_on date not null default current_date,
  recorded_at timestamptz not null default now(),

  unique (talent_id, recorded_on)
);

create index if not exists score_history_talent_recent on public.talent_score_history (talent_id, recorded_on desc);

alter table public.talent_score_history enable row level security;

drop policy if exists score_history_select on public.talent_score_history;
create policy score_history_select on public.talent_score_history
  for select using (
    -- The talent always sees their own
    auth.uid() = talent_id
    -- Verified studios that have a relationship can see history (justifies their interest)
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
            where si.talent_id = talent_score_history.talent_id and sl.studio_id = s.id
          )
          or exists (
            select 1 from public.interview_proposals ip
            where ip.talent_id = talent_score_history.talent_id and ip.studio_id = s.id
          )
        )
    )
  );

-- ─── Snapshot helpers ───────────────────────────────────────────────────
-- Take a snapshot for one talent. Idempotent within the same day.
create or replace function public.snapshot_talent_score(p_talent_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_score record;
begin
  select score, percentile, tier, global_rank, discipline_rank, country_rank
    into v_score
    from public.talent_scores
   where talent_id = p_talent_id;
  if not found then return; end if;

  insert into public.talent_score_history
    (talent_id, score, percentile, tier, global_rank, discipline_rank, country_rank)
  values
    (p_talent_id, v_score.score, v_score.percentile, v_score.tier,
     v_score.global_rank, v_score.discipline_rank, v_score.country_rank)
  on conflict (talent_id, recorded_on) do update set
    score = excluded.score,
    percentile = excluded.percentile,
    tier = excluded.tier,
    global_rank = excluded.global_rank,
    discipline_rank = excluded.discipline_rank,
    country_rank = excluded.country_rank,
    recorded_at = now();
end;
$$;

-- Daily batch — run via Supabase Cron at e.g. 03:00 UTC.
create or replace function public.snapshot_all_scores()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare r record;
begin
  for r in select talent_id from public.talent_scores loop
    perform public.snapshot_talent_score(r.talent_id);
  end loop;
end;
$$;

comment on function public.snapshot_all_scores() is
  'Run nightly via Supabase Cron to populate the score-evolution curve for every talent.';
