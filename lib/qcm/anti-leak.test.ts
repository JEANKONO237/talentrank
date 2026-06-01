import { describe, expect, it } from "vitest";
import {
  applyAntiLeak,
  orderHash,
  pickMode,
  tooSimilar,
  weightedSample,
  type ExposureRecord,
} from "./anti-leak";
import type { Question } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Tests sur lib/qcm/anti-leak.ts
//
// Coverage cible :
//   - pickMode bascule selon taille banque (boundaries critiques)
//   - applyAntiLeak en mode weighted : poids décroît avec days_since_seen
//   - applyAntiLeak en mode exclusion-90 : questions < cutoff exclues
//   - applyAntiLeak en mode exclusion-180 : idem 6 mois
//   - tooSimilar détecte overlap > 60%
//   - orderHash est déterministe et différent pour ordres différents
//   - weightedSample respecte les poids
// ─────────────────────────────────────────────────────────────────────────────

function makeQuestion(id: string, axisId = "ax-1"): Question {
  return {
    id,
    professionId: "test",
    axisId,
    difficulty: "intermediate",
    expectedSeconds: 30,
    prompt: `Q ${id}`,
    options: [
      { id: "a", text: "A", correct: true },
      { id: "b", text: "B", correct: false },
    ],
  };
}

describe("pickMode", () => {
  it("renvoie 'weighted' pour banque < 80", () => {
    expect(pickMode(0)).toBe("weighted");
    expect(pickMode(79)).toBe("weighted");
  });

  it("renvoie 'exclusion-90' à la frontière 80-299", () => {
    expect(pickMode(80)).toBe("exclusion-90");
    expect(pickMode(299)).toBe("exclusion-90");
  });

  it("renvoie 'exclusion-180' à 300+", () => {
    expect(pickMode(300)).toBe("exclusion-180");
    expect(pickMode(1000)).toBe("exclusion-180");
  });
});

describe("applyAntiLeak — mode weighted (<80)", () => {
  const bank = Array.from({ length: 50 }, (_, i) => makeQuestion(`q${i}`));

  it("aucune exposure : tous les poids = 1, aucun exclu", () => {
    const result = applyAntiLeak(bank, []);
    expect(result.mode).toBe("weighted");
    expect(result.candidates).toHaveLength(50);
    expect(result.excluded).toHaveLength(0);
    expect(result.candidates.every((c) => c.weight === 1)).toBe(true);
  });

  it("question vue hier a poids ~0.5", () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const exposures: ExposureRecord[] = [{ questionId: "q0", lastSeenAt: yesterday }];
    const result = applyAntiLeak(bank, exposures);
    const q0 = result.candidates.find((c) => c.question.id === "q0");
    expect(q0).toBeDefined();
    // 1 jour = poids ≈ 1/(1+1) = 0.5
    expect(q0!.weight).toBeGreaterThan(0.4);
    expect(q0!.weight).toBeLessThan(0.6);
  });

  it("question très ancienne a poids borné à 0.05 minimum", () => {
    const farPast = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const exposures: ExposureRecord[] = [{ questionId: "q0", lastSeenAt: farPast }];
    const result = applyAntiLeak(bank, exposures);
    const q0 = result.candidates.find((c) => c.question.id === "q0");
    expect(q0!.weight).toBeGreaterThanOrEqual(0.05);
  });

  it("tri par poids décroissant : non-exposées en premier", () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const exposures: ExposureRecord[] = [{ questionId: "q0", lastSeenAt: yesterday }];
    const result = applyAntiLeak(bank, exposures);
    // q0 (exposed) ne devrait pas être en tête
    expect(result.candidates[0].question.id).not.toBe("q0");
    // q0 devrait être à la fin
    expect(result.candidates[result.candidates.length - 1].question.id).toBe("q0");
  });
});

describe("applyAntiLeak — mode exclusion-90 (80-299)", () => {
  const bank = Array.from({ length: 150 }, (_, i) => makeQuestion(`q${i}`));

  it("question vue il y a 30 jours est exclue", () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const exposures: ExposureRecord[] = [{ questionId: "q0", lastSeenAt: thirtyDaysAgo }];
    const result = applyAntiLeak(bank, exposures);
    expect(result.mode).toBe("exclusion-90");
    expect(result.excluded).toContain("q0");
    expect(result.candidates.find((c) => c.question.id === "q0")).toBeUndefined();
  });

  it("question vue il y a 100 jours est admise", () => {
    const oldExposure = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000);
    const exposures: ExposureRecord[] = [{ questionId: "q0", lastSeenAt: oldExposure }];
    const result = applyAntiLeak(bank, exposures);
    expect(result.excluded).not.toContain("q0");
    expect(result.candidates.find((c) => c.question.id === "q0")).toBeDefined();
  });

  it("tous les candidats ont poids 1 (pas de pondération)", () => {
    const result = applyAntiLeak(bank, []);
    expect(result.candidates.every((c) => c.weight === 1)).toBe(true);
  });
});

