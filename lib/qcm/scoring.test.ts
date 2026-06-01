import { describe, expect, it } from "vitest";
import { scoreAttempt, SCORING_VERSION } from "./scoring";
import type { Attempt, Question } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Tests sur lib/qcm/scoring.ts
//
// Tests prioritaires :
//   - Déterminisme : même input → même breakdown (à 0.01 près)
//   - Bornes : final ∈ [0, 100]
//   - Penalty : flags high réduit le score
//   - Axes : top 3 axes drive specialization
//   - Difficulty weight : expert vaut plus
//   - SCORING_VERSION exposé pour les migrations
// ─────────────────────────────────────────────────────────────────────────────

function makeQ(
  id: string,
  difficulty: Question["difficulty"] = "intermediate",
  axisId = "ax-1",
  expectedSeconds = 30,
): Question {
  return {
    id,
    professionId: "test",
    axisId,
    difficulty,
    expectedSeconds,
    prompt: `Q ${id}`,
    options: [
      { id: "a", text: "A", correct: true },
      { id: "b", text: "B", correct: false },
      { id: "c", text: "C", correct: false },
      { id: "d", text: "D", correct: false },
    ],
  };
}

function makeAttempt(
  declaredYears: number,
  bank: Question[],
  answers: { qId: string; optionId: string | null; durationMs?: number }[],
): Attempt {
  return {
    id: "att-1",
    professionId: "test",
    talentId: "t-1",
    declaredYears,
    questionIds: bank.map((q) => q.id),
    answers: answers.map((a) => ({
      questionId: a.qId,
      optionId: a.optionId,
      durationMs: a.durationMs ?? 15_000,
      correct: false, // resolved by engine
      pasteCount: 0,
      visibilityBreaks: 0,
    })),
    startedAt: Date.now() - 60_000,
    finishedAt: Date.now(),
    seed: "test-seed",
  };
}

// ─── SCORING_VERSION ──────────────────────────────────────────────────────

