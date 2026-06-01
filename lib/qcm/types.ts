// TalentRank — QCM / Evaluation engine types
// ----------------------------------------------------------------------------
// This is the SOURCE OF TRUTH for the evaluation system, the feature that
// gives the platform its credibility. Everything else — leaderboards, league
// progression, recruiter trust — depends on the scores produced here.
//
// Architecture invariants:
//   1. ONE bank per profession. No cross-profession question reuse.
//   2. Every question carries an `axisId` (sub-skill) + `difficulty`.
//   3. The scoring engine outputs a 6-dimensional breakdown PLUS a single
//      final TalentRank score. Recruiters see the final + the radar; admins
//      see the flags.
//   4. Anti-cheat is encoded as `CheatFlag[]` with severity → penalty.
//   5. Nothing here is profession-knowledge: this file describes the shape,
//      questions live in lib/qcm/questions/<professionId>.ts.

// ── Difficulty ───────────────────────────────────────────────────────────────

export type DifficultyLevel = "beginner" | "intermediate" | "advanced" | "expert";

export const DIFFICULTY_ORDER: DifficultyLevel[] = [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
];

/** Weight applied to a correct answer at this difficulty when computing the
 *  technical score. Hard questions are worth more, so a lucky beginner can't
 *  out-score someone who nailed an expert prompt. */
export const DIFFICULTY_WEIGHT: Record<DifficultyLevel, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3.5,
  expert: 6,
};

/** Localized labels (FR is the default locale on this product). */
export const DIFFICULTY_LABEL: Record<DifficultyLevel, { fr: string; en: string }> = {
  beginner:     { fr: "Débutant",     en: "Beginner" },
  intermediate: { fr: "Intermédiaire", en: "Intermediate" },
  advanced:     { fr: "Avancé",        en: "Advanced" },
  expert:       { fr: "Expert",        en: "Expert" },
};

// ── Skill axes ───────────────────────────────────────────────────────────────
// A "skill axis" is a sub-skill within a profession. For 3D Animator the
// axes are rig / timing / acting / unreal / maya / pipeline / lighting /
// storytelling. The engine tracks per-axis success to compute the
// specialization dimension and surface a radar viz at the end.

export interface SkillAxis {
  id: string;
  /** Canonical English label. */
  label: string;
  /** Canonical French label (used by default). */
  frLabel: string;
}

// ── Questions ────────────────────────────────────────────────────────────────

export interface QuestionOption {
  /** Stable id (typically "a" | "b" | "c" | "d"). Stored in attempts so we
   *  can audit which option a candidate picked even after question rewording. */
  id: string;
  text: string;
  /** True when this option is the correct answer. Exactly ONE option per
   *  question must be correct in v1 (single-answer MCQ). */
  correct: boolean;
  /** Optional one-liner shown in the post-question feedback. */
  explanation?: string;
}

export interface Question {
  id: string;
  professionId: string;
  axisId: string;
  difficulty: DifficultyLevel;
  /** Expected time-to-answer in seconds. Drives the timer ring AND the
   *  response-time anomaly detector (too-fast = lookup, too-slow = stuck). */
  expectedSeconds: number;
  /** The question prompt, written in French. */
  prompt: string;
  /** Optional code / data block displayed under the prompt. */
  code?: { language: string; content: string };
  /** 3 or 4 options. Exactly one correct. */
  options: QuestionOption[];
  /** Free-form tags for search & analytics ("sourdough", "react-hooks"). */
  tags?: string[];
}

// ── Attempts ─────────────────────────────────────────────────────────────────

export interface AnswerRecord {
  questionId: string;
  /** Selected option id. `null` when the candidate ran out of time / skipped. */
  optionId: string | null;
  /** Total milliseconds spent on the question (from display to commit). */
  durationMs: number;
  /** Resolved by the engine after the attempt completes. */
  correct: boolean;
  /** Anti-cheat signals captured client-side during the question display. */
  pasteCount: number;
  visibilityBreaks: number;
}