describe("applyAntiLeak — mode exclusion-180 (300+)", () => {
  const bank = Array.from({ length: 400 }, (_, i) => makeQuestion(`q${i}`));

  it("question vue il y a 100 jours reste exclue", () => {
    const exposures: ExposureRecord[] = [
      { questionId: "q0", lastSeenAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000) },
    ];
    const result = applyAntiLeak(bank, exposures);
    expect(result.mode).toBe("exclusion-180");
    expect(result.excluded).toContain("q0");
  });

  it("question vue il y a 200 jours est admise", () => {
    const exposures: ExposureRecord[] = [
      { questionId: "q0", lastSeenAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000) },
    ];
    const result = applyAntiLeak(bank, exposures);
    expect(result.excluded).not.toContain("q0");
  });
});

describe("tooSimilar", () => {
  it("renvoie true si hash d'ordre identique", () => {
    expect(tooSimilar(["a", "b", "c"], ["a", "b", "c"], "hash-1", "hash-1")).toBe(true);
  });

  it("renvoie true si overlap > 60%", () => {
    const prev = ["q1", "q2", "q3", "q4", "q5"];
    const next = ["q1", "q2", "q3", "q4", "q9"]; // 4/5 = 80% overlap
    expect(tooSimilar(prev, next, null, "x")).toBe(true);
  });

  it("renvoie false si overlap = 60% exact (limite stricte)", () => {
    const prev = ["q1", "q2", "q3", "q4", "q5"];
    const next = ["q1", "q2", "q3", "q9", "q10"]; // 3/5 = 60% exact
    expect(tooSimilar(prev, next, null, "x")).toBe(false);
  });

  it("renvoie false si premier attempt (prev vide)", () => {
    expect(tooSimilar([], ["q1", "q2"], null, "h")).toBe(false);
  });
});

describe("orderHash", () => {
  it("est déterministe : même input → même output", () => {
    const a = orderHash(["q1", "q2", "q3"]);
    const b = orderHash(["q1", "q2", "q3"]);
    expect(a).toBe(b);
  });

  it("change quand l'ordre change", () => {
    const a = orderHash(["q1", "q2", "q3"]);
    const b = orderHash(["q1", "q3", "q2"]);
    expect(a).not.toBe(b);
  });

  it("change quand un élément change", () => {
    const a = orderHash(["q1", "q2"]);
    const b = orderHash(["q1", "q3"]);
    expect(a).not.toBe(b);
  });

  it("renvoie une string non vide même sur tableau vide", () => {
    expect(orderHash([])).toBeTypeOf("string");
    expect(orderHash([]).length).toBeGreaterThan(0);
  });
});

describe("weightedSample", () => {
  it("renvoie [] sur input vide", () => {
    expect(weightedSample([], 5, Math.random)).toEqual([]);
  });

  it("renvoie [] si n <= 0", () => {
    expect(weightedSample([{ item: "a", weight: 1 }], 0, Math.random)).toEqual([]);
  });

  it("renvoie au plus N éléments", () => {
    const items = [
      { item: "a", weight: 1 },
      { item: "b", weight: 1 },
      { item: "c", weight: 1 },
    ];
    const out = weightedSample(items, 5, Math.random);
    expect(out.length).toBeLessThanOrEqual(3);
  });

  it("respect approximatif des poids : 1000 tirages × n=1, l'élément à poids 10× est plus tiré", () => {
    const items = [
      { item: "rare", weight: 1 },
      { item: "common", weight: 10 },
    ];
    let commonCount = 0;
    for (let i = 0; i < 1000; i++) {
      const picks = weightedSample(items, 1, Math.random);
      if (picks[0] === "common") commonCount++;
    }
    // Sur 1000 tirages, common devrait être tiré ~90% du temps
    expect(commonCount).toBeGreaterThan(700);
  });
});
