"use client";

// Attempt session persistence — localStorage (v1).
// Swaps to Supabase RPC + RLS-secured tables later (see SQL_SCHEMA.md).
//
// Stores:
//   - the current in-progress attempt (so a page reload doesn't lose progress)
//   - the candidate's history of completed attempts (so they see their
//     progression on /dashboard/talent)
//
// All entries are keyed by professionId so a candidate can have one
// in-progress attempt per profession at most.

import { scoreAttempt, SCORING_VERSION } from "./scoring";
import type { Attempt, ScoreBreakdown, Question } from "./types";

const CURRENT_KEY = "talentrank:qcm:current:v1";
const HISTORY_KEY = "talentrank:qcm:history:v1";
const COOLDOWN_KEY = "talentrank:qcm:cooldown:v1";

/** Wait period (in milliseconds) between two attempts on the same profession.
 *  Required to keep the ranking credible — no spam-retake to game the score.
 *  1 month (30 days) — long enough to make the score feel earned, short enough
 *  that motivated candidates can re-take a few times a year. */
export const COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface CompletedAttempt {
  attempt: Attempt;
  score: ScoreBreakdown;
  scoringVersion: string;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed as T;
  } catch {
    return fallback;
  }
}

function emit(event: "current-changed" | "history-changed" | "cooldown-changed"): void {
  if (!isBrowser()) return;
  window.dispatchEvent(new CustomEvent(`talentrank:qcm:${event}`));
}

// ── Current (in-progress) attempt ────────────────────────────────────────────

export function getCurrentAttempt(professionId: string): Attempt | null {
  if (!isBrowser()) return null;
  const all = safeParse<Record<string, Attempt>>(localStorage.getItem(CURRENT_KEY), {});
  return all[professionId] ?? null;
}

export function saveCurrentAttempt(attempt: Attempt): void {
  if (!isBrowser()) return;
  const all = safeParse<Record<string, Attempt>>(localStorage.getItem(CURRENT_KEY), {});
  all[attempt.professionId] = attempt;
  localStorage.setItem(CURRENT_KEY, JSON.stringify(all));
  emit("current-changed");
}

export function clearCurrentAttempt(professionId: string): void {
  if (!isBrowser()) return;
  const all = safeParse<Record<string, Attempt>>(localStorage.getItem(CURRENT_KEY), {});
  delete all[professionId];
  localStorage.setItem(CURRENT_KEY, JSON.stringify(all));
  emit("current-changed");
}

// ── History (completed attempts) ─────────────────────────────────────────────

export function getHistory(): CompletedAttempt[] {
  if (!isBrowser()) return [];
  return safeParse<CompletedAttempt[]>(localStorage.getItem(HISTORY_KEY), []).sort(
    (a, b) => (b.attempt.finishedAt ?? 0) - (a.attempt.finishedAt ?? 0),
  );
}

export function getHistoryFor(professionId: string): CompletedAttempt[] {
  return getHistory().filter((c) => c.attempt.professionId === professionId);
}

/** Finalise an attempt: score it, append to history, clear current,
 *  start the 10-day cooldown for that profession. */
export function finalizeAttempt(attempt: Attempt, bank: Question[]): CompletedAttempt {
  const finishedAttempt: Attempt = {
    ...attempt,
    finishedAt: attempt.finishedAt ?? Date.now(),
  };
  const score = scoreAttempt(finishedAttempt, bank);
  const completed: CompletedAttempt = {
    attempt: finishedAttempt,
    score,
    scoringVersion: SCORING_VERSION,
  };
  if (isBrowser()) {
    const history = getHistory();
    history.unshift(completed);
    // Keep last 25 attempts per device — plenty for v1.
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 25)));
    clearCurrentAttempt(attempt.professionId);
    setCooldownFor(attempt.professionId, finishedAttempt.finishedAt! + COOLDOWN_MS);
    emit("history-changed");
  }
  return completed;
}

// ── Cooldown (per profession, 10 days) ───────────────────────────────────────

/** Returns the epoch ms when the next attempt is allowed, or null if no
 *  cooldown is active for this profession. */
export function getCooldownExpiresAt(professionId: string): number | null {
  if (!isBrowser()) return null;
  const all = safeParse<Record<string, number>>(
    localStorage.getItem(COOLDOWN_KEY),
    {},
  );
  const ts = all[professionId];
  if (!ts || Date.now() >= ts) return null;
  return ts;
}

/** Manually set or extend a cooldown (used by finalizeAttempt; also exposed
 *  for tests / admin tooling). */
export function setCooldownFor(professionId: string, expiresAt: number): void {
  if (!isBrowser()) return;
  const all = safeParse<Record<string, number>>(
    localStorage.getItem(COOLDOWN_KEY),
    {},
  );
  all[professionId] = expiresAt;
  localStorage.setItem(COOLDOWN_KEY, JSON.stringify(all));
  emit("cooldown-changed");
}

/** Admin / dev: wipe cooldown for a profession so the next attempt starts
 *  immediately. NOT exposed in the candidate UI. */
export function clearCooldown(professionId: string): void {
  if (!isBrowser()) return;
  const all = safeParse<Record<string, number>>(
    localStorage.getItem(COOLDOWN_KEY),
    {},
  );
  delete all[professionId];
  localStorage.setItem(COOLDOWN_KEY, JSON.stringify(all));
  emit("cooldown-changed");
}

export function subscribeCooldown(cb: () => void): () => void {
  if (!isBrowser()) return () => {};
  const handler = () => cb();
  window.addEventListener("talentrank:qcm:cooldown-changed", handler);
  window.addEventListener("storage", (e) => {
    if (e.key === COOLDOWN_KEY) cb();
  });
  return () => window.removeEventListener("talentrank:qcm:cooldown-changed", handler);
}

/** Best (= highest final score) completed attempt for a given profession. */
export function getBestAttempt(professionId: string): CompletedAttempt | null {
  const hist = getHistoryFor(professionId);
  if (hist.length === 0) return null;
  return hist.reduce((best, c) => (c.score.final > best.score.final ? c : best), hist[0]);
}

// ── Reactive subscriptions ───────────────────────────────────────────────────

export function subscribeCurrent(cb: () => void): () => void {
  if (!isBrowser()) return () => {};
  const handler = () => cb();
  window.addEventListener("talentrank:qcm:current-changed", handler);
  window.addEventListener("storage", (e) => {
    if (e.key === CURRENT_KEY) cb();
  });
  return () => window.removeEventListener("talentrank:qcm:current-changed", handler);
}

export function subscribeHistory(cb: () => void): () => void {
  if (!isBrowser()) return () => {};
  const handler = () => cb();
  window.addEventListener("talentrank:qcm:history-changed", handler);
  window.addEventListener("storage", (e) => {
    if (e.key === HISTORY_KEY) cb();
  });
  return () => window.removeEventListener("talentrank:qcm:history-changed", handler);
}
