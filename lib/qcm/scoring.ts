// TalentRank QCM scoring engine.
// ----------------------------------------------------------------------------
// Inputs: a completed Attempt + the question bank used.
// Output: a 6-dimensional ScoreBreakdown with a final TalentRank score.
//
// Design principles:
//  - Pure functions. No I/O, no React. Easy to unit-test, easy to re-score
//    historic attempts when the formula evolves (versioned by `SCORING_VERSION`).
//  - Final score is COMPRESSED toward 0 by anti-cheat flags. A confirmed
//    high-severity flag (e.g. paste detected) cuts the final by 20 points.
//  - Difficulty weights ensure a lucky beginner can't out-score a real expert.
//  - Specialization rewards depth: avg of the candidate's top 3 axes.
//
// SCORING_VERSION = the contract version stamped on each score. Bump when
// formula changes so historic scores can be invalidated/recomputed.

import { detectAllFlags } from "./anti-cheat";
import {
  DIFFICULTY_ORDER,
  DIFFICULTY_WEIGHT,
  DIMENSION_WEIGHTS,
  FLAG_PENALTY,
  type AnswerRecord,
  type Attempt,
  type CheatFlag,
  type DifficultyLevel,
  type Question,
  type ScoreBreakdown,
} from "./types";

export const SCORING_VERSION = "1.0.0";

// ── Public entry point ───────────────────────────────────────────────────────

export function scoreAttempt(attempt: Attempt, bank: Question[]): ScoreBreakdown {
  const questionMap = new Map(bank.map((q) => [q.id, q]));
  // Resolve correctness for each answer (the attempt stores the selected
  // optionId but not whether it was right — that's the engine's job).
  const resolvedAnswers = resolveCorrectness(attempt.answers, questionMap);

  const axisScores = computeAxisScores(resolvedAnswers, questionMap);
  const difficultyScores = computeDifficultyScores(resolvedAnswers, questionMap);
  const technical = computeTechnicalScore(resolvedAnswers, questionMap);
  const experience = computeExperienceScore(attempt.declaredYears, difficultyScores);
  const reliability = computeReliabilityScore(resolvedAnswers, questionMap);
  const specialization = computeSpecializationScore(axisScores);
  const communication = computeCommunicationPlaceholder();
  const coherence = computeCoherenceScore(attempt.declaredYears, difficultyScores);

  const flags = detectAllFlags({ ...attempt, answers: resolvedAnswers }, resolvedAnswers, bank);
  const cheatPenalty = computeCheatPenalty(flags);

  const weightedRaw =
    technical * DIMENSION_WEIGHTS.technical +
    experience * DIMENSION_WEIGHTS.experience +
    reliability * DIMENSION_WEIGHTS.reliability +
    specialization * DIMENSION_WEIGHTS.specialization +
    communication * DIMENSION_WEIGHTS.communication +
    coherence * DIMENSION_WEIGHTS.coherence;

  const final = clamp(weightedRaw - cheatPenalty, 0, 100);

  return {
    technical: round1(technical),
    experience: round1(experience),
    reliability: round1(reliability),
    specialization: round1(specialization),
    communication: round1(communication),
    coherence: round1(coherence),
    final: round1(final),
    cheatPenalty: round1(cheatPenalty),
    flags,
    axisScores: mapValues(axisScores, round1),
    difficultyScores: mapValues(difficultyScores, round1) as Record<DifficultyLevel, number>,
  };
}

// ── Resolve correctness ──────────────────────────────────────────────────────

function resolveCorrectness(
  answers: AnswerRecord[],
  questions: Map<string, Question>,
): AnswerRecord[] {
  return answers.map((a) => {
    if (a.optionId === null) return { ...a, correct: false };
    const q = questions.get(a.questionId);
    if (!q) return { ...a, correct: false };
    const opt = q.options.find((o) => o.id === a.optionId);
    return { ...a, correct: !!opt?.correct };
  });
}

// ── Technical score ──────────────────────────────────────────────────────────
// Weighted % correct. Each correct answer contributes its difficulty weight;
// total possible = sum of weights of served questions. Skipped = 0.

