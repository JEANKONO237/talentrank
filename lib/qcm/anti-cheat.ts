// Anti-cheat heuristics for the TalentRank QCM engine.
// ----------------------------------------------------------------------------
// All helpers are pure: given an attempt + bank, they return a list of flags.
// The flags are then converted into a penalty by `scoreAttempt()`.
//
// We deliberately keep the heuristics readable and conservative — false
// positives erode trust, so we prefer "medium" severity over "high" unless
// the signal is unambiguous (e.g. answered in 200ms on an expert question).

import {
  type AnswerRecord,
  type Attempt,
  type CheatFlag,
  type DifficultyLevel,
  type Question,
} from "./types";

type QuestionMap = Map<string, Question>;

// ── Per-question timing anomalies ────────────────────────────────────────────

/** Ratio of actual time to expected time below which we consider "too fast". */
const TOO_FAST_RATIO = 0.18;
/** Ratio above which we consider "too slow" (likely looked up the answer). */
const TOO_SLOW_RATIO = 5.0;
/** Absolute floor: anything answered in less than 1.2 seconds is suspicious
 *  regardless of difficulty (reading + decision time). */
const ABSOLUTE_MIN_MS = 1200;

export function detectTimingFlags(
  answers: AnswerRecord[],
  questions: QuestionMap,
): CheatFlag[] {
  const flags: CheatFlag[] = [];

  for (const ans of answers) {
    const q = questions.get(ans.questionId);
    if (!q || ans.optionId === null) continue; // skipped questions don't count

    const expectedMs = q.expectedSeconds * 1000;
    const ratio = ans.durationMs / expectedMs;

    if (ans.durationMs < ABSOLUTE_MIN_MS && ans.correct) {
      flags.push({
        code: "too-fast",
        severity: q.difficulty === "expert" ? "high" : "medium",
        detail: `Question ${q.id} répondue en ${(ans.durationMs / 1000).toFixed(1)}s — sous le seuil humain de lecture.`,
      });
      continue;
    }

    if (ratio < TOO_FAST_RATIO && (q.difficulty === "advanced" || q.difficulty === "expert")) {
      flags.push({
        code: "too-fast",
        severity: "medium",
        detail: `Question ${q.id} (${q.difficulty}) répondue en ${(ratio * 100).toFixed(0)}% du temps attendu.`,
      });
    }

    if (ratio > TOO_SLOW_RATIO) {
      flags.push({
        code: "too-slow",
        severity: "low",
        detail: `Question ${q.id} a pris ${(ans.durationMs / 1000).toFixed(0)}s (attendu ${q.expectedSeconds}s) — recherche externe probable.`,
      });
    }
  }

  return flags;
}

// ── Browser-side anti-cheat signals (paste, tab switch) ──────────────────────

export function detectBrowserSignalFlags(answers: AnswerRecord[]): CheatFlag[] {
  const flags: CheatFlag[] = [];

  const totalPastes = answers.reduce((sum, a) => sum + a.pasteCount, 0);
  if (totalPastes > 0) {
    flags.push({
      code: "paste",
      severity: totalPastes >= 3 ? "high" : "medium",
      detail: `${totalPastes} événement${totalPastes > 1 ? "s" : ""} de collage détecté${totalPastes > 1 ? "s" : ""} dans la zone de question.`,
    });
  }

  const totalBreaks = answers.reduce((sum, a) => sum + a.visibilityBreaks, 0);
  if (totalBreaks >= 2) {
    flags.push({
      code: "visibility-loss",
      severity: totalBreaks >= 5 ? "high" : "medium",
      detail: `${totalBreaks} changement${totalBreaks > 1 ? "s" : ""} d'onglet pendant l'évaluation.`,
    });
  }

  return flags;
}

// ── Experience consistency (vs declared years) ───────────────────────────────

/** Returns true when the candidate's success rate at a given difficulty is
 *  inconsistent with their declared experience. */