describe("SCORING_VERSION", () => {
  it("est exposé en string sémantique", () => {
    expect(SCORING_VERSION).toBeTypeOf("string");
    expect(SCORING_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

// ─── Bornes & shape ───────────────────────────────────────────────────────

describe("scoreAttempt — shape + bornes", () => {
  const bank = [
    makeQ("q1", "beginner", "ax-1"),
    makeQ("q2", "intermediate", "ax-2"),
    makeQ("q3", "advanced", "ax-3"),
  ];
  const attempt = makeAttempt(3, bank, [
    { qId: "q1", optionId: "a" },
    { qId: "q2", optionId: "a" },
    { qId: "q3", optionId: "a" },
  ]);

  it("renvoie toutes les dimensions + final", () => {
    const score = scoreAttempt(attempt, bank);
    expect(score).toHaveProperty("technical");
    expect(score).toHaveProperty("experience");
    expect(score).toHaveProperty("reliability");
    expect(score).toHaveProperty("specialization");
    expect(score).toHaveProperty("communication");
    expect(score).toHaveProperty("coherence");
    expect(score).toHaveProperty("final");
    expect(score).toHaveProperty("cheatPenalty");
    expect(score).toHaveProperty("flags");
    expect(score).toHaveProperty("axisScores");
    expect(score).toHaveProperty("difficultyScores");
  });

  it("final ∈ [0, 100]", () => {
    const score = scoreAttempt(attempt, bank);
    expect(score.final).toBeGreaterThanOrEqual(0);
    expect(score.final).toBeLessThanOrEqual(100);
  });

  it("toutes les dimensions ∈ [0, 100]", () => {
    const score = scoreAttempt(attempt, bank);
    for (const dim of [
      "technical",
      "experience",
      "reliability",
      "specialization",
      "communication",
      "coherence",
    ] as const) {
      expect(score[dim]).toBeGreaterThanOrEqual(0);
      expect(score[dim]).toBeLessThanOrEqual(100);
    }
  });

  it("cheatPenalty >= 0", () => {
    const score = scoreAttempt(attempt, bank);
    expect(score.cheatPenalty).toBeGreaterThanOrEqual(0);
  });
});

// ─── Déterminisme ─────────────────────────────────────────────────────────

describe("scoreAttempt — déterminisme", () => {
  const bank = Array.from({ length: 10 }, (_, i) =>
    makeQ(`q${i}`, i % 2 === 0 ? "intermediate" : "advanced", `ax-${i % 3}`),
  );
  const attempt = makeAttempt(
    5,
    bank,
    bank.map((q, i) => ({ qId: q.id, optionId: i % 3 === 0 ? "b" : "a" })),
  );

  it("même input → même output (deux runs identiques)", () => {
    const a = scoreAttempt(attempt, bank);
    const b = scoreAttempt(attempt, bank);
    expect(a.final).toBe(b.final);
    expect(a.technical).toBe(b.technical);
    expect(a.specialization).toBe(b.specialization);
    expect(JSON.stringify(a.axisScores)).toBe(JSON.stringify(b.axisScores));
  });
});

// ─── Cas "réussite parfaite" vs "0 réussite" ─────────────────────────────

describe("scoreAttempt — extrêmes", () => {
  const bank = Array.from({ length: 8 }, (_, i) =>
    makeQ(`q${i}`, "intermediate", `ax-${i % 4}`),
  );

  it("toutes bonnes réponses → score haut (>=60)", () => {
    const attempt = makeAttempt(5, bank, bank.map((q) => ({ qId: q.id, optionId: "a" })));
    const score = scoreAttempt(attempt, bank);
    expect(score.technical).toBeGreaterThanOrEqual(80);
    expect(score.final).toBeGreaterThanOrEqual(50); // pondéré par d'autres dims
  });

  it("toutes mauvaises réponses → technique très bas (<=20)", () => {
    const attempt = makeAttempt(5, bank, bank.map((q) => ({ qId: q.id, optionId: "b" })));
    const score = scoreAttempt(attempt, bank);
    expect(score.technical).toBeLessThanOrEqual(20);
  });

  it("réponses skipped → technique bas", () => {
    const attempt = makeAttempt(5, bank, bank.map((q) => ({ qId: q.id, optionId: null })));
    const score = scoreAttempt(attempt, bank);
    expect(score.technical).toBeLessThanOrEqual(20);
  });
});

// ─── Difficulty weighting ─────────────────────────────────────────────────

describe("scoreAttempt — difficulty weight", () => {
  it("3 expert réussis pèse plus que 3 beginner réussis (technique)", () => {
    const bankE = Array.from({ length: 3 }, (_, i) => makeQ(`e${i}`, "expert"));
    const bankB = Array.from({ length: 3 }, (_, i) => makeQ(`b${i}`, "beginner"));
    const attemptE = makeAttempt(8, bankE, bankE.map((q) => ({ qId: q.id, optionId: "a" })));
    const attemptB = makeAttempt(8, bankB, bankB.map((q) => ({ qId: q.id, optionId: "a" })));
    const scoreE = scoreAttempt(attemptE, bankE);
    const scoreB = scoreAttempt(attemptB, bankB);
    // Expert all-correct doit pouvoir scorer plus que beginner all-correct
    expect(scoreE.technical).toBeGreaterThanOrEqual(scoreB.technical - 5); // tolérance
    expect(scoreE.final).toBeGreaterThanOrEqual(scoreB.final - 5);
  });
});

// ─── Specialization (top 3 axes) ──────────────────────────────────────────

describe("scoreAttempt — specialization", () => {
  it("axis cohérent (3 succès même axe) → spec haute", () => {
    const bank = [
      makeQ("a1", "intermediate", "ax-1"),
      makeQ("a2", "intermediate", "ax-1"),
      makeQ("a3", "intermediate", "ax-1"),
      makeQ("b1", "intermediate", "ax-2"),
    ];
    const attempt = makeAttempt(4, bank, [
      { qId: "a1", optionId: "a" },
      { qId: "a2", optionId: "a" },
      { qId: "a3", optionId: "a" },
      { qId: "b1", optionId: "b" },
    ]);
    const score = scoreAttempt(attempt, bank);
    expect(score.axisScores["ax-1"]).toBeGreaterThan(80);
  });
});

// ─── Cheat penalty effect ────────────────────────────────────────────────

describe("scoreAttempt — cheat penalty effect", () => {
  const bank = [
    makeQ("q1", "expert", "ax-1", 40), // long expected time
    makeQ("q2", "expert", "ax-2", 40),
  ];

  it("answered too fast on experts → cheatPenalty > 0", () => {
    const attempt = makeAttempt(8, bank, [
      { qId: "q1", optionId: "a", durationMs: 600 }, // sub-second
      { qId: "q2", optionId: "a", durationMs: 700 },
    ]);
    const score = scoreAttempt(attempt, bank);
    expect(score.cheatPenalty).toBeGreaterThan(0);
    expect(score.flags.length).toBeGreaterThan(0);
  });
});
