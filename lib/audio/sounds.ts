"use client";

import { useCallback, useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// TalentRank — Sound effects (Web Audio API, zero-asset).
//
// Génère les sons à la volée via OscillatorNode + GainNode (pas de fichier
// MP3/WAV à uploader). Discret, satisfaisant, économe en bundle.
//
// Sons disponibles :
//   - playShortlist()   "boing" montant (shortlist talent → joie)
//   - playUnshortlist() "boing" descendant (retirer → soft)
//   - playWiggle()      "pop" court (autres micro-interactions)
//   - playSuccess()     "ta-da" 3 notes (gros succès)
//
// Respect du mute :
//   - localStorage tr:sound-muted=1 → tout silencieux
//   - prefers-reduced-motion → tout silencieux (les sons sont du motion sonore)
//
// AudioContext est lazy-initié au premier user gesture (Chrome bloque
// l'autoplay sinon). Le premier playXxx() crée le contexte.
// ─────────────────────────────────────────────────────────────────────────────

const MUTE_KEY = "tr:sound-muted";
const MUTE_EVENT = "tr:sound-muted-changed";

let _ctx: AudioContext | null = null;

// Debounce par son — audit Léo G2-Léo-2 : 10 shortlists rapides = 10 boings
// devient saoulant. On bloque le re-play d'un MÊME son dans les 500ms.
const _lastPlayedAt = new Map<string, number>();
const DEBOUNCE_MS = 500;

function isDebounced(key: string): boolean {
  const now = Date.now();
  const last = _lastPlayedAt.get(key) ?? 0;
  if (now - last < DEBOUNCE_MS) return true;
  _lastPlayedAt.set(key, now);
  return false;
}

function ensureContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (_ctx) return _ctx;
  type AudioCtor = typeof AudioContext;
  const Ctor: AudioCtor | undefined =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: AudioCtor }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    _ctx = new Ctor();
  } catch {
    return null;
  }
  return _ctx;
}

function shouldPlay(): boolean {
  if (typeof window === "undefined") return false;
  if (localStorage.getItem(MUTE_KEY) === "1") return false;
  // prefers-reduced-motion : on désactive aussi le son par cohérence
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  return true;
}

// ─── Mute toggle ──────────────────────────────────────────────────────────

export function isMuted(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(MUTE_KEY) === "1";
}

export function setMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  if (muted) localStorage.setItem(MUTE_KEY, "1");
  else localStorage.removeItem(MUTE_KEY);
  window.dispatchEvent(new CustomEvent(MUTE_EVENT));
}

export function useMuted(): { muted: boolean; toggle: () => void } {
  const [muted, setMutedState] = useState(false);
  useEffect(() => {
    setMutedState(isMuted());
    const handler = () => setMutedState(isMuted());
    window.addEventListener(MUTE_EVENT, handler);
    return () => window.removeEventListener(MUTE_EVENT, handler);
  }, []);
  return {
    muted,
    toggle: useCallback(() => setMuted(!isMuted()), []),
  };
}

// ─── Tone helpers ─────────────────────────────────────────────────────────

interface ToneOptions {
  /** Fréquence start en Hz. */
  freqStart: number;
  /** Fréquence end (pour pitch sweep). */
  freqEnd?: number;
  /** Durée en ms. */
  durationMs: number;
  /** Type d'oscillateur. */
  type?: OscillatorType;
  /** Volume pic (0-1). */
  peak?: number;
  /** Délai avant démarrage (ms, pour chaîner des notes). */
  delayMs?: number;
}

function playTone({
  freqStart,
  freqEnd,
  durationMs,
  type = "sine",
  peak = 0.18,
  delayMs = 0,
}: ToneOptions): void {
  if (!shouldPlay()) return;
  const ctx = ensureContext();
  if (!ctx) return;
  // Resume si suspendu (page après cooldown)
  if (ctx.state === "suspended") void ctx.resume();

  const start = ctx.currentTime + delayMs / 1000;
  const end = start + durationMs / 1000;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, start);
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 0.01), end);
  }

  // Enveloppe ADSR rapide — attack 10ms, decay/release pour le reste
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peak, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(end + 0.02);
}

// ─── Sound presets ────────────────────────────────────────────────────────

/** "Boing" satisfaisant : pitch monte rapidement (shortlist / opt-in).
 *  Combine deux ondes pour un timbre rebond. Debounced 500ms. */
export function playShortlist(): void {
  if (isDebounced("shortlist")) return;
  playTone({ freqStart: 320, freqEnd: 720, durationMs: 110, type: "triangle", peak: 0.22 });
  playTone({ freqStart: 720, freqEnd: 540, durationMs: 180, type: "sine", peak: 0.16, delayMs: 90 });
  playTone({ freqStart: 1400, freqEnd: 1800, durationMs: 80, type: "sine", peak: 0.06, delayMs: 40 });
}

/** "Whoop" descendant : retirer de la file. Debounced 500ms. */
export function playUnshortlist(): void {
  if (isDebounced("unshortlist")) return;
  playTone({ freqStart: 540, freqEnd: 260, durationMs: 180, type: "triangle", peak: 0.14 });
}

/** "Pop" très bref pour micro-interactions (follow on/off). Debounced 500ms. */
export function playWiggle(): void {
  if (isDebounced("wiggle")) return;
  playTone({ freqStart: 600, freqEnd: 900, durationMs: 60, type: "sine", peak: 0.10 });
}

/** "Ta-da" 3 notes ascendantes pour gros succès (QCM passé, ligue montée). */
export function playSuccess(): void {
  // Do
  playTone({ freqStart: 523, durationMs: 120, type: "triangle", peak: 0.18, delayMs: 0 });
  // Mi
  playTone({ freqStart: 659, durationMs: 120, type: "triangle", peak: 0.18, delayMs: 120 });
  // Sol soutenu
  playTone({
    freqStart: 784,
    freqEnd: 880,
    durationMs: 320,
    type: "triangle",
    peak: 0.20,
    delayMs: 240,
  });
}
