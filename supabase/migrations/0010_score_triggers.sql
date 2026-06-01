-- TalentRank — 0010 — Score auto-refresh triggers
-- ---------------------------------------------------------------------------
-- Recompute a talent's score whenever something feeding into it changes.
-- Refresh is cheap (single row write to talent_scores). Rank refresh is
-- still global so we keep it on a schedule via refresh_all_ranks().

create or replace function public.trigger_refresh_score_for_talent_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_talent_score(coalesce(new.talent_id, old.talent_id));
  return coalesce(new, old);
end;
$$;

create or replace function public.trigger_refresh_score_for_self_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_talent_score(coalesce(new.id, old.id));
  return coalesce(new, old);
end;
$$;

-- Portfolio changes → recompute owner
drop trigger if exists portfolio_items_score_trg on public.portfolio_items;
create trigger portfolio_items_score_trg
  after insert or update or delete on public.portfolio_items
  for each row execute function public.trigger_refresh_score_for_talent_id();

-- Experience changes → recompute owner
drop trigger if exists experiences_score_trg on public.experiences;
create trigger experiences_score_trg
  after insert or update or delete on public.experiences
  for each row execute function public.trigger_refresh_score_for_talent_id();

-- Endorsement changes → recompute target
drop trigger if exists endorsements_score_trg on public.endorsements;
create trigger endorsements_score_trg
  after insert or update or delete on public.endorsements
  for each row execute function public.trigger_refresh_score_for_talent_id();

-- Talent's own fields changed (showreel, years_experience, etc.)
drop trigger if exists talents_score_trg on public.talents;
create trigger talents_score_trg
  after insert or update on public.talents
  for each row execute function public.trigger_refresh_score_for_self_id();

-- Badge changes → recompute owner
drop trigger if exists talent_badges_score_trg on public.talent_badges;
create trigger talent_badges_score_trg
  after insert or delete on public.talent_badges
  for each row execute function public.trigger_refresh_score_for_talent_id();
