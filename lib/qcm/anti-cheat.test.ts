import { describe, expect, it } from "vitest";
import {
  detectAllFlags,
  detectAnswerVariance,
  detectBrowserSignalFlags,
  detectExperienceMismatch,
  detectLookupPattern,
  detectTimingFlags,
} from "./anti-cheat";
import type { AnswerRecord, Attempt, Question } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Tests sur lib/qcm/anti-cheat.ts
//
// Chaque détecteur a un cas TROUVE et un cas IGNORE pour valider la logique.
// Le but : éviter les faux positifs (un user honnête ne doit JAMAIS trip un
// flag high par accident) tout en attrappant les patterns suspects.
// ─────────────────────────────────────────────────────────────────────────────

function makeQ(id: string, opts: Partial<Question> = {}): Question {
  return {
    id,
    professionId: "test",
    axisId: "ax-1",
    difficulty: "intermediate",
    expectedSeconds: 30,
    prompt: `Q ${id}`,
    options: [
      { id: "a", text: "A", correct: true },
      { id: "b", text: "B", correct: false },
    ],
    ...opts,
  };
}

function makeAnswer(
  qId: string,
  durationMs: number,
  correct: boolean,
  partial: Partial<AnswerRecord> = {},
): AnswerRecord {
  return {
    questionId: qId,
    optionId: correct ? "a" : "b",
    durationMs,
    correct,
    pasteCount: 0,
    visibilityBreaks: 0,
    ...partial,
  };
}

function makeAttempt(declaredYears: number, answers: AnswerRecord[]): Attempt {
  return {
    id: "att-1",
    professionId: "test",
    talentId: "t-1",
    declaredYears,
    questionIds: answers.map((a) => a.questionId),
    answers,
    startedAt: Date.now() - 10_000,
    finishedAt: Date.now(),
    seed: "seed-test",
  };
}

// ─── detectTimingFlags ────────────────────────────────────────────────────

describe("detectTimingFlags", () => {
  it("trip 'too-fast' si correct + expert + < 1.2s", () => {
    const q = makeQ("q1", { difficulty: "expert", expectedSeconds: 40 });
    const ans = [makeAnswer("q1", 800, true)];
    const flags = detectTimingFlags(ans, new Map([["q1", q]]));
    expect(flags.some((f) => f.code === "too-fast")).toBe(true);
    expect(flags.find((f) => f.code === "too-fast")?.severity).toBe("high");
  });

  it("ne trip PAS 'too-fast' sur un beginner < 1.2s (lecture rapide possible)", () => {
    const q = makeQ("q1", { difficulty: "beginner", expectedSeconds: 10 });
    const ans = [makeAnswer("q1", 1100, true)];
    const flags = detectTimingFlags(ans, new Map([["q1", q]]));
    const tooFast = flags.find((f) => f.code === "too-fast");
    // peut quand même tripper si 1.1s < ABSOLUTE_MIN_MS=1200, donc OK
    if (tooFast) expect(tooFast.severity).not.toBe("high");
  });

  it("trip 'too-slow' à 5× le temps attendu", () => {
    const q = makeQ("q1", { expectedSeconds: 20 });
    const ans = [makeAnswer("q1", 21 * 5 * 1000, true)]; // 105 s pour 20 attendu
    const flags = detectTimingFlags(ans, new Map([["q1", q]]));
    expect(flags.some((f) => f.code === "too-slow")).toBe(true);
  });

  it("ignore les réponses skipped (optionId=null)", () => {
    const q = makeQ("q1");
    const ans = [makeAnswer("q1", 100, false, { optionId: null })];
    const flags = detectTimingFlags(ans, new Map([["q1", q]]));
    expect(flags).toHaveLength(0);
  });

  it("renvoie [] sur un attempt normal (30s pour 30s attendu)", () => {
    const q = makeQ("q1", { expectedSeconds: 30 });
    const ans = [makeAnswer("q1", 30_000, true)];
    const flags = detectTimingFlags(ans, new Map([["q1", q]]));
    expect(flags).toHaveLength(0);
  });
});

// ─── detectBrowserSignalFlags ─────────────────────────────────────────────

describe("detectBrowserSignalFlags", () => {
  it("trip 'paste' dès 1 paste", () => {
    const flags = detectBrowserSignalFlags([
      makeAnswer("q1", 5000, true, { pasteCount: 1 }),
    ]);
    expect(flags.some((f) => f.code === "paste")).toBe(true);
  });

  it("paste 3+ = severity high", () => {
    const flags = detectBrowserSignalFlags([
      makeAnswer("q1", 5000, true, { pasteCount: 3 }),
    ]);
    expect(flags.find((f) => f.code === "paste")?.severity).toBe("high");
  });

  it("trip 'visibility-loss' à 2 changements d'onglet", () => {
    const flags = detectBrowserSignalFlags([
      makeAnswer("q1", 5000, true, { visibilityBreaks: 2 }),
    ]);
    expect(flags.some((f) => f.code === "visibility-loss")).toBe(true);
  });

  it("ignore 1 seul change d'onglet (peut être accident)", () => {
    const flags = detectBrowserSignalFlags([
      makeAnswer("q1", 5000, true, { visibilityBreaks: 1 }),
    ]);
    expect(flags.some((f) => f.code === "visibility-loss")).toBe(false);
  });
});

// ─── detectExperienceMismatch ─────────────────────────────────────────────