function computeTechnicalScore(answers: AnswerRecord[], questions: Map<string, Question>): number {
  let earned = 0;
  let possible = 0;
  for (const a of answers) {
    const q = questions.get(a.questionId);
    if (!q) continue;
    const w = DIFFICULTY_WEIGHT[q.difficulty];
    possible += w;
    if (a.correct) earned += w;
  }
  return possible === 0 ? 0 : (earned / possible) * 100;
}

// ── Per-difficulty success rate ──────────────────────────────────────────────

function computeDifficultyScores(
  answers: AnswerRecord[],
  questions: Map<string, Question>,
): Record<DifficultyLevel, number> {
  const totals: Record<DifficultyLevel, { ok: number; n: number }> = {
    beginner: { ok: 0, n: 0 },
    intermediate: { ok: 0, n: 0 },
    advanced: { ok: 0, n: 0 },
    expert: { ok: 0, n: 0 },
  };
  for (const a of answers) {
    const q = questions.get(a.questionId);
    if (!q) continue;
    totals[q.difficulty].n += 1;
    if (a.correct) totals[q.difficulty].ok += 1;
  }
  return {
    beginner: totals.beginner.n ? (totals.beginner.ok / totals.beginner.n) * 100 : 0,
    intermediate: totals.intermediate.n ? (totals.intermediate.ok / totals.intermediate.n) * 100 : 0,
    advanced: totals.advanced.n ? (totals.advanced.ok / totals.advanced.n) * 100 : 0,
    expert: totals.expert.n ? (totals.expert.ok / totals.expert.n) * 100 : 0,
  };
}

// ── Per-axis success rate ────────────────────────────────────────────────────

function computeAxisScores(
  answers: AnswerRecord[],
  questions: Map<string, Question>,
): Record<string, number> {
  const acc: Record<string, { ok: number; n: number }> = {};
  for (const a of answers) {
    const q = questions.get(a.questionId);
    if (!q) continue;
    if (!acc[q.axisId]) acc[q.axisId] = { ok: 0, n: 0 };
    acc[q.axisId].n += 1;
    if (a.correct) acc[q.axisId].ok += 1;
  }
  const out: Record<string, number> = {};
  for (const [axis, { ok, n }] of Object.entries(acc)) {
    out[axis] = n === 0 ? 0 : (ok / n) * 100;
  }
  return out;
}

// ── Experience consistency score ─────────────────────────────────────────────
// Expected success rate per difficulty grows with claimed years.
// We score the candidate by how well their actual rates match expectations.
// 100 = perfect alignment; 0 = wildly off.

interface ExpectedProfile {
  beginner: number;
  intermediate: number;
  advanced: number;
  expert: number;
}

function expectedProfileFor(years: number): ExpectedProfile {
  // Heuristic curves — tweak with data later. Returns expected success %.
  if (years < 4)  return { beginner: 70, intermediate: 40, advanced: 20, expert: 10 };
  if (years < 7)  return { beginner: 85, intermediate: 65, advanced: 40, expert: 20 };
  if (years < 10) return { beginner: 92, intermediate: 78, advanced: 60, expert: 40 };
  if (years < 15) return { beginner: 95, intermediate: 85, advanced: 75, expert: 55 };
  return            { beginner: 98, intermediate: 90, advanced: 82, expert: 70 };
}

function computeExperienceScore(
  declaredYears: number,
  difficultyScores: Record<DifficultyLevel, number>,
): number {
  const expected = expectedProfileFor(Math.max(0, declaredYears));
  // L1 distance, normalised — lower distance = higher score.
  // Each axis weighed equally; we punish under-performance harder than
  // over-performance (a junior who aces expert is suspicious — handled in
  // coherence, not here, so here we just take absolute distance).
  let totalDist = 0;
  let touched = 0;
  for (const d of DIFFICULTY_ORDER) {
    if (difficultyScores[d] > 0 || expected[d] > 0) {
      totalDist += Math.abs(difficultyScores[d] - expected[d]);
      touched += 1;
    }
  }
  if (touched === 0) return 50; // nothing to measure → neutral score
  const avgDist = totalDist / touched; // 0..100
  return clamp(100 - avgDist, 0, 100);
}

