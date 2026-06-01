-- TalentRank — 0021 — QCM anti-cheat persistence
-- ---------------------------------------------------------------------------
-- Trois tables :
--   1. qcm_answer_keys  : (question_id, correct_option_id) — la SEULE source
--      de vérité serveur pour la correctness. Seedée depuis lib/qcm/questions/
--      via scripts/seed-qcm-answer-keys.ts à chaque déploiement.
--      Le bundle JS client n'envoie plus jamais cette info.
--   2. qcm_flags        : flags anti-cheat produits par scoring server-side
--   3. qcm_lockouts     : blocage par fingerprint OU IP OU user — un user
--      qui essaie de contourner la cooldown en changeant de browser
--      est rattrapé via fingerprint hash. Un VPN-switcher est rattrapé via
--      fingerprint malgré l'IP différente. Tripe-clé = très résistant.

-- ─── qcm_answer_keys ──────────────────────────────────────────────────────
-- Pas de FK vers une table questions (les questions vivent en TS). On
-- maintient cette table à jour via un seed à chaque deploy.
--
-- Sécurité : RLS ne laisse JAMAIS un user lire cette table. Seule la
-- function commit_qcm_answer (security definer) peut la query.

create table if not exists public.qcm_answer_keys (
  question_id text primary key,
  profession_id text not null,
  correct_option_id text not null,

  -- Si une question est flagguée comme fuitée (Reddit, screenshot Twitter,
  -- StackOverflow), on la marque is_compromised = true et le selector
  -- l'exclut automatiquement.
  is_compromised boolean not null default false,
  compromised_at timestamptz,
  compromised_reason text,

  -- Difficulty + axisId dupliqués ici pour permettre des vues SQL sans
  -- aller fouiller dans le TS. Source : exporté depuis le bank TS.
  difficulty text not null check (difficulty in ('beginner','intermediate','advanced','expert')),
  axis_id text not null,
  expected_seconds int not null check (expected_seconds > 0),

  updated_at timestamptz not null default now()
);

create index if not exists qcm_answer_keys_profession_idx
  on public.qcm_answer_keys (profession_id, difficulty);

create index if not exists qcm_answer_keys_active_idx
  on public.qcm_answer_keys (profession_id) where not is_compromised;

comment on table public.qcm_answer_keys is
  'Source de vérité serveur pour la correctness. Le bundle JS client n''a JAMAIS accès. Seedée depuis lib/qcm/questions/*.ts.';

-- ─── qcm_flags ────────────────────────────────────────────────────────────
-- Tous les flags produits par detectAllFlags() côté serveur, persistés pour
-- audit + modération. Une attempt peut avoir 0 à N flags.

create table if not exists public.qcm_flags (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.qcm_attempts(id) on delete cascade,
  talent_id uuid not null references public.profiles(id) on delete cascade,

  code text not null,
  severity text not null check (severity in ('low','medium','high')),
  detail text not null,

  -- Statut admin : 'pending' (par défaut), 'reviewed' (admin a regardé,
  -- jugé OK), 'confirmed' (vraie triche), 'dismissed' (faux positif).
  review_status text not null default 'pending'
    check (review_status in ('pending','reviewed','confirmed','dismissed')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,

  created_at timestamptz not null default now()
);

create index if not exists qcm_flags_attempt_idx on public.qcm_flags (attempt_id);
create index if not exists qcm_flags_talent_idx on public.qcm_flags (talent_id, created_at desc);
create index if not exists qcm_flags_pending_idx
  on public.qcm_flags (created_at desc) where review_status = 'pending';
create index if not exists qcm_flags_severity_idx
  on public.qcm_flags (severity, created_at desc) where review_status = 'pending';

comment on table public.qcm_flags is
  'Flags anti-cheat persistés pour audit + admin review queue (/admin/flags).';

-- ─── qcm_lockouts ─────────────────────────────────────────────────────────
-- Un lockout = "ce candidat/cette machine est bloqué sur ce métier jusqu'à X".
-- Trois axes possibles, au moins un doit être renseigné. Le RPC can_start_qcm
-- les utilise tous en OR pour empêcher le contournement.

create table if not exists public.qcm_lockouts (
  id uuid primary key default gen_random_uuid(),

  -- Au moins UN de ces trois doit être non null (check ci-dessous).
  talent_id uuid references public.profiles(id) on delete cascade,
  fingerprint_hash text,
  ip_hash text,

  -- Scope du lockout : si non null, ne s'applique qu'à ce métier.
  -- Sinon = lockout global (ban complet).
  profession_id text,

  expires_at timestamptz not null,
  reason text not null,

  -- Quel admin a posé le lockout (null = automatique).
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),

  constraint qcm_lockouts_at_least_one_key check (
    talent_id is not null or fingerprint_hash is not null or ip_hash is not null
  )
);

create index if not exists qcm_lockouts_active_talent_idx
  on public.qcm_lockouts (talent_id, expires_at) where talent_id is not null and expires_at > now();
create index if not exists qcm_lockouts_active_fingerprint_idx
  on public.qcm_lockouts (fingerprint_hash, expires_at) where fingerprint_hash is not null and expires_at > now();
create index if not exists qcm_lockouts_active_ip_idx
  on public.qcm_lockouts (ip_hash, expires_at) where ip_hash is not null and expires_at > now();

comment on table public.qcm_lockouts is
  'Blocages multi-clé (user OR fingerprint OR IP). Empêche le contournement via changement de browser ou VPN.';

-- ─── Helper : marquer une attempt comme abandonné après inactivité ────────
-- Run en cron tous les jours. Un attempt in_progress sans nouvelle réponse
-- depuis 24h est marqué abandoned (le slot est libéré pour un nouveau).

create or replace function public.abandon_stale_qcm_attempts()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_affected int;
begin
  update public.qcm_attempts a
  set status = 'abandoned',
      finished_at = now()
  where a.status = 'in_progress'
    and a.started_at < now() - interval '24 hours'
    and not exists (
      select 1 from public.qcm_responses r
      where r.attempt_id = a.id
        and r.committed_at > now() - interval '24 hours'
    );
  get diagnostics v_affected = row_count;
  return v_affected;
end;
$$;

comment on function public.abandon_stale_qcm_attempts() is
  'Run every hour via Supabase Cron. Marque attempts in_progress sans activité 24h+ comme abandoned.';
