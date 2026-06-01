"use client";

// Custom professions registry
// ----------------------------------------------------------------------------
// When a candidate types a profession that doesn't match any canonical record
// (via lib/professions.ts findProfessionByQuery), we store their submission
// here as a "community-submitted" profession with `pending: true`.
//
// Flow:
//   1. Candidate types "Glassblower" → no match in PROFESSIONS.
//   2. They pick a category, e.g. "Hospitality & Food".
//   3. We persist { id: "glassblower", category: "trades", frLabel: …,
//      pending: true } to localStorage so future candidates see it.
//   4. Admin later validates → flips `pending: false` (admin UI not built yet).
//
// All read functions are SSR-safe: they return [] on the server and hydrate
// once mounted in the browser.

import {
  findProfessionByQuery,
  slugifyProfessionName,
  type Profession,
  type ProfessionCategoryId,
} from "./professions";

const STORAGE_KEY = "talentrank:custom-professions:v1";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readAll(): Profession[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Profession[]) : [];
  } catch {
    return [];
  }
}

function writeAll(list: Profession[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* quota exceeded or storage unavailable — silently ignore */
  }
}

/** All community-submitted professions stored in this browser. */
export function listCustomProfessions(): Profession[] {
  return readAll();
}

/** Custom professions still awaiting admin validation. */
export function listPendingProfessions(): Profession[] {
  return readAll().filter((p) => p.pending);
}

export interface AddCustomProfessionInput {
  rawLabel: string;
  /** Category the candidate picked when submitting. */
  category: ProfessionCategoryId;
}

export interface AddCustomProfessionResult {
  profession: Profession;
  /** True when a matching canonical or already-submitted profession was found. */
  matched: boolean;
}

/** Try to find an existing canonical or custom profession. If nothing matches,
 *  create a new pending one and persist it. */
export function addCustomProfession(input: AddCustomProfessionInput): AddCustomProfessionResult {
  const { rawLabel, category } = input;
  const trimmed = rawLabel.trim();
  if (!trimmed) {
    throw new Error("Custom profession label cannot be empty.");
  }

  // 1. Try canonical match (synonyms aware).
  const canonical = findProfessionByQuery(trimmed);
  if (canonical) return { profession: canonical, matched: true };

  // 2. Try existing custom-submission match (any browser-stored entry).
  const customs = readAll();
  const slug = slugifyProfessionName(trimmed);
  const existing = customs.find((p) => p.id === slug);
  if (existing) return { profession: existing, matched: true };

  // 3. Create a new pending entry.
  const newProfession: Profession = {
    id: slug,
    category,
    label: trimmed,
    frLabel: trimmed,
    short: trimmed.length > 14 ? trimmed.slice(0, 12) + "…" : trimmed,
    frShort: trimmed.length > 14 ? trimmed.slice(0, 12) + "…" : trimmed,
    gradient: "from-amber-300 via-orange-500 to-rose-800",
    synonyms: [trimmed.toLowerCase()],
    community: true,
    pending: true,
  };

  writeAll([...customs, newProfession]);
  return { profession: newProfession, matched: false };
}

/** React hook helper — subscribes to storage events so multiple tabs stay in sync. */
export function subscribeCustomProfessions(callback: (list: Profession[]) => void): () => void {
  if (!isBrowser()) return () => {};
  const handler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback(readAll());
  };
  window.addEventListener("storage", handler);
  // Initial push
  callback(readAll());
  return () => window.removeEventListener("storage", handler);
}