// ── Reliability score ────────────────────────────────────────────────────────
// Penalises:
//   - questions answered way slower than expected (slow = unreliable pace)
//   - questions skipped (optionId null)
//   - high variance in over-time questions

function computeReliabilityScore(
  answers: AnswerRecord[],
  questions: Map<string, Question>,
): number {
  if (answers.length === 0) return 50;
  let acc = 0;
  let touched = 0;
  let skips = 0;

  for (const a of answers) {
    if (a.optionId === null) {
      skips += 1;
      continue;
    }
    const q = questions.get(a.questionId);
    if (!q) continue;
    const expected = q.expectedSeconds * 1000;
    if (expected <= 0) continue;
    // Score per question: 100 when at or under expected, decaying to 0 at 3×
    const ratio = a.durationMs / expected;
    const score = ratio <= 1 ? 100 : Math.max(0, 100 - (ratio - 1) * 50);
    acc += score;
    touched += 1;
  }

  const paceScore = touched === 0 ? 50 : acc / touched;
  // Each skip subtracts 10 points.
  const skipPenalty = Math.min(40, skips * 10);
  return clamp(paceScore - skipPenalty, 0, 100);
}

// ── Specialization score ─────────────────────────────────────────────────────
// "Top 3 axes" mean — rewards candidates who go deep on what they know,
// instead of being mediocre everywhere. With < 3 axes touched we average all.

function computeSpecializationScore(axisScores: Record<string, number>): number {
  const values = Object.values(axisScores).filter((v) => Number.isFinite(v));
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => b - a);
  const n = Math.min(3, sorted.length);
  return sorted.slice(0, n).reduce((s, v) => s + v, 0) / n;
}

// ── Communication score (placeholder) ────────────────────────────────────────
// Will plug in once free-text questions ship (LLM-graded for clarity / depth).
// Returns a neutral 70 so v1 doesn't distort the final score.

function computeCommunicationPlaceholder(): number {
  return 70;
}

// ── Coherence score ──────────────────────────────────────────────────────────
// Cross-checks declared experience against the actual difficulty mastered.
// Penalises:
//   - declaring senior but failing basics
//   - acing expert but failing beginner (lookup pattern)
//   - non-monotonic success across difficulties (failed intermediate but passed expert)

function computeCoherenceScore(
  declaredYears: number,
  difficultyScores: Record<DifficultyLevel, number>,
): number {
  let penalty = 0;

  // Senior claim vs basics
  if (declaredYears >= 10 && difficultyScores.beginner < 60) {
    penalty += (60 - difficultyScores.beginner) * 0.8;
  }

  // Lookup pattern: expert ≫ beginner
  if (
    difficultyScores.expert > 70 &&
    difficultyScores.beginner < 50 &&
    difficultyScores.beginner > 0
  ) {
    penalty += (difficultyScores.expert - difficultyScores.beginner) * 0.5;
  }

  // Non-monotonic (expert higher than intermediate by more than 30)
  if (difficultyScores.expert - difficultyScores.intermediate > 30) {
    penalty += 15;
  }

  return clamp(100 - penalty, 0, 100);
}

// ── Anti-cheat penalty ───────────────────────────────────────────────────────

function computeCheatPenalty(flags: CheatFlag[]): number {
  let total = 0;
  for (const f of flags) total += FLAG_PENALTY[f.severity];
  // Cap at 60 — even with everything tripped, the score stays auditable.
  return Math.min(60, total);
}

// ── Utility ──────────────────────────────────────────────────────────────────

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function mapValues<K extends string, V>(obj: Record<K, V>, fn: (v: V) => V): Record<K, V> {
  const out = {} as Record<K, V>;
  for (const k of Object.keys(obj) as K[]) out[k] = fn(obj[k]);
  return out;
}
