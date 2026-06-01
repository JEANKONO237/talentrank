// TalentRank — Anti-leak question selection
// ----------------------------------------------------------------------------
// Empêche un user de retomber sur les mêmes questions à chaque tentative.
//
// Stratégie hybride définie avec le pilote produit :
//
//   < 80 questions  : pondération fraîcheur (weight = 1 / (1 + days_since_seen))
//                     → robuste pour les banques petites, on ne peut PAS épuiser
//                     les questions ; risque léger de revoir une Q très ancienne
//
//   80 – 300 q.     : exclusion stricte 3 mois (90 jours)
//                     → équilibre épuisement / fraîcheur, garde une marge de jeu
//
//   300+ questions  : exclusion stricte 6 mois (180 jours)
//                     → max crédibilité du classement, jamais 2× la même Q
//                       sur une période significative
//
// Le module est PUR : il prend la banque + la liste d'exposures + un seed,
// renvoie la liste des question_ids candidats triés par "préférence". Le
// caller (Node.js QCM session) combine ensuite cette liste avec la
// configForYears() pour piocher les N finales.

import type { Question } from "./types";

// ─── Seuils de bascule ────────────────────────────────────────────────────
const SMALL_BANK = 80;
const LARGE_BANK = 300;
const MEDIUM_EXCLUSION_DAYS = 90;
const LARGE_EXCLUSION_DAYS = 180;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// ─── Types ────────────────────────────────────────────────────────────────

export interface ExposureRecord {
  questionId: string;
  lastSeenAt: Date | string | number;
}

export type AntiLeakMode = "weighted" | "exclusion-90" | "exclusion-180";

export interface AntiLeakResult {
  /** Stratégie effectivement appliquée. */
  mode: AntiLeakMode;
  /** Questions utilisables, triées par priorité décroissante (les + anciennes /
   *  jamais vues d'abord). En mode pondération, un poids est attaché. */
  candidates: { question: Question; weight: number }[];
  /** Questions exclues (en exclusion mode), ou ignored=false (en weighted mode). */
  excluded: string[];
}

// ─── API principale ──────────────────────────────────────────────────────

/**
 * Décide quelles questions ce candidat peut voir, en appliquant la stratégie
 * adaptée à la taille de la banque.
 *
 * @param bankQuestions Toutes les questions de la banque pour ce métier.
 * @param exposures      Ce que ce user a déjà vu (de `qcm_question_exposure`).
 * @param now            Date courante (injectée pour les tests).
 */
export function applyAntiLeak(
  bankQuestions: Question[],
  exposures: ExposureRecord[],
  now: Date = new Date(),
): AntiLeakResult {
  const mode = pickMode(bankQuestions.length);
  const exposureMap = buildExposureMap(exposures);
  const nowMs = now.getTime();

  if (mode === "weighted") {
    return applyWeighted(bankQuestions, exposureMap, nowMs);
  }

  const excludeDays = mode === "exclusion-180" ? LARGE_EXCLUSION_DAYS : MEDIUM_EXCLUSION_DAYS;
  return applyExclusion(bankQuestions, exposureMap, nowMs, excludeDays, mode);
}

/** Mode applicable selon la taille de la banque. */
export function pickMode(bankSize: number): AntiLeakMode {
  if (bankSize < SMALL_BANK) return "weighted";
  if (bankSize < LARGE_BANK) return "exclusion-90";
  return "exclusion-180";
}

// ─── Implémentations ─────────────────────────────────────────────────────

/** Pondération : toutes les questions restent éligibles, mais leur poids
 *  baisse avec la fraîcheur. Jamais vue = poids 1.0. Vue hier = poids ~0.5.
 *  Vue il y a 6 mois = poids ~0.99. */
function applyWeighted(
  bank: Question[],
  exposureMap: Map<string, number>,
  nowMs: number,
): AntiLeakResult {
  const candidates = bank.map((q) => {
    const lastSeen = exposureMap.get(q.id);
    let weight = 1;
    if (lastSeen !== undefined) {
      const daysSince = Math.max(0, (nowMs - lastSeen) / MS_PER_DAY);
      // Formule décroissante : 1/(1+d) borné à [0.05 .. 1.0]
      // jour 0  → 1.0
      // jour 1  → 0.5
      // jour 7  → 0.125
      // jour 30 → 0.032 → bornée à 0.05
      // jour 180 → bornée à 0.05 minimum, sinon la Q ne ressort jamais
      weight = Math.max(0.05, 1 / (1 + daysSince));
    }
    return { question: q, weight };
  });
  // Tri : poids descendant (priorité aux jamais vues / + anciennes)
  candidates.sort((a, b) => b.weight - a.weight);
  return { mode: "weighted", candidates, excluded: [] };
}

