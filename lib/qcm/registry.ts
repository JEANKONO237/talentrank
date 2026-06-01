// QCM registry — maps professionId → bank + adaptive question selection.
// ----------------------------------------------------------------------------
// Adding a new profession-specific QCM:
//   1. Author lib/qcm/questions/<professionId>.ts exporting a QcmBank.
//   2. Register it below in BANKS.
//   3. Done — /qcm/<professionId> automatically lights up.

import { ANIMATION_3D_BANK } from "./questions/animation-3d";
import { BAKER_BANK } from "./questions/baker";
import { FRONTEND_ENGINEER_BANK } from "./questions/frontend-engineer";
import {
  type AssessmentConfig,
  type DifficultyLevel,
  type QcmBank,
  type Question,
} from "./types";

// ── Bank registry ────────────────────────────────────────────────────────────

const BANKS: QcmBank[] = [
  ANIMATION_3D_BANK,
  FRONTEND_ENGINEER_BANK,
  BAKER_BANK,
];

const BANK_BY_ID = new Map(BANKS.map((b) => [b.professionId, b]));

export function getBank(professionId: string): QcmBank | null {
  return BANK_BY_ID.get(professionId) ?? null;
}

export function hasBank(professionId: string): boolean {
  return BANK_BY_ID.has(professionId);
}

export function listBanks(): QcmBank[] {
  return BANKS;
}

// ── Adaptive assessment config ───────────────────────────────────────────────
// Tunes the difficulty mix to the candidate's declared experience. A junior
// gets mostly beginner/intermediate (still gets exposure to advanced for
// signal); a senior is challenged on advanced/expert. Coverage requirement
// is always 4 axes minimum so specialization is meaningful.

export function configForYears(years: number): AssessmentConfig {
  const clampedYears = Math.max(0, years);
  if (clampedYears < 4) {
    return {
      totalQuestions: 10,
      difficultyMix: { beginner: 4, intermediate: 4, advanced: 2, expert: 0 },
      minAxesCoverage: 4,
    };
  }
  if (clampedYears < 7) {
    return {
      totalQuestions: 11,
      difficultyMix: { beginner: 2, intermediate: 4, advanced: 4, expert: 1 },
      minAxesCoverage: 4,
    };
  }
  if (clampedYears < 10) {
    return {
      totalQuestions: 12,
      difficultyMix: { beginner: 2, intermediate: 3, advanced: 5, expert: 2 },
      minAxesCoverage: 5,
    };
  }
  // 10+
  return {
    totalQuestions: 12,
    difficultyMix: { beginner: 2, intermediate: 3, advanced: 4, expert: 3 },
    minAxesCoverage: 5,
  };
}

// ── Selection algorithm ──────────────────────────────────────────────────────
// Deterministic given a seed (so an attempt is reproducible). Picks N
// questions matching the difficulty mix as closely as possible while
// maximizing axis coverage.

export interface SelectionInput {
  bank: QcmBank;
  config: AssessmentConfig;
  /** Seed for reproducible shuffling. */
  seed: string;
}

export function selectQuestions(input: SelectionInput): Question[] {
  const { bank, config, seed } = input;
  const rng = mulberry32(stringToSeed(seed));

  const byDifficulty: Record<DifficultyLevel, Question[]> = {
    beginner: [],
    intermediate: [],
    advanced: [],
    expert: [],
  };
  for (const q of bank.questions) byDifficulty[q.difficulty].push(q);

  // Shuffle each pool with the seeded RNG so two attempts with the same seed
  // get the same order.
  for (const k of Object.keys(byDifficulty) as DifficultyLevel[]) {
    shuffleInPlace(byDifficulty[k], rng);
  }

  // Pick the target count per difficulty, falling back to neighbouring
  // difficulties when the pool is too small.
  const out: Question[] = [];
  const wanted: Record<DifficultyLevel, number> = { ...config.difficultyMix };

  const pickFrom = (d: DifficultyLevel, n: number): number => {
    const pool = byDifficulty[d];
    const take = Math.min(n, pool.length);
    out.push(...pool.splice(0, take));
    return take;
  };

  const order: DifficultyLevel[] = ["expert", "advanced", "intermediate", "beginner"];
  for (const d of order) {
    const taken = pickFrom(d, wanted[d]);
    wanted[d] -= taken;
  }

  // Fallbacks — if expert pool was thin, top up with advanced; if advanced
  // thin, top up with intermediate, etc.
  const fallbacks: [DifficultyLevel, DifficultyLevel][] = [
    ["expert", "advanced"],
    ["advanced", "intermediate"],
    ["intermediate", "beginner"],
    ["beginner", "intermediate"],
  ];
  for (const [missing, next] of fallbacks) {
    if (wanted[missing] > 0) {
      const taken = pickFrom(next, wanted[missing]);
      wanted[missing] -= taken;
    }
  }

  // Ensure axis coverage — if too few axes touched, swap in questions from
  // missing axes (taken from remaining pools).
  const axesTouched = new Set(out.map((q) => q.axisId));
  if (axesTouched.size < config.minAxesCoverage) {
    const remainingAll = [
      ...byDifficulty.beginner,
      ...byDifficulty.intermediate,
      ...byDifficulty.advanced,
      ...byDifficulty.expert,
    ];
    const missingAxes = new Set<string>();
    for (const a of bank.axes) if (!axesTouched.has(a.id)) missingAxes.add(a.id);
    for (const q of remainingAll) {
      if (axesTouched.size >= config.minAxesCoverage) break;
      if (missingAxes.has(q.axisId)) {
        out.push(q);
        axesTouched.add(q.axisId);
      }
    }
  }

  // Final shuffle so the difficulty doesn't strictly ramp.
  shuffleInPlace(out, rng);
  return out.slice(0, config.totalQuestions);
}

/** Shuffle the option order for a question using the same seed family.
 *  Returns a NEW question with shuffled options (original is untouched). */
export function shuffleOptions(q: Question, seed: string): Question {
  const rng = mulberry32(stringToSeed(`${seed}|${q.id}`));
  return { ...q, options: shuffleInPlace([...q.options], rng) };
}

// ── Deterministic PRNG (Mulberry32) ─────────────────────────────────────────

function stringToSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h || 1;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleInPlace<T>(arr: T[], rng: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Convenience to seed a fresh attempt — combines timestamp + random. */
export function makeSeed(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
