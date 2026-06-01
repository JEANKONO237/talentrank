import { describe, expect, it } from "vitest";
import {
  currentMilestone,
  LEVEL_MILESTONES,
  levelForXp,
  MAX_LEVEL,
  nextMilestone,
  progressInLevel,
  xpForLevel,
  xpToNextLevel,
  XP_SOURCES,
} from "./xp";

// ─────────────────────────────────────────────────────────────────────────────
// Tests sur lib/xp.ts
//
// La formule (25 × N^2.4) doit être monotone, et levelForXp doit être l'inverse
// quasi-exact (à ±1 niveau près à cause du floor).
// Les milestones doivent être ordonnés. Les sources XP doivent avoir des IDs uniques.
// ─────────────────────────────────────────────────────────────────────────────

describe("xpForLevel", () => {
  it("level 1 → 0 XP (point de départ)", () => {
    expect(xpForLevel(1)).toBe(0);
  });

  it("est strictement croissant entre 1 et MAX_LEVEL", () => {
    for (let lv = 1; lv < MAX_LEVEL; lv++) {
      expect(xpForLevel(lv + 1)).toBeGreaterThan(xpForLevel(lv));
    }
  });

  it("plafonne à MAX_LEVEL au-delà", () => {
    expect(xpForLevel(MAX_LEVEL)).toBe(xpForLevel(MAX_LEVEL + 5));
    expect(xpForLevel(MAX_LEVEL)).toBe(xpForLevel(999));
  });

  it("level 50 = ~132k XP (référence du design doc)", () => {
    // 25 * 50^2.4 ≈ 132 000
    const lv50 = xpForLevel(50);
    expect(lv50).toBeGreaterThan(100_000);
    expect(lv50).toBeLessThan(200_000);
  });

  it("level 10 = ~2.4k XP", () => {
    const lv10 = xpForLevel(10);
    expect(lv10).toBeGreaterThan(2_000);
    expect(lv10).toBeLessThan(3_000);
  });
});

describe("levelForXp", () => {
  it("xp = 0 → niveau 1", () => {
    expect(levelForXp(0)).toBe(1);
  });

  it("xp négatif → niveau 1 (jamais en dessous)", () => {
    expect(levelForXp(-100)).toBe(1);
  });

  it("plafonne à MAX_LEVEL pour XP énormes", () => {
    expect(levelForXp(10_000_000)).toBe(MAX_LEVEL);
  });

  it("est l'inverse approximatif de xpForLevel", () => {
    // Le floor peut décaler de ±1 sur les pivots ; on tolère
    for (let lv = 2; lv < 40; lv++) {
      const xp = xpForLevel(lv);
      const back = levelForXp(xp);
      expect(Math.abs(back - lv)).toBeLessThanOrEqual(1);
    }
  });

  it("monotonicité : plus d'XP = niveau ≥", () => {
    let prev = levelForXp(0);
    for (let xp = 100; xp <= 200_000; xp += 1000) {
      const cur = levelForXp(xp);
      expect(cur).toBeGreaterThanOrEqual(prev);
      prev = cur;
    }
  });
});

