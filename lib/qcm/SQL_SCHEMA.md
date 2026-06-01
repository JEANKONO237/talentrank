# QCM / Evaluation — production SQL schema

Reference schema for moving the QCM engine from localStorage (v1) to a real
backend on Supabase. Mirrors the TypeScript types in `lib/qcm/types.ts`.

Design constraints:
- Every score is **reproducible** — we store the seed + every selected option,
  so re-scoring after a formula change yields identical results.
- The bank is **versioned**. A historical attempt always references the
  question revision active at attempt time, never the current revision.
- Cheat flags are first-class rows. Audit-friendly.
- RLS: a candidate can read their own attempts. Recruiters see only the
  computed score on the talent's profile, never the raw answers.

---

## Tables

```sql
-- ── Skill axes (per profession) ────────────────────────────────────────────
create table qcm_axes (
  id          text primary key,                 -- e.g. "rig", "fermentation"
  profession_id text not null,                  -- fk → professions(id)
  label       text not null,                    -- canonical English label
  fr_label    text not null,                    -- French label (default UI)
  created_at  timestamptz not null default now()
);
create index qcm_axes_profession on qcm_axes(profession_id);

-- ── Questions (versioned) ─────────────────────────────────────────────────
create table qcm_questions (
  id              text primary key,
  profession_id   text not null,
  axis_id         text not null references qcm_axes(id),
  difficulty      text not null check (difficulty in
                    ('beginner','intermediate','advanced','expert')),
  expected_seconds smallint not null check (expected_seconds > 0),
  prompt          text not null,
  -- Optional code block: { language: text, content: text }
  code            jsonb,
  tags            text[] not null default '{}',
  -- Revisioning: each edit increments revision. attempts reference
  -- (id, revision) so we never lose audit context.
  revision        integer not null default 1,
  -- Soft-delete via status.
  status          text not null default 'live' check (status in ('live','retired','draft')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index qcm_questions_profession on qcm_questions(profession_id, status);
create index qcm_questions_difficulty on qcm_questions(profession_id, difficulty, status);

-- ── Options (1 row per option) ────────────────────────────────────────────
create table qcm_question_options (
  question_id     text not null references qcm_questions(id),
  option_id       text not null,                -- "a" | "b" | "c" | "d"
  text            text not null,
  is_correct      boolean not null,
  explanation     text,
  -- Composite PK = stable identity across revisions.
  primary key (question_id, option_id)
);

-- Enforce: exactly ONE option per question is correct.
-- (Use a deferred trigger; one-correct invariant.)
create function check_one_correct_option() returns trigger as $$
begin
  if (select count(*) from qcm_question_options
        where question_id = coalesce(new.question_id, old.question_id)
        and is_correct) <> 1 then
    raise exception 'each question must have exactly one correct option';
  end if;
  return null;
end$$ language plpgsql;
create constraint trigger qcm_one_correct_option
  after insert or update or delete on qcm_question_options
  deferrable initially deferred
  for each row execute function check_one_correct_option();

-- ── Attempts ──────────────────────────────────────────────────────────────
create table qcm_attempts (
  id              uuid primary key default gen_random_uuid(),
  talent_id       uuid not null references profiles(id),
  profession_id   text not null,
  declared_years  smallint not null,
  seed            text not null,                -- mulberry32 seed (reproducible)
  scoring_version text not null,                -- e.g. "1.0.0"
  started_at      timestamptz not null default now(),
  finished_at     timestamptz,
  -- Engine outputs — all denormalised so listing a talent's best attempts
  -- doesn't require recomputation.
  final_score      numeric(5,1),
  technical        numeric(5,1),
  experience       numeric(5,1),
  reliability      numeric(5,1),
  specialization   numeric(5,1),
  communication    numeric(5,1),
  coherence        numeric(5,1),
  cheat_penalty    numeric(5,1) not null default 0,
  -- Per-axis + per-difficulty breakdown stored as JSONB for the radar viz.
  axis_scores       jsonb not null default '{}',
  difficulty_scores jsonb not null default '{}'
);
create index qcm_attempts_talent on qcm_attempts(talent_id, finished_at desc);
create index qcm_attempts_profession_score on
  qcm_attempts(profession_id, final_score desc) where finished_at is not null;

-- ── Answers (one row per question served) ─────────────────────────────────
create table qcm_answers (
  attempt_id        uuid not null references qcm_attempts(id) on delete cascade,
  position          smallint not null,                  -- 1-based display order
  question_id       text not null,
  question_revision integer not null,                   -- snapshot of revision
  -- Selected option_id (nullable when skipped / time-out).
  option_id         text,
  duration_ms       integer not null check (duration_ms >= 0),
  correct           boolean not null,
  paste_count       smallint not null default 0,
  visibility_breaks smallint not null default 0,
  primary key (attempt_id, position)
);

-- ── Cheat flags (one row per flag) ────────────────────────────────────────
create table qcm_attempt_flags (
  id          bigserial primary key,
  attempt_id  uuid not null references qcm_attempts(id) on delete cascade,
  code        text not null,                            -- 'paste', 'too-fast', ...
  severity    text not null check (severity in ('low','medium','high')),
  detail      text not null,
  created_at  timestamptz not null default now()
);
create index qcm_flags_attempt on qcm_attempt_flags(attempt_id);

-- ── Score history (re-computations over time) ─────────────────────────────
-- Whenever we change the formula (SCORING_VERSION bump), a job re-scores all
-- attempts and writes one row here per attempt. Lets us show "your score
-- moved from 72 to 76 after the v1.1 update" without losing the old value.
create table qcm_score_history (
  id              bigserial primary key,
  attempt_id      uuid not null references qcm_attempts(id) on delete cascade,
  scoring_version text not null,
  final_score     numeric(5,1) not null,
  computed_at     timestamptz not null default now()
);
create index qcm_score_history_attempt on qcm_score_history(attempt_id, computed_at desc);
```