export interface Attempt {
  id: string;
  professionId: string;
  /** Talent slug or id, when the candidate is authenticated. Empty for
   *  anonymous demo attempts. */
  talentId: string;
  /** Years of experience the candidate declared BEFORE starting the attempt.
   *  Locked at attempt creation so they can't tune it mid-flight. Drives the
   *  experience-consistency dimension. */
  declaredYears: number;
  /** Question ids served, in display order. */
  questionIds: string[];
  /** One record per served question. Length matches questionIds when complete. */
  answers: AnswerRecord[];
  startedAt: number;   // epoch ms
  finishedAt: number | null;
  /** Random seed used to shuffle options + question order. Stored so the
   *  attempt is reproducible (and re-scoreable if rules change). */
  seed: string;
}

// ── Anti-cheat ───────────────────────────────────────────────────────────────

export type CheatFlagCode =
  | "too-fast"               // answered an expert Q faster than humanly possible
  | "too-slow"               // 5× expected time → likely looked it up
  | "paste"                  // pasted text into the question card
  | "visibility-loss"        // tabbed away during a question
  | "experience-mismatch"    // declared 10+ years but fails beginner questions
  | "expert-but-fails-basics" // aces hard Qs but bombs easy ones (lookup pattern)
  | "answer-variance";       // suspiciously uniform timing across all answers

export interface CheatFlag {
  code: CheatFlagCode;
  severity: "low" | "medium" | "high";
  /** Human-readable French detail for admin review. */
  detail: string;
}

/** Penalty deducted from the final score per flag, by severity. */
export const FLAG_PENALTY: Record<CheatFlag["severity"], number> = {
  low: 2,
  medium: 8,
  high: 20,
};

// ── Score breakdown ──────────────────────────────────────────────────────────

export interface ScoreBreakdown {
  /** Weighted % of correct answers, with harder questions worth more. */
  technical: number;
  /** Consistency between declared years and actual difficulty mastered.
   *  100 = perfect alignment, 0 = total mismatch (e.g. claims senior, fails basics). */
  experience: number;
  /** Stability of pace + answer quality across the attempt. */
  reliability: number;
  /** Depth of mastery in the candidate's strongest axes (avg of top 3). */
  specialization: number;
  /** Communication score — placeholder until free-text questions land. */
  communication: number;
  /** Overall coherence: cross-checks experience claim vs question performance
   *  and flags lookup-style patterns. */
  coherence: number;

  /** Final TalentRank score: weighted aggregate of the 6 dimensions minus
   *  the anti-cheat penalty. 0–100. */
  final: number;
  /** Sum of all flag penalties applied to `final`. */
  cheatPenalty: number;
  /** Suspicion flags raised during scoring. Surfaced to admins, hidden from
   *  recruiters until severity ≥ medium. */
  flags: CheatFlag[];

  /** Per-axis success rate (0–100). Used by the radar viz on the result page. */
  axisScores: Record<string, number>;

  /** Difficulty success rates (0–100). Drives the "you've mastered up to X"
   *  callout on the result page. */
  difficultyScores: Record<DifficultyLevel, number>;
}

// ── Dimension weighting ──────────────────────────────────────────────────────
// These weights sum to 1.0. They produce the final TalentRank score before
// the anti-cheat penalty is subtracted. Tuned for credibility: technical
// depth + specialization carry the most signal, communication least.

export const DIMENSION_WEIGHTS = {
  technical:      0.35,
  experience:     0.15,
  reliability:    0.15,
  specialization: 0.20,
  communication:  0.05,
  coherence:      0.10,
} as const satisfies Record<keyof Omit<ScoreBreakdown, "final" | "cheatPenalty" | "flags" | "axisScores" | "difficultyScores">, number>;

// ── Profession-bound bank ────────────────────────────────────────────────────

export interface QcmBank {
  professionId: string;
  /** Display name in French (mirrored from lib/professions.ts for ergonomics). */
  frLabel: string;
  axes: SkillAxis[];
  questions: Question[];
}

/** Per-profession assessment configuration. Same bank, different configs
 *  (e.g. junior config = more beginner Qs). v1 ships a single default config
 *  computed adaptively from declaredYears in lib/qcm/registry.ts. */
export interface AssessmentConfig {
  /** Total number of questions served. */
  totalQuestions: number;
  /** Target distribution across difficulties. The selector picks the closest
   *  match given the available bank. */
  difficultyMix: Record<DifficultyLevel, number>;
  /** Minimum number of distinct axes the served set must cover. */
  minAxesCoverage: number;
}
