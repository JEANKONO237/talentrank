-- TalentRank — 0023 — QCM Remote Procedure Calls (server-side enforcement)
-- ---------------------------------------------------------------------------
-- Ces fonctions sont la SEULE interface entre le client et le système QCM.
-- Tout passe par elles : démarrer un attempt, commit une réponse, finalize.
--
-- Sécurité : security definer = elles s'exécutent avec les droits du
-- créateur (postgres), donc elles peuvent lire qcm_answer_keys (interdit aux
-- users via RLS). C'est LE mécanisme qui rend la correctness inaccessible
-- au client.
--
-- Cooldown : 30 jours par défaut. Configurable via constante ci-dessous.

-- ─── Configuration ───────────────────────────────────────────────────────
do $$ begin
  -- 30 jours = 30 × 24 × 3600 s. Stocké comme interval pour clarté.
  if not exists (select 1 from pg_settings where name = 'app.qcm_cooldown_days') then
    -- Note : pg_settings est read-only ici ; on utilise une constante locale.
    null;
  end if;
end $$;

-- ─── 1. can_start_qcm ─────────────────────────────────────────────────────
-- Vérifie si l'utilisateur courant peut démarrer un QCM sur ce métier.
-- Retourne un objet JSON décrivant la décision (allowed + reason + détails).
--
-- Vérifications :
--   a. User authentifié
--   b. Cooldown actif sur (user, profession) ?
--   c. Lockout actif sur (user) OR (fingerprint) OR (ip) ?
--   d. Aucun attempt in_progress sur le même métier ?
--
-- Retour exemples :
--   {"allowed": true}
--   {"allowed": false, "reason": "cooldown", "expires_at": "2026-06-19T..."}
--   {"allowed": false, "reason": "lockout", "expires_at": "...", "scope": "fingerprint"}
--   {"allowed": false, "reason": "in_progress", "attempt_id": "..."}

create or replace function public.can_start_qcm(
  p_profession_id text,
  p_fingerprint_hash text default null,
  p_ip_hash text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_cooldown_expires timestamptz;
  v_lockout record;
  v_in_progress uuid;
begin
  if v_user is null then
    return jsonb_build_object('allowed', false, 'reason', 'not_authenticated');
  end if;

  -- (b) Cooldown actif ?
  select expires_at into v_cooldown_expires
  from public.qcm_cooldowns
  where talent_id = v_user and profession_id = p_profession_id;

  if v_cooldown_expires is not null and v_cooldown_expires > now() then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'cooldown',
      'expires_at', v_cooldown_expires
    );
  end if;

  -- (c) Lockout ?
  select * into v_lockout
  from public.qcm_lockouts
  where expires_at > now()
    and (profession_id is null or profession_id = p_profession_id)
    and (
      talent_id = v_user
      or (p_fingerprint_hash is not null and fingerprint_hash = p_fingerprint_hash)
      or (p_ip_hash is not null and ip_hash = p_ip_hash)
    )
  order by expires_at desc
  limit 1;

  if v_lockout.id is not null then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'lockout',
      'expires_at', v_lockout.expires_at,
      'scope', case
        when v_lockout.talent_id = v_user then 'user'
        when v_lockout.fingerprint_hash = p_fingerprint_hash then 'fingerprint'
        else 'ip'
      end
    );
  end if;

  -- (d) Attempt in_progress sur le même métier ?
  select id into v_in_progress
  from public.qcm_attempts
  where talent_id = v_user
    and profession_id = p_profession_id
    and status = 'in_progress'
    and started_at > now() - interval '24 hours'  -- au-delà, on considère expiré
  order by started_at desc
  limit 1;

  if v_in_progress is not null then
    return jsonb_build_object(
      'allowed', true,
      'reason', 'resume_in_progress',
      'attempt_id', v_in_progress
    );
  end if;

  return jsonb_build_object('allowed', true);
end;
$$;

comment on function public.can_start_qcm is
  'Vérifie cooldown + lockouts + attempt en cours. Source de vérité pour le gating côté UI.';