---

## Row-Level Security

```sql
alter table qcm_attempts        enable row level security;
alter table qcm_answers         enable row level security;
alter table qcm_attempt_flags   enable row level security;

-- Candidates read their own attempts.
create policy "talent reads own attempts" on qcm_attempts
  for select using (talent_id = auth.uid());

-- Candidates insert attempts in their own name only.
create policy "talent inserts own attempts" on qcm_attempts
  for insert with check (talent_id = auth.uid());

-- Candidates read their own answers (via attempt).
create policy "talent reads own answers" on qcm_answers
  for select using (
    attempt_id in (select id from qcm_attempts where talent_id = auth.uid())
  );

-- Recruiters: NO direct access to attempts / answers. They consume scores
-- through a view that exposes only aggregates per talent + profession.
create or replace view qcm_public_scores as
select
  a.talent_id,
  a.profession_id,
  max(a.final_score)        as best_final,
  max(a.technical)          as best_technical,
  max(a.specialization)     as best_specialization,
  count(*) filter (where a.finished_at is not null) as completed_count
from qcm_attempts a
where a.finished_at is not null
group by a.talent_id, a.profession_id;

grant select on qcm_public_scores to authenticated;
```

---

## Ranking integration

Recruiter-facing ranking endpoints should JOIN against `qcm_public_scores` to
fold the QCM into the talent's overall position:

```sql
-- A candidate's effective score within a profession = α·QCM + β·portfolio
-- + γ·activity + δ·endorsements (configurable weights stored elsewhere).
--
-- For v2 we keep it simple:
--   effective_score = 0.55·qcm_best + 0.20·portfolio_score
--                    + 0.15·activity_score + 0.10·endorsements_score
```

---

## Migration plan (v1 localStorage → v2 Supabase)

1. Add `lib/qcm/supabase-adapter.ts` that mirrors the `session.ts` API but
   talks to RPCs (`qcm_start_attempt`, `qcm_submit_answer`, `qcm_finalize_attempt`).
2. Feature-flag `QCM_BACKEND = "local" | "supabase"`. Local stays the default
   in dev; staging flips first.
3. On a logged-in candidate's first attempt, sync their local attempts to the
   server (one-way migration), then mark the local store as migrated.
4. Drop localStorage path once 95% of candidates are on Supabase.

---

## Scoring formula contract

Tracked in code at `lib/qcm/scoring.ts`, version-stamped via
`SCORING_VERSION`. Bumping the version:

1. Update `SCORING_VERSION` (semver).
2. Update `DIMENSION_WEIGHTS` and/or sub-functions in `scoring.ts`.
3. Run the background job `qcm_rescore_all_attempts(version)` — inserts a
   fresh row in `qcm_score_history` per attempt.
4. UI surfaces `“Score recalculé · v{x.y.z}”` next to the talent's number.

Never mutate `qcm_attempts.final_score` after the fact for past attempts; the
score history table is the audit trail.
