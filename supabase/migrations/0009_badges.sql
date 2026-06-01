-- TalentRank — 0009 — Badges
-- ---------------------------------------------------------------------------
-- Badges are derived signals, not free points. Most are auto-awarded by
-- background jobs (e.g. 'active' if last_seen_at < 7 days). Some are awarded
-- by admins or studios (e.g. 'showreel-verified', 'visual-storytelling').

create table if not exists public.badges (
  id text primary key,
  label text not null,
  tone text not null check (tone in ('green', 'amber', 'cyan', 'violet', 'pink', 'mist')),
  description text,
  is_auto boolean not null default false
);

create table if not exists public.talent_badges (
  talent_id uuid not null references public.talents(id) on delete cascade,
  badge_id text not null references public.badges(id) on delete cascade,

  awarded_by uuid references public.profiles(id) on delete set null,
  awarded_reason text,
  awarded_at timestamptz not null default now(),

  primary key (talent_id, badge_id)
);

create index if not exists talent_badges_badge_idx on public.talent_badges (badge_id);

-- Seed canonical badges (idempotent)
insert into public.badges (id, label, tone, description, is_auto) values
  ('available',           'Available Now',        'green',  'Open to take a brief immediately',           true),
  ('in-demand',           'In High Demand',       'amber',  '3+ recruiter views in the last 7 days',      true),
  ('showreel-verified',   'Showreel Verified',    'cyan',   'Showreel reviewed by TalentRank',            false),
  ('fast-responder',      'Fast Responder',       'amber',  'Average response time under 6 hours',        true),
  ('international',       'International',        'cyan',   'Speaks 2+ languages, works across borders',  true),
  ('top10',               'Top 10% Global',       'amber',  'Ranked in the top 10% globally',             true),
  ('unreal-specialist',   'Unreal Specialist',    'amber',  'Verified mastery in Unreal Engine',          false),
  ('visual-storytelling', 'Visual Storytelling',  'violet', 'Recognized storytelling craft',              false),
  ('senior',              'Senior Artist',        'cyan',   '8+ years of verified experience',            true),
  ('recently-hired',      'On Mission',           'mist',   'Currently working on a confirmed mission',   true),
  ('active',              'Highly Active',        'green',  'Active in the last 7 days',                  true)
on conflict (id) do update set
  label = excluded.label,
  tone = excluded.tone,
  description = excluded.description,
  is_auto = excluded.is_auto;

-- ─── Auto-award job (idempotent, safe to run repeatedly) ─────────────────
create or replace function public.refresh_auto_badges()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 'available' — talent is in 'available' status
  insert into public.talent_badges (talent_id, badge_id, awarded_by, awarded_reason)
  select t.id, 'available', null, 'auto'
  from public.talents t
  where t.availability = 'available' and not t.is_hidden
  on conflict do nothing;

  delete from public.talent_badges
  where badge_id = 'available'
  and talent_id in (select id from public.talents where availability <> 'available');

  -- 'recently-hired'
  insert into public.talent_badges (talent_id, badge_id, awarded_by, awarded_reason)
  select t.id, 'recently-hired', null, 'auto'
  from public.talents t
  where t.availability = 'hired'
  on conflict do nothing;

  delete from public.talent_badges
  where badge_id = 'recently-hired'
  and talent_id in (select id from public.talents where availability <> 'hired');

  -- 'active' — seen in last 7 days
  insert into public.talent_badges (talent_id, badge_id, awarded_by, awarded_reason)
  select t.id, 'active', null, 'auto'
  from public.talents t
  join public.profiles p on p.id = t.id
  where p.last_seen_at > now() - interval '7 days' and not t.is_hidden
  on conflict do nothing;

  delete from public.talent_badges
  where badge_id = 'active'
  and talent_id in (
    select t.id from public.talents t join public.profiles p on p.id = t.id
    where p.last_seen_at <= now() - interval '7 days'
  );

  -- 'senior' — 8+ years experience
  insert into public.talent_badges (talent_id, badge_id, awarded_by, awarded_reason)
  select id, 'senior', null, 'auto'
  from public.talents where years_experience >= 8 and not is_hidden
  on conflict do nothing;

  -- 'international' — 2+ languages
  insert into public.talent_badges (talent_id, badge_id, awarded_by, awarded_reason)
  select id, 'international', null, 'auto'
  from public.talents
  where coalesce(array_length(languages, 1), 0) >= 2 and not is_hidden
  on conflict do nothing;

  -- 'top10' — global percentile <= 10
  insert into public.talent_badges (talent_id, badge_id, awarded_by, awarded_reason)
  select talent_id, 'top10', null, 'auto'
  from public.talent_scores where percentile <= 10
  on conflict do nothing;

  delete from public.talent_badges
  where badge_id = 'top10'
  and talent_id in (select talent_id from public.talent_scores where percentile > 10);
end;
$$;

comment on function public.refresh_auto_badges() is
  'Idempotent auto-badge refresh. Run via Supabase Cron alongside refresh_all_ranks().';
