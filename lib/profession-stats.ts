// Aggregated stats over the talent base, grouped by profession & category.
// Used by /metiers (catalogue counts) and /ranking/[profession] (header subtitle).
//
// Reads from the mock-talents source via the canonical resolver
// `talentProfessionId` — so even legacy records without `professionId` are
// counted under the correct profession.

import { talentProfessionId, TALENTS, type Talent } from "./mock-talents";
import {
  PROFESSIONS,
  PROFESSION_CATEGORIES,
  getProfession,
  type Profession,
  type ProfessionCategoryId,
} from "./professions";

export interface ProfessionStat {
  profession: Profession;
  talentCount: number;
  topScore: number | null;
}

export interface CategoryStat {
  categoryId: ProfessionCategoryId;
  professionCount: number;
  talentCount: number;
  /** Top talents across the category, useful for category card previews. */
  topTalents: Talent[];
}

/** Map of professionId → number of talents in that profession. */
export function countTalentsByProfession(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const t of TALENTS) {
    const id = talentProfessionId(t);
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}

/** Stats for every profession that has at least one talent, sorted by talent
 *  count desc then by canonical order. */
export function professionStats(): ProfessionStat[] {
  const counts = countTalentsByProfession();
  return PROFESSIONS.filter((p) => (counts[p.id] ?? 0) > 0)
    .map<ProfessionStat>((p) => {
      const talents = TALENTS.filter((t) => talentProfessionId(t) === p.id);
      const topScore = talents.length
        ? Math.max(...talents.map((t) => t.score))
        : null;
      return { profession: p, talentCount: talents.length, topScore };
    })
    .sort((a, b) => b.talentCount - a.talentCount);
}

/** Stats for a single category: how many professions live in it, how many
 *  talents in total, and a short list of preview talents (top score). */
export function categoryStats(categoryId: ProfessionCategoryId): CategoryStat {
  const profIdsInCat = PROFESSIONS.filter((p) => p.category === categoryId).map((p) => p.id);
  const talents = TALENTS.filter((t) => profIdsInCat.includes(talentProfessionId(t)));
  const activeProfIds = new Set(talents.map((t) => talentProfessionId(t)));
  return {
    categoryId,
    professionCount: activeProfIds.size,
    talentCount: talents.length,
    topTalents: talents.sort((a, b) => b.score - a.score).slice(0, 3),
  };
}

/** Stats for all categories in canonical order. */
export function allCategoryStats(): CategoryStat[] {
  return PROFESSION_CATEGORIES.map((c) => categoryStats(c.id));
}

/** Professions inside a category that have at least one talent. */
export function professionStatsForCategory(categoryId: ProfessionCategoryId): ProfessionStat[] {
  return professionStats().filter((s) => s.profession.category === categoryId);
}

/** All professions in a category — including those with zero talents, in
 *  canonical order. Used to render an exhaustive catalogue. */
export function allProfessionStatsForCategory(
  categoryId: ProfessionCategoryId,
): ProfessionStat[] {
  const counts = countTalentsByProfession();
  return PROFESSIONS.filter((p) => p.category === categoryId).map<ProfessionStat>((p) => {
    const talents = TALENTS.filter((t) => talentProfessionId(t) === p.id);
    return {
      profession: p,
      talentCount: counts[p.id] ?? 0,
      topScore: talents.length ? Math.max(...talents.map((t) => t.score)) : null,
    };
  });
}

/** Resolve profession safely (used by route loaders). */
export function resolveProfessionOrNull(id: string): Profession | null {
  return getProfession(id) ?? null;
}

// Re-export for ergonomic single-import usage in route components.
export { PROFESSIONS, PROFESSION_CATEGORIES } from "./professions";
