-- TalentRank — 0020 — QCM persistence (server-side enforced)
-- ---------------------------------------------------------------------------
-- Migration de TOUT le système QCM côté DB. localStorage devient backup
-- offline ; la vérité vit ici.
--
-- Architecture :
--   1. qcm_attempts        : un par tentative, status = in_progress|completed|abandoned
--   2. qcm_attempt_questions : ordre des questions servies + ordre des options
--      (privé jusqu'au finalize — empêche l'analyse du bundle client)
--   3. qcm_responses       : réponses individuelles, auditable
--   4. qcm_results         : résumé par (talent, profession), 1 ligne = score actuel
--   5. qcm_cooldowns       : enforce les 30 jours entre deux passages
--   6. qcm_question_exposure : tracker pour anti-leak (qui a vu quoi, quand)
--
-- Architecture invariants :
--   - profession_id est un text (cohérent avec lib/professions.ts)
--   - question_id est text (vit dans lib/qcm/questions/*.ts en TS, seedé en DB
--     via qcm_answer_keys, voir 0021)
--   - talent_id = profile_id (1:1 dans schema actuel) — on stocke profile.id
--   - Toutes les colonnes sensibles sont en jsonb pour évolutivité (option_order
--     contient l'ordre randomisé des options, jamais révélé au client avant
--     le commit individuel d'une réponse)

-- ─── Enum : status d'un attempt ──────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'qcm_attempt_status') then
    create type qcm_attempt_status as enum ('in_progress', 'completed', 'abandoned');
  end if;
end$$;

-- ─── qcm_attempts ────────────────────────────────────────────────────────
-- Une tentative. Identifie le candidat, le métier, le moment. Le scoring
-- détaillé arrive après finalize ; ici on garde l'enveloppe.

create table if not exists public.qcm_attempts (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references public.profiles(id) on delete cascade,
  profession_id text not null,

  -- Snapshot des conditions au démarrage : verrouillées, ne peuvent pas être
  -- modifiées par le candidat en cours d'attempt.
  declared_years int not null check (declared_years >= 0 and declared_years <= 60),

  -- Seed reproductible (Mulberry32). Utilisé pour resélectionner les
  -- mêmes questions si on doit re-scorer un attempt (changement de formule).
  seed text not null,

  -- Empreintes anti-cheat capturées au démarrage. Permettent d'identifier
  -- un user qui se déconnecte/reconnecte pour contourner la cooldown.
  ip_hash text,                -- sha256(ip + server_pepper) — jamais l'IP brute
  fingerprint_hash text,       -- canvas+audio+webgl+UA hash côté client

  status qcm_attempt_status not null default 'in_progress',

  started_at timestamptz not null default now(),
  finished_at timestamptz,

  -- Au finalize, on duplique le résumé ici (lecture rapide sans join).
  final_score int check (final_score is null or (final_score between 0 and 100)),
  cheat_penalty int check (cheat_penalty is null or cheat_penalty >= 0),
  breakdown jsonb,              -- ScoreBreakdown sérialisé

  constraint qcm_attempts_finished_when_completed check (
    (status = 'in_progress' and finished_at is null and final_score is null)
    or (status <> 'in_progress' and finished_at is not null)
  )
);

create index if not exists qcm_attempts_talent_idx
  on public.qcm_attempts (talent_id, profession_id, started_at desc);

create index if not exists qcm_attempts_status_idx
  on public.qcm_attempts (status, started_at desc);

create index if not exists qcm_attempts_fingerprint_idx
  on public.qcm_attempts (fingerprint_hash) where fingerprint_hash is not null;

create index if not exists qcm_attempts_ip_idx
  on public.qcm_attempts (ip_hash) where ip_hash is not null;

-- ─── qcm_attempt_questions ───────────────────────────────────────────────
-- Ordre des questions servies, et ordre randomisé des options POUR CET
-- ATTEMPT. C'est ici que vit la randomisation — pas côté client. Le client
-- reçoit les options déjà shufflées via RPC ; il ne sait pas dans quel ordre
-- elles étaient à l'origine, donc il ne peut pas "voir A est toujours
-- correct".
--
-- Pour la contrainte du user : "jamais la même question dans le même ordre
-- avec les mêmes réponses placées pareil" — on contrôle ça via :
--   - position : ordre des Qs (unique par attempt)
--   - option_order_json : permutation des option_ids pour cette Q dans cet attempt

create table if not exists public.qcm_attempt_questions (
  attempt_id uuid not null references public.qcm_attempts(id) on delete cascade,
  question_id text not null,

  -- Position 0..N-1 dans la séquence servie au candidat.
  position int not null check (position >= 0),

  -- Permutation des option_ids pour CET attempt. Ex: ["c","a","d","b"]
  -- signifie qu'à l'écran 1 = c, 2 = a, 3 = d, 4 = b. Le client n'a aucun
  -- moyen de deviner la position originale.
  option_order_json jsonb not null,

  -- Quand le client a réellement reçu cette Q (server timestamp).
  -- Sert au scoring (durationMs = response_received_at - shown_at).
  shown_at timestamptz,

  primary key (attempt_id, question_id),
  unique (attempt_id, position)
);

-- ─── qcm_responses ───────────────────────────────────────────────────────
-- Une réponse, immutable. Pas de UPDATE possible : ce que tu coches est
-- gravé. Ça enforce "pas de retour en arrière" côté DB.

create table if not exists public.qcm_responses (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.qcm_attempts(id) on delete cascade,
  question_id text not null,

  -- L'option_id picked (peut être null si timeout / skip).
  option_id text,

  -- Métriques bruts capturées côté client (à valider/auditer).
  duration_ms int not null check (duration_ms >= 0),
  paste_count int not null default 0 check (paste_count >= 0),
  visibility_breaks int not null default 0 check (visibility_breaks >= 0),

  -- Calculé server-side via lookup dans qcm_answer_keys. Le client ne le
  -- définit JAMAIS. C'est ce qui empêche un faux "correct: true" injecté.
  is_correct boolean not null,

  -- Server timestamp du commit.
  committed_at timestamptz not null default now(),

  -- Une seule réponse par (attempt, question) — pas de "j'essaie A, je change
  -- pour B". Le RPC commit_qcm_answer ON CONFLICT DO NOTHING refuse les
  -- doublons.
  unique (attempt_id, question_id)
);

create index if not exists qcm_responses_attempt_idx
  on public.qcm_responses (attempt_id, committed_at);

-- ─── qcm_results ──────────────────────────────────────────────────────────
-- Une ligne par (talent, profession) = le dernier score officiel. Mise à
-- jour à chaque finalize_qcm_attempt. Source des classements par métier.

create table if not exists public.qcm_results (
  talent_id uuid not null references public.profiles(id) on delete cascade,
  profession_id text not null,

  -- Dernier score officiel.
  score int not null check (score between 0 and 100),
  cheat_penalty int not null default 0 check (cheat_penalty >= 0),
  breakdown jsonb not null,

  -- Tier dérivé du percentile dans CE métier (pas global).
  tier tier_id not null,
  percentile numeric(5,2) not null check (percentile between 0 and 100),

  -- Le rank dans le métier. Recalculé via refresh_qcm_ranks() (0023).
  profession_rank int,

  -- Attempt qui a produit ce résultat (audit trail).
  attempt_id uuid not null references public.qcm_attempts(id) on delete cascade,

  computed_at timestamptz not null default now(),

  primary key (talent_id, profession_id)
);

create index if not exists qcm_results_profession_score_idx
  on public.qcm_results (profession_id, score desc);

create index if not exists qcm_results_score_global_idx
  on public.qcm_results (score desc);

-- ─── qcm_cooldowns ────────────────────────────────────────────────────────
-- 1 ligne = "ce talent est en cooldown sur ce métier jusqu'à X".
-- Enforced par le RPC can_start_qcm (0023).

create table if not exists public.qcm_cooldowns (
  talent_id uuid not null references public.profiles(id) on delete cascade,
  profession_id text not null,

  expires_at timestamptz not null,
  attempt_id uuid references public.qcm_attempts(id) on delete set null,

  created_at timestamptz not null default now(),

  primary key (talent_id, profession_id)
);

create index if not exists qcm_cooldowns_active_idx
  on public.qcm_cooldowns (expires_at) where expires_at > now();

-- ─── qcm_question_exposure ───────────────────────────────────────────────
-- Anti-leak : qui a vu quoi, quand. Le selector consultera cette table pour
-- savoir si on peut re-servir une question à ce user.
--
-- On stocke aussi la profession parce que la même question peut
-- théoriquement apparaître dans deux banques (rare mais possible).

create table if not exists public.qcm_question_exposure (
  talent_id uuid not null references public.profiles(id) on delete cascade,
  question_id text not null,
  profession_id text not null,

  last_seen_at timestamptz not null default now(),
  seen_count int not null default 1 check (seen_count >= 1),

  primary key (talent_id, question_id)
);

create index if not exists qcm_exposure_recency_idx
  on public.qcm_question_exposure (talent_id, profession_id, last_seen_at desc);

-- ─── Comments ────────────────────────────────────────────────────────────
comment on table public.qcm_attempts is
  'Une tentative QCM. Statut + métriques anti-cheat + score final (après finalize).';
comment on table public.qcm_attempt_questions is
  'Ordre + permutation des options pour CET attempt. Privé : le client ne voit pas option_order_json directement.';
comment on table public.qcm_responses is
  'Une réponse, immutable. is_correct est calculé server-side via qcm_answer_keys.';
comment on table public.qcm_results is
  'Dernier score officiel par (talent, profession). Source des classements par métier.';
comment on table public.qcm_cooldowns is
  '30 jours enforced server-side entre deux passages sur le même métier.';
comment on table public.qcm_question_exposure is
  'Tracker anti-leak : empêche de re-servir la même question trop tôt.';
