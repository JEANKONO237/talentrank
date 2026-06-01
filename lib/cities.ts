// ─────────────────────────────────────────────────────────────────────────────
// Cities — agrégation des talents par ville.
//
// Le ranking principal est par MÉTIER (jamais global cross-métier — règle
// fondatrice du produit). La dimension géographique vient en complément :
// "les meilleurs Motion Designers à Lyon" est légitime ; "les meilleurs
// talents à Lyon toutes professions confondues" ne l'est pas.
//
// Ce module expose des aggrégations légères pour la page /villes et pour les
// composants qui veulent afficher un compteur de talents par ville.
// ─────────────────────────────────────────────────────────────────────────────

import { TALENTS, type Talent } from "./mock-talents";
import { PROFESSIONS, type Profession } from "./professions";

export interface CitySummary {
  /** Nom de ville normalisé (sans suffixe pays). */
  name: string;
  /** ISO 3166-1 alpha-2 du pays. */
  countryCode: string;
  /** Nombre total de talents recensés dans cette ville. */
  totalTalents: number;
  /** Top 3 métiers (par nombre de talents) avec leur compteur. */
  topProfessions: Array<{ profession: Profession; count: number }>;
  /** Score moyen des talents de la ville (indicateur qualité). */
  averageScore: number;
  /** Le talent #1 de la ville (toutes profs, pour preview seulement). */
  topTalent: Talent | null;
}

function normalizeCity(raw: string): string {
  // Certains talents ont "Paris / Île-de-France" — on garde la 1ère partie.
  return raw.split("/")[0].trim();
}

/** Construit la liste des villes avec aggrégations. Trié par nb talents desc. */
export function getCities(): CitySummary[] {
  const byCity = new Map<string, Talent[]>();
  for (const t of TALENTS) {
    if (!t.city) continue;
    const key = `${normalizeCity(t.city)}|${t.countryCode}`;
    const arr = byCity.get(key) ?? [];
    arr.push(t);
    byCity.set(key, arr);
  }

  const summaries: CitySummary[] = [];
  for (const [key, talents] of byCity) {
    const [name, countryCode] = key.split("|");

    // Top métiers : compte par professionId puis prend les 3 premiers
    const profCount = new Map<string, number>();
    for (const t of talents) {
      const pid = t.professionId;
      if (!pid) continue;
      profCount.set(pid, (profCount.get(pid) ?? 0) + 1);
    }
    const topProfessions = Array.from(profCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([pid, count]) => {
        const profession = PROFESSIONS.find((p) => p.id === pid);
        return profession ? { profession, count } : null;
      })
      .filter((x): x is { profession: Profession; count: number } => x !== null);

    const averageScore =
      talents.reduce((sum, t) => sum + t.score, 0) / talents.length;

    const topTalent =
      [...talents].sort((a, b) => b.score - a.score)[0] ?? null;

    summaries.push({
      name,
      countryCode,
      totalTalents: talents.length,
      topProfessions,
      averageScore: Math.round(averageScore),
      topTalent,
    });
  }

  return summaries.sort((a, b) => b.totalTalents - a.totalTalents);
}

/** Retourne le résumé d'une ville par nom (case-insensitive). */
export function findCity(name: string): CitySummary | undefined {
  const target = name.toLowerCase();
  return getCities().find((c) => c.name.toLowerCase() === target);
}

/**
 * Slug-safe d'un nom de ville : lowercase, accents retirés, espaces → tirets.
 * Ex: "São Paulo" → "sao-paulo", "Île-de-France" → "ile-de-france".
 */
export function citySlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Inverse : retrouve une ville par son slug. */
export function findCityBySlug(slug: string): CitySummary | undefined {
  const target = slug.toLowerCase();
  return getCities().find((c) => citySlug(c.name) === target);
}

/**
 * Retourne les talents d'une ville pour un métier donné, triés par score desc.
 * Utilisé par /villes/[city]/[profession]. La normalisation de la ville passe
 * par le slug pour matcher "lyon", "Lyon", "LYON".
 */
export function getTalentsInCityForProfession(
  citySlugStr: string,
  professionId: string,
): Talent[] {
  const targetCity = findCityBySlug(citySlugStr);
  if (!targetCity) return [];
  return TALENTS.filter((t) => {
    if (t.professionId !== professionId) return false;
    if (!t.city) return false;
    return normalizeCity(t.city).toLowerCase() === targetCity.name.toLowerCase();
  }).sort((a, b) => b.score - a.score);
}

/**
 * Liste tous les combos (city, profession) qui ont au moins N talents — utilisé
 * par generateStaticParams et par le sitemap pour ne pas générer 900 pages
 * vides. Seuil par défaut = 1 (toute combinaison non vide).
 */
export function listCityProfessionPairs(
  minTalents: number = 1,
): Array<{ citySlug: string; professionId: string; count: number }> {
  const pairs: Array<{ citySlug: string; professionId: string; count: number }> = [];
  const byKey = new Map<string, number>();

  for (const t of TALENTS) {
    if (!t.city || !t.professionId) continue;
    const cName = normalizeCity(t.city);
    const cSlug = citySlug(cName);
    const key = `${cSlug}|${t.professionId}`;
    byKey.set(key, (byKey.get(key) ?? 0) + 1);
  }

  for (const [key, count] of byKey) {
    if (count < minTalents) continue;
    const [cSlug, professionId] = key.split("|");
    pairs.push({ citySlug: cSlug, professionId, count });
  }

  return pairs.sort((a, b) => b.count - a.count);
}
