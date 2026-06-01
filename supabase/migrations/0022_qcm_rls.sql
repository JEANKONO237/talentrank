-- TalentRank — 0022 — RLS policies for the QCM system
-- ---------------------------------------------------------------------------
-- Règles :
--   - Un talent voit/modifie SES propres attempts, responses, results,
--     cooldowns, exposure.
--   - PERSONNE (sauf le RPC security definer) ne lit qcm_answer_keys.
--   - Les questions servies (qcm_attempt_questions) sont visibles au
--     talent propriétaire MAIS la colonne option_order_json est sensitive
--     (un user pourrait analyser pour deviner). On la garde lisible parce
--     que l'option_id picked est déjà stocké dans qcm_responses, donc
--     re-construire l'ordre ne révèle rien de plus. La VRAIE protection
--     est : correctness vit dans qcm_answer_keys, jamais ailleurs.
--   - Admins (role = 'admin') voient tout, et peuvent reviewer les flags.

-- ─── Helper réutilisable : is_admin() ────────────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid()),
    false
  );
$$;

comment on function public.is_admin() is
  'TRUE si l''utilisateur courant a le rôle admin. À utiliser dans toutes les RLS qui ouvrent l''accès aux modérateurs.';

-- ─── Enable RLS ──────────────────────────────────────────────────────────
alter table public.qcm_attempts            enable row level security;
alter table public.qcm_attempt_questions   enable row level security;
alter table public.qcm_responses           enable row level security;
alter table public.qcm_results             enable row level security;
alter table public.qcm_cooldowns           enable row level security;
alter table public.qcm_question_exposure   enable row level security;
alter table public.qcm_answer_keys         enable row level security;
alter table public.qcm_flags               enable row level security;
alter table public.qcm_lockouts            enable row level security;

-- ─── qcm_attempts ────────────────────────────────────────────────────────
drop policy if exists qcm_attempts_select on public.qcm_attempts;
create policy qcm_attempts_select on public.qcm_attempts
  for select using (auth.uid() = talent_id or public.is_admin());

-- Les INSERT/UPDATE passent par RPC (security definer). On ne donne JAMAIS
-- l'accès direct au candidat — sinon il pourrait modifier final_score.
-- Aucune policy d'écriture = personne ne peut écrire en direct.

-- ─── qcm_attempt_questions ───────────────────────────────────────────────
drop policy if exists qcm_attempt_questions_select on public.qcm_attempt_questions;
create policy qcm_attempt_questions_select on public.qcm_attempt_questions
  for select using (
    exists (
      select 1 from public.qcm_attempts a
      where a.id = qcm_attempt_questions.attempt_id
        and (a.talent_id = auth.uid() or public.is_admin())
    )
  );

-- ─── qcm_responses ───────────────────────────────────────────────────────
drop policy if exists qcm_responses_select on public.qcm_responses;
create policy qcm_responses_select on public.qcm_responses
  for select using (
    exists (
      select 1 from public.qcm_attempts a
      where a.id = qcm_responses.attempt_id
        and (a.talent_id = auth.uid() or public.is_admin())
    )
  );

-- INSERT/UPDATE via RPC commit_qcm_answer uniquement.

-- ─── qcm_results ─────────────────────────────────────────────────────────
-- Les scores QCM par métier sont semi-publics : tout authentifié peut les
-- voir (c'est le classement). Mais le BREAKDOWN détaillé reste privé au
-- talent et aux studios qui shortlistent ce talent.

drop policy if exists qcm_results_select_score on public.qcm_results;
create policy qcm_results_select_score on public.qcm_results
  for select using (
    -- Le talent voit son propre breakdown complet (via les autres tables)
    auth.uid() = talent_id
    -- Tout user auth peut lire le score (pour les classements)
    or auth.uid() is not null
    or public.is_admin()
  );

-- ─── qcm_cooldowns ───────────────────────────────────────────────────────
drop policy if exists qcm_cooldowns_select on public.qcm_cooldowns;
create policy qcm_cooldowns_select on public.qcm_cooldowns
  for select using (auth.uid() = talent_id or public.is_admin());

-- ─── qcm_question_exposure ───────────────────────────────────────────────
drop policy if exists qcm_exposure_select on public.qcm_question_exposure;
create policy qcm_exposure_select on public.qcm_question_exposure
  for select using (auth.uid() = talent_id or public.is_admin());

-- ─── qcm_answer_keys ─────────────────────────────────────────────────────
-- SEULS LES ADMINS peuvent lire. Le RPC commit_qcm_answer (security definer)
-- by-passe la RLS pour faire son lookup. PERSONNE d'autre ne lit cette table.

drop policy if exists qcm_answer_keys_admin_only on public.qcm_answer_keys;
create policy qcm_answer_keys_admin_only on public.qcm_answer_keys
  for select using (public.is_admin());

-- INSERT/UPDATE : via le script de seed (service_role) uniquement.
-- Aucune policy = pas d'écriture pour les users normaux.

-- ─── qcm_flags ────────────────────────────────────────────────────────────
-- Le talent ne voit PAS ses propres flags (sinon il s'auto-debug). Seuls
-- les admins voient les flags. Le talent voit juste le résultat final
-- (le score est déjà pénalisé).

drop policy if exists qcm_flags_admin_only on public.qcm_flags;
create policy qcm_flags_admin_only on public.qcm_flags
  for select using (public.is_admin());

drop policy if exists qcm_flags_admin_review on public.qcm_flags;
create policy qcm_flags_admin_review on public.qcm_flags
  for update using (public.is_admin())
  with check (public.is_admin());

-- ─── qcm_lockouts ─────────────────────────────────────────────────────────
-- Le talent ne voit PAS s'il est lockout par fingerprint/IP — sinon il
-- comprend qu'il a été détecté. Seul l'admin voit. Le RPC can_start_qcm
-- (security definer) consulte la table pour décider d'autoriser un attempt.

drop policy if exists qcm_lockouts_admin_only on public.qcm_lockouts;
create policy qcm_lockouts_admin_only on public.qcm_lockouts
  for select using (public.is_admin());

drop policy if exists qcm_lockouts_admin_manage on public.qcm_lockouts
  ;
create policy qcm_lockouts_admin_manage on public.qcm_lockouts
  for all using (public.is_admin()) with check (public.is_admin());