export function detectExperienceMismatch(
  attempt: Attempt,
  answers: AnswerRecord[],
  questions: QuestionMap,
): CheatFlag[] {
  const flags: CheatFlag[] = [];
  if (attempt.declaredYears < 0) return flags;

  const byDifficulty = groupByDifficulty(answers, questions);

  // Senior+ claim (10+ years) → should ace beginner questions.
  if (attempt.declaredYears >= 10) {
    const beg = byDifficulty.beginner;
    if (beg.total >= 2 && beg.successRate < 0.6) {
      flags.push({
        code: "experience-mismatch",
        severity: "high",
        detail: `Profil sénior (${attempt.declaredYears} ans) mais ${Math.round(beg.successRate * 100)}% de réussite sur les bases.`,
      });
    }
  }

  // Mid claim (4-9 years) → expected to pass intermediate decently.
  if (attempt.declaredYears >= 4 && attempt.declaredYears < 10) {
    const inter = byDifficulty.intermediate;
    if (inter.total >= 2 && inter.successRate < 0.4) {
      flags.push({
        code: "experience-mismatch",
        severity: "medium",
        detail: `Profil ${attempt.declaredYears} ans annoncés mais seulement ${Math.round(inter.successRate * 100)}% en niveau intermédiaire.`,
      });
    }
  }

  return flags;
}

/** Lookup pattern detector: someone Googling answers does well on hard
 *  questions (they know exactly what to search) but trips on basic ones
 *  because they think them through. Trips when expert > 70% but beginner < 50%. */
export function detectLookupPattern(
  answers: AnswerRecord[],
  questions: QuestionMap,
): CheatFlag[] {
  const flags: CheatFlag[] = [];
  const byDifficulty = groupByDifficulty(answers, questions);

  if (
    byDifficulty.expert.total >= 1 &&
    byDifficulty.beginner.total >= 2 &&
    byDifficulty.expert.successRate >= 0.7 &&
    byDifficulty.beginner.successRate < 0.5
  ) {
    flags.push({
      code: "expert-but-fails-basics",
      severity: "high",
      detail: `Réussite expert ${Math.round(byDifficulty.expert.successRate * 100)}% mais débutant ${Math.round(byDifficulty.beginner.successRate * 100)}% — schéma de recherche externe probable.`,
    });
  }

  return flags;
}

// ── Variance / robot timing detector ─────────────────────────────────────────

/** Humans vary. If every answer takes 3.10s ± 0.05s, something is off
 *  (script, bot, or copy from a friend reading aloud). Trips when the
 *  coefficient of variation < 0.10 across ≥ 6 answered questions. */
export function detectAnswerVariance(answers: AnswerRecord[]): CheatFlag[] {
  const sample = answers.filter((a) => a.optionId !== null && a.durationMs > 0);
  if (sample.length < 6) return [];

  const mean = sample.reduce((s, a) => s + a.durationMs, 0) / sample.length;
  if (mean <= 0) return [];
  const variance =
    sample.reduce((s, a) => s + Math.pow(a.durationMs - mean, 2), 0) / sample.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean;

  if (cv < 0.10) {
    return [
      {
        code: "answer-variance",
        severity: "medium",
        detail: `Variation du temps de réponse anormalement faible (CV=${cv.toFixed(3)}) sur ${sample.length} questions.`,
      },
    ];
  }
  return [];
}

// ── Aggregator ───────────────────────────────────────────────────────────────

export function detectAllFlags(
  attempt: Attempt,
  answers: AnswerRecord[],
  questions: Question[],
): CheatFlag[] {
  const map: QuestionMap = new Map(questions.map((q) => [q.id, q]));
  return [
    ...detectTimingFlags(answers, map),
    ...detectBrowserSignalFlags(answers),
    ...detectExperienceMismatch(attempt, answers, map),
    ...detectLookupPattern(answers, map),
    ...detectAnswerVariance(answers),
  ];
}

// ── Internals ────────────────────────────────────────────────────────────────

function groupByDifficulty(
  answers: AnswerRecord[],
  questions: QuestionMap,
): Record<DifficultyLevel, { total: number; correct: number; successRate: number }> {
  const init = () => ({ total: 0, correct: 0, successRate: 0 });
  const buckets: Record<DifficultyLevel, { total: number; correct: number; successRate: number }> = {
    beginner: init(),
    intermediate: init(),
    advanced: init(),
    expert: init(),
  };
  for (const ans of answers) {
    if (ans.optionId === null) continue;
    const q = questions.get(ans.questionId);
    if (!q) continue;
    const b = buckets[q.difficulty];
    b.total += 1;
    if (ans.correct) b.correct += 1;
  }
  for (const k of Object.keys(buckets) as DifficultyLevel[]) {
    const b = buckets[k];
    b.successRate = b.total > 0 ? b.correct / b.total : 0;
  }
  return buckets;
}