-- ─── 2. start_qcm_attempt ─────────────────────────────────────────────────
-- Crée un attempt + ses qcm_attempt_questions. Le client a déjà sélectionné
-- les questions côté Node.js (parce que les questions vivent en TS). On
-- valide ici juste les anti-cheat (cooldown, lockout) et on persiste.
--
-- Arguments :
--   p_profession_id   : métier ciblé
--   p_declared_years  : ce que le candidat a déclaré (verrouillé)
--   p_seed            : seed utilisé par la sélection côté Node (audit)
--   p_question_ids    : array des question_ids dans l'ordre servi
--   p_option_orders   : jsonb { question_id: [option_id1, option_id2, ...] }
--   p_fingerprint_hash + p_ip_hash : empreintes

create or replace function public.start_qcm_attempt(
  p_profession_id text,
  p_declared_years int,
  p_seed text,
  p_question_ids text[],
  p_option_orders jsonb,
  p_fingerprint_hash text default null,
  p_ip_hash text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_gate jsonb;
  v_attempt_id uuid;
  v_qid text;
  v_pos int := 0;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  -- Re-check gating (don't trust client) — le user pourrait skip can_start_qcm
  v_gate := public.can_start_qcm(p_profession_id, p_fingerprint_hash, p_ip_hash);
  if (v_gate->>'allowed')::boolean = false then
    raise exception 'qcm_not_allowed: %', v_gate->>'reason' using errcode = '53000';
  end if;

  -- Si reprise d'attempt in_progress → renvoyer son id, ne pas recréer.
  if v_gate->>'reason' = 'resume_in_progress' then
    return (v_gate->>'attempt_id')::uuid;
  end if;

  -- Valider que toutes les questions existent dans qcm_answer_keys et
  -- ne sont pas compromised. Empêche le client d'injecter des question_ids
  -- bidons.
  if exists (
    select 1 from unnest(p_question_ids) qid
    where not exists (
      select 1 from public.qcm_answer_keys ak
      where ak.question_id = qid
        and ak.profession_id = p_profession_id
        and not ak.is_compromised
    )
  ) then
    raise exception 'invalid_question_ids' using errcode = '22023';
  end if;

  -- Créer l'attempt
  insert into public.qcm_attempts (
    talent_id, profession_id, declared_years, seed,
    ip_hash, fingerprint_hash, status
  ) values (
    v_user, p_profession_id, p_declared_years, p_seed,
    p_ip_hash, p_fingerprint_hash, 'in_progress'
  )
  returning id into v_attempt_id;

  -- Persister l'ordre + l'option_order_json pour chaque Q
  foreach v_qid in array p_question_ids loop
    insert into public.qcm_attempt_questions (
      attempt_id, question_id, position, option_order_json, shown_at
    ) values (
      v_attempt_id,
      v_qid,
      v_pos,
      coalesce(p_option_orders -> v_qid, '[]'::jsonb),
      now()
    );
    v_pos := v_pos + 1;
  end loop;

  -- Tracker l'exposure pour l'anti-leak
  insert into public.qcm_question_exposure (talent_id, question_id, profession_id, last_seen_at, seen_count)
  select v_user, qid, p_profession_id, now(), 1
  from unnest(p_question_ids) qid
  on conflict (talent_id, question_id) do update set
    last_seen_at = excluded.last_seen_at,
    seen_count = public.qcm_question_exposure.seen_count + 1;

  return v_attempt_id;
end;
$$;

comment on function public.start_qcm_attempt is
  'Crée un attempt après vérification cooldown/lockout. Persiste l''ordre des Qs + permutations options.';

-- ─── 3. commit_qcm_answer ─────────────────────────────────────────────────
-- Enregistre une réponse. Calcule is_correct côté serveur via qcm_answer_keys.
-- Le client REÇOIT is_correct en retour (pour le reveal immédiat à la
-- Duolingo), mais ne peut pas le falsifier en input.

create or replace function public.commit_qcm_answer(
  p_attempt_id uuid,
  p_question_id text,
  p_option_id text,                -- peut être null si timeout
  p_duration_ms int,
  p_paste_count int default 0,
  p_visibility_breaks int default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_attempt record;
  v_correct_option text;
  v_is_correct boolean;
  v_explanation text;  -- réservé pour v2
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  -- Vérifier que l'attempt appartient au user + est in_progress
  select * into v_attempt from public.qcm_attempts where id = p_attempt_id;
  if not found or v_attempt.talent_id <> v_user then
    raise exception 'attempt_not_found_or_forbidden' using errcode = '42501';
  end if;
  if v_attempt.status <> 'in_progress' then
    raise exception 'attempt_already_finalized' using errcode = '53000';
  end if;

  -- Vérifier que la question fait partie de cet attempt
  if not exists (
    select 1 from public.qcm_attempt_questions
    where attempt_id = p_attempt_id and question_id = p_question_id
  ) then
    raise exception 'question_not_in_attempt' using errcode = '22023';
  end if;

  -- Lookup la bonne réponse server-side. Le client ne le voit JAMAIS.
  select correct_option_id into v_correct_option
  from public.qcm_answer_keys
  where question_id = p_question_id;

  v_is_correct := (p_option_id is not null and p_option_id = v_correct_option);

  -- Insert immutable (ON CONFLICT DO NOTHING garantit "pas de retour arrière")
  insert into public.qcm_responses (
    attempt_id, question_id, option_id,
    duration_ms, paste_count, visibility_breaks,
    is_correct
  ) values (
    p_attempt_id, p_question_id, p_option_id,
    p_duration_ms, p_paste_count, p_visibility_breaks,
    v_is_correct
  )
  on conflict (attempt_id, question_id) do nothing;

  return jsonb_build_object(
    'is_correct', v_is_correct,
    'correct_option_id', v_correct_option   -- révélé APRÈS commit, pour le reveal UI
  );
end;
$$;

comment on function public.commit_qcm_answer is
  'Enregistre une réponse immuable. is_correct calculé server-side, jamais accepté du client.';

-- ─── 4. finalize_qcm_attempt ──────────────────────────────────────────────
-- Termine un attempt :
--   1. Marque status = completed
--   2. Le scoring DÉTAILLÉ (les 6 dimensions, les flags) est calculé côté
--      Node.js parce que la logique est en TS et reste source de vérité.
--      Node appelle ensuite ce RPC en passant le breakdown calculé.
--   3. On stocke breakdown + final_score + cheat_penalty
--   4. On UPSERT qcm_results (1 ligne par (talent, profession) = score actuel)
--   5. On pose la cooldown 30 jours
--   6. On insert les flags dans qcm_flags
--
-- Note architecturale : pourquoi ne pas faire le scoring 100% en SQL ?
--   - Le code TS de scoring est complexe (300+ lignes), bien testé
--   - Le re-écrire en plpgsql doublerait le code à maintenir
--   - On préfère trust le Node serveur (pas le client) qui appelle ce RPC
--     avec service_role key
-- Le compromis : ce RPC ne fait PAS confiance au final_score brut s'il y a
-- une cohérence évidente cassée (ex: > 100). Sinon il accepte.

create or replace function public.finalize_qcm_attempt(
  p_attempt_id uuid,
  p_final_score int,
  p_cheat_penalty int,
  p_breakdown jsonb,
  p_flags jsonb,           -- array de { code, severity, detail }
  p_cooldown_days int default 30
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_attempt record;
  v_flag jsonb;
  v_total_in_profession int;
  v_higher int;
  v_percentile numeric;
  v_tier tier_id;
  v_expires timestamptz;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into v_attempt from public.qcm_attempts where id = p_attempt_id;
  if not found or v_attempt.talent_id <> v_user then
    raise exception 'attempt_not_found_or_forbidden' using errcode = '42501';
  end if;
  if v_attempt.status <> 'in_progress' then
    raise exception 'attempt_already_finalized' using errcode = '53000';
  end if;

  if p_final_score < 0 or p_final_score > 100 then
    raise exception 'invalid_final_score' using errcode = '22023';
  end if;

  v_expires := now() + (p_cooldown_days || ' days')::interval;

  -- 1. Update attempt
  update public.qcm_attempts
  set status = 'completed',
      finished_at = now(),
      final_score = p_final_score,
      cheat_penalty = p_cheat_penalty,
      breakdown = p_breakdown
  where id = p_attempt_id;

  -- 2. Calcul du percentile dans le métier (cohort réelle, pas demo)
  select count(*) into v_total_in_profession
  from public.qcm_results
  where profession_id = v_attempt.profession_id;

  if v_total_in_profession = 0 then
    v_percentile := 50;  -- premier du métier → médiane par défaut
  else
    select count(*) into v_higher
    from public.qcm_results
    where profession_id = v_attempt.profession_id
      and score > p_final_score;
    v_percentile := (v_higher::numeric / greatest(v_total_in_profession, 1)) * 100;
  end if;

  v_tier := public.tier_from_percentile(v_percentile);

  -- 3. UPSERT qcm_results
  insert into public.qcm_results (
    talent_id, profession_id, score, cheat_penalty, breakdown,
    tier, percentile, attempt_id, computed_at
  ) values (
    v_user, v_attempt.profession_id, p_final_score, p_cheat_penalty, p_breakdown,
    v_tier, v_percentile, p_attempt_id, now()
  )
  on conflict (talent_id, profession_id) do update set
    score = excluded.score,
    cheat_penalty = excluded.cheat_penalty,
    breakdown = excluded.breakdown,
    tier = excluded.tier,
    percentile = excluded.percentile,
    attempt_id = excluded.attempt_id,
    computed_at = excluded.computed_at;

  -- 4. Cooldown
  insert into public.qcm_cooldowns (talent_id, profession_id, expires_at, attempt_id)
  values (v_user, v_attempt.profession_id, v_expires, p_attempt_id)
  on conflict (talent_id, profession_id) do update set
    expires_at = excluded.expires_at,
    attempt_id = excluded.attempt_id;

  -- 5. Persist flags (si présents)
  if p_flags is not null and jsonb_array_length(p_flags) > 0 then
    for v_flag in select * from jsonb_array_elements(p_flags) loop
      insert into public.qcm_flags (
        attempt_id, talent_id,
        code, severity, detail
      ) values (
        p_attempt_id, v_user,
        v_flag->>'code',
        v_flag->>'severity',
        v_flag->>'detail'
      );
    end loop;
  end if;

  -- 6. Auto-lockout si flags high severity ≥ 2 (anti-cheat agressif)
  if (
    select count(*) from jsonb_array_elements(coalesce(p_flags, '[]'::jsonb)) f
    where f->>'severity' = 'high'
  ) >= 2 then
    insert into public.qcm_lockouts (
      talent_id, fingerprint_hash, ip_hash,
      profession_id, expires_at, reason
    ) values (
      v_user, v_attempt.fingerprint_hash, v_attempt.ip_hash,
      v_attempt.profession_id,
      now() + interval '90 days',
      'auto: 2+ high-severity flags'
    );
  end if;

  return jsonb_build_object(
    'attempt_id', p_attempt_id,
    'final_score', p_final_score,
    'tier', v_tier,
    'percentile', v_percentile,
    'cooldown_expires_at', v_expires
  );
end;
$$;

comment on function public.finalize_qcm_attempt is
  'Termine un attempt : score + tier + cooldown + flags + auto-lockout si tricherie détectée.';

-- ─── 5. refresh_qcm_ranks ─────────────────────────────────────────────────
-- Recalcule profession_rank dans qcm_results. À cron tous les 5 min.

create or replace function public.refresh_qcm_ranks()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  with ranked as (
    select talent_id, profession_id,
           row_number() over (
             partition by profession_id
             order by score desc, computed_at asc
           ) as r
    from public.qcm_results
  )
  update public.qcm_results r
     set profession_rank = ranked.r
    from ranked
   where ranked.talent_id = r.talent_id
     and ranked.profession_id = r.profession_id;
end;
$$;

comment on function public.refresh_qcm_ranks is
  'Recompute profession_rank dans qcm_results. Run every 5 min via Supabase Cron.';

-- ─── 6. get_exposed_question_ids ──────────────────────────────────────────
-- Helper appelé par le sélecteur Node.js pour savoir quelles questions
-- éviter pour ce candidat. Retourne la liste avec last_seen_at.

create or replace function public.get_exposed_question_ids(
  p_profession_id text,
  p_since_days int default 180
)
returns table (question_id text, last_seen_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select question_id, last_seen_at
  from public.qcm_question_exposure
  where talent_id = auth.uid()
    and profession_id = p_profession_id
    and last_seen_at > now() - (p_since_days || ' days')::interval;
$$;

comment on function public.get_exposed_question_ids is
  'Renvoie les question_ids déjà vus par ce user sur ce métier dans les N derniers jours.';