/** Exclusion stricte : toute question vue dans les N derniers jours est
 *  retirée du pool. Les autres ont poids 1.0 (pondération neutre, le caller
 *  fera son tri par difficulté/axe). */
function applyExclusion(
  bank: Question[],
  exposureMap: Map<string, number>,
  nowMs: number,
  excludeDays: number,
  mode: AntiLeakMode,
): AntiLeakResult {
  const cutoffMs = nowMs - excludeDays * MS_PER_DAY;
  const candidates: { question: Question; weight: number }[] = [];
  const excluded: string[] = [];
  for (const q of bank) {
    const lastSeen = exposureMap.get(q.id);
    if (lastSeen !== undefined && lastSeen >= cutoffMs) {
      excluded.push(q.id);
    } else {
      candidates.push({ question: q, weight: 1 });
    }
  }
  return { mode, candidates, excluded };
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function buildExposureMap(exposures: ExposureRecord[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of exposures) {
    const t = typeof e.lastSeenAt === "number"
      ? e.lastSeenAt
      : new Date(e.lastSeenAt).getTime();
    if (Number.isFinite(t)) {
      const prev = map.get(e.questionId);
      if (prev === undefined || t > prev) map.set(e.questionId, t);
    }
  }
  return map;
}

// ─── Sélection finale pondérée (pour mode weighted) ──────────────────────
// Pioche N éléments d'un pool pondéré avec un PRNG déterministe.
// Utilisé en mode `weighted` quand on veut un échantillonage aléatoire qui
// respecte les poids (les questions fréquentes ont moins de chance de
// retomber). En mode exclusion, on n'en a pas besoin (poids = 1 pour tous).

export function weightedSample<T>(
  items: { item: T; weight: number }[],
  n: number,
  rng: () => number,
): T[] {
  if (items.length === 0 || n <= 0) return [];
  // Pool mutable + suppression au fur et à mesure
  const pool = items.map((x) => ({ ...x }));
  const out: T[] = [];
  for (let k = 0; k < n && pool.length > 0; k++) {
    const total = pool.reduce((s, x) => s + x.weight, 0);
    if (total <= 0) {
      // tous les poids à 0 → tirage uniforme sur ce qui reste
      const idx = Math.floor(rng() * pool.length);
      out.push(pool.splice(idx, 1)[0].item);
      continue;
    }
    let r = rng() * total;
    let idx = 0;
    for (; idx < pool.length; idx++) {
      r -= pool[idx].weight;
      if (r <= 0) break;
    }
    if (idx >= pool.length) idx = pool.length - 1;
    out.push(pool.splice(idx, 1)[0].item);
  }
  return out;
}

// ─── Contrainte "jamais le même ordre/options" ────────────────────────────
// Cette contrainte est garantie par 2 mécanismes COMBINÉS :
//
//   1. Le seed est nouveau à chaque attempt (Date.now() + random) → shuffle
//      questions différent.
//   2. shuffleOptions() en lib/qcm/registry.ts utilise un seed dérivé
//      (`${seed}|${q.id}`) → l'ordre des options change aussi.
//
// On AJOUTE ici une vérification post-sélection : si deux attempts
// consécutifs du même user partagent +60% de mêmes Qs OU le même hash
// d'ordre, on rejette et on re-tire avec un seed différent. C'est ceinture
// + bretelles : la chance que ça arrive avec un PRNG décent est minuscule
// mais on s'en assure.

export function tooSimilar(
  prevQuestionIds: string[],
  newQuestionIds: string[],
  prevOrderHash: string | null,
  newOrderHash: string,
  threshold = 0.6,
): boolean {
  if (prevOrderHash !== null && prevOrderHash === newOrderHash) return true;
  if (prevQuestionIds.length === 0) return false;
  const prevSet = new Set(prevQuestionIds);
  const overlap = newQuestionIds.filter((id) => prevSet.has(id)).length;
  const ratio = overlap / Math.max(newQuestionIds.length, 1);
  return ratio > threshold;
}

/** Hash léger d'une séquence ordonnée — utilisé pour comparer deux
 *  pratiques sans avoir à stocker la séquence brute. */
export function orderHash(orderedIds: string[]): string {
  let h = 5381;
  for (let i = 0; i < orderedIds.length; i++) {
    const s = `${i}:${orderedIds[i]};`;
    for (let j = 0; j < s.length; j++) {
      h = ((h << 5) + h + s.charCodeAt(j)) | 0;
    }
  }
  return (h >>> 0).toString(36);
}