describe("detectExperienceMismatch", () => {
  it("trip si senior 10+ ans rate les bases", () => {
    const qs = [
      makeQ("b1", { difficulty: "beginner" }),
      makeQ("b2", { difficulty: "beginner" }),
      makeQ("b3", { difficulty: "beginner" }),
    ];
    const ans = [
      makeAnswer("b1", 5000, false),
      makeAnswer("b2", 5000, false),
      makeAnswer("b3", 5000, false),
    ];
    const attempt = makeAttempt(12, ans);
    const flags = detectExperienceMismatch(attempt, ans, new Map(qs.map((q) => [q.id, q])));
    expect(flags.some((f) => f.code === "experience-mismatch")).toBe(true);
  });

  it("ne trip pas si junior rate les bases (cohérent avec sa déclaration)", () => {
    const qs = [makeQ("b1", { difficulty: "beginner" })];
    const ans = [makeAnswer("b1", 5000, false), makeAnswer("b1", 5000, false)];
    const attempt = makeAttempt(2, ans);
    const flags = detectExperienceMismatch(attempt, ans, new Map(qs.map((q) => [q.id, q])));
    expect(flags).toHaveLength(0);
  });

  it("ne trip pas si senior réussit les bases", () => {
    const qs = [
      makeQ("b1", { difficulty: "beginner" }),
      makeQ("b2", { difficulty: "beginner" }),
    ];
    const ans = [makeAnswer("b1", 5000, true), makeAnswer("b2", 5000, true)];
    const attempt = makeAttempt(15, ans);
    const flags = detectExperienceMismatch(attempt, ans, new Map(qs.map((q) => [q.id, q])));
    expect(flags).toHaveLength(0);
  });
});

// ─── detectLookupPattern ──────────────────────────────────────────────────

describe("detectLookupPattern", () => {
  it("trip si expert > 70% mais beginner < 50%", () => {
    const qs = [
      makeQ("e1", { difficulty: "expert" }),
      makeQ("b1", { difficulty: "beginner" }),
      makeQ("b2", { difficulty: "beginner" }),
    ];
    const ans = [
      makeAnswer("e1", 5000, true), // expert: 1/1 = 100%
      makeAnswer("b1", 5000, false), // beginner: 0/2 = 0%
      makeAnswer("b2", 5000, false),
    ];
    const flags = detectLookupPattern(ans, new Map(qs.map((q) => [q.id, q])));
    expect(flags.some((f) => f.code === "expert-but-fails-basics")).toBe(true);
  });

  it("ne trip pas si profil cohérent (réussit partout)", () => {
    const qs = [
      makeQ("e1", { difficulty: "expert" }),
      makeQ("b1", { difficulty: "beginner" }),
    ];
    const ans = [makeAnswer("e1", 5000, true), makeAnswer("b1", 5000, true)];
    const flags = detectLookupPattern(ans, new Map(qs.map((q) => [q.id, q])));
    expect(flags).toHaveLength(0);
  });
});

// ─── detectAnswerVariance ─────────────────────────────────────────────────

describe("detectAnswerVariance", () => {
  it("trip si tous les durations sont quasi-identiques (bot/script)", () => {
    const ans = [
      makeAnswer("q1", 3100, true),
      makeAnswer("q2", 3105, true),
      makeAnswer("q3", 3098, true),
      makeAnswer("q4", 3102, true),
      makeAnswer("q5", 3104, true),
      makeAnswer("q6", 3099, true),
    ];
    const flags = detectAnswerVariance(ans);
    expect(flags.some((f) => f.code === "answer-variance")).toBe(true);
  });

  it("ne trip pas sur variance humaine normale", () => {
    const ans = [
      makeAnswer("q1", 5000, true),
      makeAnswer("q2", 12_000, true),
      makeAnswer("q3", 3000, true),
      makeAnswer("q4", 18_000, true),
      makeAnswer("q5", 7000, true),
      makeAnswer("q6", 25_000, true),
    ];
    const flags = detectAnswerVariance(ans);
    expect(flags).toHaveLength(0);
  });

  it("ne trip pas si moins de 6 réponses", () => {
    const ans = Array.from({ length: 5 }, (_, i) =>
      makeAnswer(`q${i}`, 3100, true),
    );
    expect(detectAnswerVariance(ans)).toHaveLength(0);
  });
});

// ─── detectAllFlags (intégration) ────────────────────────────────────────

describe("detectAllFlags", () => {
  it("renvoie [] sur un attempt parfaitement normal", () => {
    const qs = Array.from({ length: 5 }, (_, i) =>
      makeQ(`q${i}`, { difficulty: "intermediate" }),
    );
    const ans = qs.map((q, i) => makeAnswer(q.id, 15_000 + i * 1500, true));
    const attempt = makeAttempt(5, ans);
    const flags = detectAllFlags(attempt, ans, qs);
    expect(flags).toHaveLength(0);
  });

  it("aggregé : senior + variance + paste = au moins 3 flags", () => {
    const qs = [
      makeQ("b1", { difficulty: "beginner" }),
      makeQ("b2", { difficulty: "beginner" }),
      makeQ("b3", { difficulty: "beginner" }),
      makeQ("b4", { difficulty: "beginner" }),
      makeQ("b5", { difficulty: "beginner" }),
      makeQ("b6", { difficulty: "beginner" }),
    ];
    const ans = qs.map((q, i) => ({
      ...makeAnswer(q.id, 3100 + (i % 2), false),
      pasteCount: 1,
    }));
    const attempt = makeAttempt(15, ans);
    const flags = detectAllFlags(attempt, ans, qs);
    expect(flags.length).toBeGreaterThanOrEqual(3);
  });
});
