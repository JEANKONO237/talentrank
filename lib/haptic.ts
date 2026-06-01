"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Haptic feedback — audit Anya G2-Anya-1.
//
// Sur mobile (Android principalement), les Web Vibration API permettent
// un retour tactile sans son. Indispensable pour les users en open-space
// silencieux (le boing audio est coupé mais le haptic reste).
//
// Patterns :
//   light  → 10ms (toggle simple : follow, mute)
//   medium → [10, 30, 10] (action confirmée : shortlist, choice screen)
//   strong → [20, 50, 20, 50, 20] (succès, milestone unlock)
//
// Respecte prefers-reduced-motion (cohérent avec le sound module).
// Pas de fallback iOS (Safari mobile ne supporte pas vibrate() — silencieux).
// ─────────────────────────────────────────────────────────────────────────────

export type HapticIntensity = "light" | "medium" | "strong";

const PATTERNS: Record<HapticIntensity, number | number[]> = {
  light: 10,
  medium: [10, 30, 10],
  strong: [20, 50, 20, 50, 20],
};

function shouldVibrate(): boolean {
  if (typeof window === "undefined") return false;
  if (!("vibrate" in navigator)) return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  return true;
}

/** Déclenche un retour haptique sur mobile (Android). No-op sur desktop/iOS. */
export function triggerHaptic(intensity: HapticIntensity = "light"): void {
  if (!shouldVibrate()) return;
  try {
    navigator.vibrate(PATTERNS[intensity]);
  } catch {
    /* ignore */
  }
}