describe("progressInLevel", () => {
  it("xp pile sur un seuil → progress = 0 (juste atteint)", () => {
    const xp = xpForLevel(5);
    expect(progressInLevel(xp)).toBe(0);
  });

  it("xp à mi-chemin → progress ≈ 0.5", () => {
    const xp = (xpForLevel(5) + xpForLevel(6)) / 2;
    const p = progressInLevel(xp);
    expect(p).toBeGreaterThan(0.4);
    expect(p).toBeLessThan(0.6);
  });

  it("au MAX_LEVEL → progress = 1", () => {
    expect(progressInLevel(xpForLevel(MAX_LEVEL))).toBe(1);
    expect(progressInLevel(10_000_000)).toBe(1);
  });

  it("toujours dans [0, 1]", () => {
    for (let xp = 0; xp < 500_000; xp += 5_000) {
      const p = progressInLevel(xp);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });
});

describe("xpToNextLevel", () => {
  it("renvoie 0 à MAX_LEVEL", () => {
    expect(xpToNextLevel(xpForLevel(MAX_LEVEL))).toBe(0);
  });

  it("renvoie une valeur positive en dessous du max", () => {
    expect(xpToNextLevel(0)).toBeGreaterThan(0);
    expect(xpToNextLevel(1000)).toBeGreaterThan(0);
  });

  it("cohérent avec xpForLevel : actuel + remaining = next", () => {
    const xp = 500;
    const lv = levelForXp(xp);
    if (lv < MAX_LEVEL) {
      expect(xp + xpToNextLevel(xp)).toBe(xpForLevel(lv + 1));
    }
  });
});

describe("LEVEL_MILESTONES", () => {
  it("a au moins 5 milestones définis", () => {
    expect(LEVEL_MILESTONES.length).toBeGreaterThanOrEqual(5);
  });

  it("est ordonné par level croissant", () => {
    for (let i = 1; i < LEVEL_MILESTONES.length; i++) {
      expect(LEVEL_MILESTONES[i].level).toBeGreaterThan(LEVEL_MILESTONES[i - 1].level);
    }
  });

  it("commence à level 1", () => {
    expect(LEVEL_MILESTONES[0].level).toBe(1);
  });

  it("finit à MAX_LEVEL (Maître)", () => {
    expect(LEVEL_MILESTONES[LEVEL_MILESTONES.length - 1].level).toBe(MAX_LEVEL);
  });

  it("chaque milestone a titre + description + unlock non vides", () => {
    for (const m of LEVEL_MILESTONES) {
      expect(m.title).toBeTruthy();
      expect(m.description).toBeTruthy();
      expect(m.unlock).toBeTruthy();
    }
  });
});

describe("currentMilestone & nextMilestone", () => {
  it("currentMilestone(1) = Novice", () => {
    expect(currentMilestone(1).title).toBe("Novice");
  });

  it("currentMilestone(50) = Maître", () => {
    expect(currentMilestone(MAX_LEVEL).title).toBe("Maître");
  });

  it("currentMilestone(15) = Habitué (jalon 15)", () => {
    const m = currentMilestone(15);
    expect(m.level).toBe(15);
  });

  it("currentMilestone(12) = milestone précédent (10 Compagnon)", () => {
    const m = currentMilestone(12);
    expect(m.level).toBe(10);
  });

  it("nextMilestone(50) = null", () => {
    expect(nextMilestone(MAX_LEVEL)).toBeNull();
  });

  it("nextMilestone(1) = Apprenti niveau 5", () => {
    const m = nextMilestone(1);
    expect(m?.level).toBe(5);
  });
});

describe("XP_SOURCES", () => {
  it("toutes les sources ont un id snake_case unique", () => {
    const ids = new Set<string>();
    for (const s of XP_SOURCES) {
      expect(s.id).toMatch(/^[a-z][a-z0-9_]+$/);
      expect(ids.has(s.id)).toBe(false);
      ids.add(s.id);
    }
  });

  it("XP positif sur toutes les sources", () => {
    for (const s of XP_SOURCES) {
      expect(s.xp).toBeGreaterThan(0);
    }
  });

  it("cadence dans le set valide", () => {
    const valid = new Set(["once", "monthly", "daily", "repeat"]);
    for (const s of XP_SOURCES) {
      expect(valid.has(s.cadence)).toBe(true);
    }
  });

  it("au moins une source par catégorie", () => {
    const cats = new Set(XP_SOURCES.map((s) => s.category));
    expect(cats.has("profil")).toBe(true);
    expect(cats.has("qcm")).toBe(true);
    expect(cats.has("missions")).toBe(true);
    expect(cats.has("social")).toBe(true);
    expect(cats.has("engagement")).toBe(true);
  });
});
