"use client";

import { useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Pinning de métiers — pour les studios qui veulent garder leurs cibles
// de recrutement en haut de la liste /ranking.
//
// Persistence v1 : localStorage (par browser). Quand Supabase auth sera
// branché, on migrera vers une table studio_pinned_professions (talent_id,
// profession_id, pinned_at) avec sync optimiste.
//
// API :
//   getPinnedProfessions() → string[]    (lecture sync)
//   pinProfession(id)                    (write + event)
//   unpinProfession(id)                  (write + event)
//   togglePin(id)
//   usePinnedProfessions()               (hook réactif)
//   isPinned(id, list)                   (helper pur)
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "tr:studio:pinned-professions:v1";
const EVENT = "tr:pinned-changed";

function readStore(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string");
  } catch {
    return [];
  }
}

function writeStore(list: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {
    /* ignore */
  }
}

export function getPinnedProfessions(): string[] {
  return readStore();
}

export function isPinned(id: string, list?: string[]): boolean {
  const l = list ?? readStore();
  return l.includes(id);
}

export function pinProfession(id: string): void {
  const list = readStore();
  if (list.includes(id)) return;
  // Limite à 12 — au-delà ça perd son sens d'épinglage prioritaire
  const next = [id, ...list].slice(0, 12);
  writeStore(next);
}

export function unpinProfession(id: string): void {
  const list = readStore();
  if (!list.includes(id)) return;
  writeStore(list.filter((x) => x !== id));
}

export function togglePin(id: string): boolean {
  const list = readStore();
  if (list.includes(id)) {
    writeStore(list.filter((x) => x !== id));
    return false;
  }
  writeStore([id, ...list].slice(0, 12));
  return true;
}

/** Hook réactif — re-render quand le store change (même tab + cross-tab). */
export function usePinnedProfessions(): {
  pinned: string[];
  isPinned: (id: string) => boolean;
  toggle: (id: string) => void;
  count: number;
} {
  const [pinned, setPinned] = useState<string[]>([]);

  useEffect(() => {
    setPinned(readStore());
    const handler = () => setPinned(readStore());
    window.addEventListener(EVENT, handler);
    const storageHandler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setPinned(readStore());
    };
    window.addEventListener("storage", storageHandler);
    return () => {
      window.removeEventListener(EVENT, handler);
      window.removeEventListener("storage", storageHandler);
    };
  }, []);

  return {
    pinned,
    isPinned: (id) => pinned.includes(id),
    toggle: (id) => togglePin(id),
    count: pinned.length,
  };
}
