"use client";

import { useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Talent actions storage v1 — Queue (file de recrutement) + Follow (veille).
//
// Persistence localStorage en attendant Supabase :
//   - tr:studio:queue:v1     → talent_slugs[] (shortlist)
//   - tr:studio:followed:v1  → talent_slugs[] (veille)
//
// Migration future : tables studio_queue + studio_followed avec colonnes
// (studio_id, talent_id, added_at, note?, stage?).
// Le stage est utile pour le pipeline : "to_review" / "interviewing" / "rejected".
// ─────────────────────────────────────────────────────────────────────────────

const QUEUE_KEY = "tr:studio:queue:v1";
const FOLLOW_KEY = "tr:studio:followed:v1";
const EVENT = "tr:talent-actions-changed";

function readArr(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string");
  } catch {
    return [];
  }
}

function writeArr(key: string, list: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {
    /* ignore */
  }
}

// ─── Queue (file de recrutement / shortlist) ────────────────────────────

export function getQueued(): string[] {
  return readArr(QUEUE_KEY);
}

export function toggleQueued(slug: string): boolean {
  const list = readArr(QUEUE_KEY);
  if (list.includes(slug)) {
    writeArr(QUEUE_KEY, list.filter((s) => s !== slug));
    return false;
  }
  writeArr(QUEUE_KEY, [slug, ...list].slice(0, 200));
  return true;
}

// ─── Follow (veille) ────────────────────────────────────────────────────

export function getFollowed(): string[] {
  return readArr(FOLLOW_KEY);
}

export function toggleFollowed(slug: string): boolean {
  const list = readArr(FOLLOW_KEY);
  if (list.includes(slug)) {
    writeArr(FOLLOW_KEY, list.filter((s) => s !== slug));
    return false;
  }
  writeArr(FOLLOW_KEY, [slug, ...list].slice(0, 500));
  return true;
}

// ─── Hook réactif ────────────────────────────────────────────────────────

export function useTalentActions(): {
  queued: string[];
  followed: string[];
  isQueued: (slug: string) => boolean;
  isFollowed: (slug: string) => boolean;
  toggleQueue: (slug: string) => boolean;
  toggleFollow: (slug: string) => boolean;
  queuedCount: number;
  followedCount: number;
} {
  const [queued, setQueued] = useState<string[]>([]);
  const [followed, setFollowed] = useState<string[]>([]);

  useEffect(() => {
    setQueued(readArr(QUEUE_KEY));
    setFollowed(readArr(FOLLOW_KEY));
    const handler = () => {
      setQueued(readArr(QUEUE_KEY));
      setFollowed(readArr(FOLLOW_KEY));
    };
    window.addEventListener(EVENT, handler);
    const storageHandler = (e: StorageEvent) => {
      if (e.key === QUEUE_KEY || e.key === FOLLOW_KEY) handler();
    };
    window.addEventListener("storage", storageHandler);
    return () => {
      window.removeEventListener(EVENT, handler);
      window.removeEventListener("storage", storageHandler);
    };
  }, []);

  return {
    queued,
    followed,
    isQueued: (slug) => queued.includes(slug),
    isFollowed: (slug) => followed.includes(slug),
    toggleQueue: (slug) => toggleQueued(slug),
    toggleFollow: (slug) => toggleFollowed(slug),
    queuedCount: queued.length,
    followedCount: followed.length,
  };
}
