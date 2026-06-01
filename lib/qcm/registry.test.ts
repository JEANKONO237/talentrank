import { describe, expect, it } from "vitest";
import {
  configForYears,
  getBank,
  hasBank,
  listBanks,
  makeSeed,
  selectQuestions,
  shuffleOptions,
} from "./registry";

// ─────────────────────────────────────────────────────────────────────────────
// Tests sur lib/qcm/registry.ts
//
// Garanties critiques :
//   - selectQuestions est REPRODUCTIBLE avec un même seed
//   - configForYears est monotone en difficulté avec l'expérience
//   - getBank renvoie null si profession inconnue
//   - shuffleOptions est déterministe par seed
//   - makeSeed renvoie une string unique
// ─────────────────────────────────────────────────────────────────────────────

describe("listBanks / getBank / hasBank", () => {
  const banks = listBanks();

  it("expose au moins 3 banks v1 (animation-3d, frontend, baker)", () => {
    expect(banks.length).toBeGreaterThanOrEqual(3);
  });

  it("chaque bank a un professionId + label + axes + questions", () => {
    for (const b of banks) {
      expect(b.professionId).toBeTruthy();
      expect(b.frLabel).toBeTruthy();
      expect(b.axes.length).toBeGreaterThan(0);
      expect(b.questions.length).toBeGreaterThan(0);
    }
  });

  it("getBank retrouve les banks listées", () => {
    for (const b of banks) {
      expect(getBank(b.professionId)).toBe(b);
    }
  });

  it("hasBank('inconnu') = false", () => {
    expect(hasBank("xyz-no-such-bank")).toBe(false);
    expect(getBank("xyz-no-such-bank")).toBeNull();
  });
});

// ─── configForYears — adaptive difficulty ────────────────────────────────

describe("configForYears", () => {
  it("junior (<4 ans) : surtout débutant/intermédiaire", () => {
    const c = configForYears(2);
    expect(c.difficultyMix.beginner).toBeGreaterThanOrEqual(c.difficultyMix.expert);
    expect(c.difficultyMix.expert).toBe(0);
  });

  it("senior (10+ ans) : surtout avancé/expert", () => {
    const c = configForYears(15);
    expect(c.difficultyMix.advanced + c.difficultyMix.expert).toBeGreaterThanOrEqual(
      c.difficultyMix.beginner + c.difficultyMix.intermediate,
    );
  });

  it("totalQuestions est cohérent avec la somme du mix", () => {
    for (const years of [0, 4, 8, 12, 25]) {
      const c = configForYears(years);
      const sum = Object.values(c.difficultyMix).reduce((a, b) => a + b, 0);
      expect(c.totalQuestions).toBe(sum);
    }
  });

  it("minAxesCoverage >= 4 toujours", () => {
    for (const years of [0, 4, 8, 12, 25]) {
      const c = configForYears(years);
      expect(c.minAxesCoverage).toBeGreaterThanOrEqual(4);
    }
  });
});

// ─── selectQuestions — reproducibility ────────────────────────────────────

describe("selectQuestions", () => {
  const bank = listBanks()[0]; // animation-3d ou autre, peu importe

  it("avec même seed → même sélection (déterminisme)", () => {
    const config = configForYears(5);
    const a = selectQuestions({ bank, config, seed: "seed-x" });
    const b = selectQuestions({ bank, config, seed: "seed-x" });
    expect(a.map((q) => q.id)).toEqual(b.map((q) => q.id));
  });

  it("avec seed différent → sélection probablement différente", () => {
    const config = configForYears(5);
    const a = selectQuestions({ bank, config, seed: "seed-A" });
    const b = selectQuestions({ bank, config, seed: "seed-B" });
    // Au moins un Q de différence — sur 11-12 Qs, c'est quasi sûr
    const sameIds = a.filter((q, i) => b[i]?.id === q.id).length;
    expect(sameIds).toBeLessThan(a.length);
  });

  it("renvoie totalQuestions (ou moins si banque épuisée)", () => {
    const config = configForYears(5);
    const out = selectQuestions({ bank, config, seed: "test" });
    expect(out.length).toBeLessThanOrEqual(config.totalQuestions);
    expect(out.length).toBeGreaterThan(0);
  });

  it("aucun doublon dans la sélection", () => {
    const config = configForYears(8);
    const out = selectQuestions({ bank, config, seed: "abc" });
    const ids = new Set(out.map((q) => q.id));
    expect(ids.size).toBe(out.length);
  });
});

// ─── shuffleOptions ──────────────────────────────────────────────────────

describe("shuffleOptions", () => {
  const bank = listBanks()[0];
  const q = bank.questions[0];

  it("renvoie une question avec les MÊMES options (juste réordonnées)", () => {
    const out = shuffleOptions(q, "seed-1");
    const originalIds = q.options.map((o) => o.id).sort();
    const newIds = out.options.map((o) => o.id).sort();
    expect(newIds).toEqual(originalIds);
  });

  it("ne mute pas la question originale", () => {
    const originalOptions = q.options.map((o) => o.id);
    shuffleOptions(q, "seed-1");
    expect(q.options.map((o) => o.id)).toEqual(originalOptions);
  });

  it("est déterministe : même seed → même ordre", () => {
    const a = shuffleOptions(q, "seed-x");
    const b = shuffleOptions(q, "seed-x");
    expect(a.options.map((o) => o.id)).toEqual(b.options.map((o) => o.id));
  });

  it("seed différent → ordre potentiellement différent", () => {
    // Avec 3-4 options, il y a une chance que 2 seeds tombent sur le même
    // shuffle. On teste sur plusieurs seeds que ce n'est pas systématique.
    const a = shuffleOptions(q, "seed-A").options.map((o) => o.id).join("");
    let differentFound = false;
    for (const s of ["seed-B", "seed-C", "seed-D", "seed-E", "seed-F"]) {
      const b = shuffleOptions(q, s).options.map((o) => o.id).join("");
      if (b !== a) {
        differentFound = true;
        break;
      }
    }
    expect(differentFound).toBe(true);
  });
});

// ─── makeSeed ────────────────────────────────────────────────────────────

describe("makeSeed", () => {
  it("renvoie une string non vide", () => {
    expect(makeSeed()).toBeTypeOf("string");
    expect(makeSeed().length).toBeGreaterThan(5);
  });

  it("renvoie des seeds différents sur appels successifs", () => {
    const seeds = new Set<string>();
    for (let i = 0; i < 50; i++) seeds.add(makeSeed());
    expect(seeds.size).toBeGreaterThan(40); // tolerance pour collisions improbables
  });
});
