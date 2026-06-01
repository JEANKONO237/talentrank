// TalentRank — Tier system (Duolingo-inspired, animal emblems)
// ----------------------------------------------------------------------------
// Each tier is a "league" with a mascot animal, an emblem emoji, a signature
// colour and an aura. The system is positive: even the lowest tier has a
// friendly mascot, never a "you are bad" framing.
//
// We keep the legacy English IDs (elite/senior/…) for backward compatibility
// with the existing schema + score function, but the user-facing labels +
// emblems are entirely new.

export type TierId = "elite" | "senior" | "trending" | "rising" | "emerging" | "new";

export interface Tier {
  id: TierId;
  /** French label shown to the user. */
  label: string;
  /** Animal emoji used as the emblem core. */
  emoji: string;
  /** Animal name (French) for accessibility / subtitles. */
  animal: string;
  /** Percentile band (highest score percentile this tier covers). */
  range: string;
  /** Short label (for compact pills). */
  short: string;
  /** Primary tier colour (HEX). Drives glow + ring + label. */
  color: string;
  /** A complementary highlight used for the inner gradient stop. */
  highlight: string;
  /** Short motto for the tier. */
  motto: string;
  // ─── Legacy fields kept so existing components don't break ──
  ring: string;
  badgeBg: string;
  badgeText: string;
}

export const TIERS: Record<TierId, Tier> = {
  elite: {
    id: "elite",
    label: "Diamant",
    short: "Diamant",
    emoji: "🐉",
    animal: "Dragon",
    range: "Top 1%",
    color: "#22D3EE",
    highlight: "#A5F3FC",
    motto: "Légende absolue",
    ring: "ring-cyan-400/40",
    badgeBg: "bg-cyan-400/10 border-cyan-400/30",
    badgeText: "text-cyan-600",
  },
  senior: {
    id: "senior",
    label: "Or",
    short: "Or",
    emoji: "🦁",
    animal: "Lion",
    range: "Top 5%",
    color: "#F59E0B",
    highlight: "#FCD34D",
    motto: "Talent confirmé",
    ring: "ring-amber-400/50",
    badgeBg: "bg-amber-400/10 border-amber-400/40",
    badgeText: "text-amber-600",
  },
  trending: {
    id: "trending",
    label: "Saphir",
    short: "Saphir",
    emoji: "🦅",
    animal: "Aigle",
    range: "Top 10%",
    color: "#6366F1",
    highlight: "#A5B4FC",
    motto: "En pleine ascension",
    ring: "ring-indigo-400/40",
    badgeBg: "bg-indigo-400/10 border-indigo-400/30",
    badgeText: "text-indigo-600",
  },
  rising: {
    id: "rising",
    label: "Argent",
    short: "Argent",
    emoji: "🐺",
    animal: "Loup",
    range: "Top 25%",
    color: "#94A3B8",
    highlight: "#E2E8F0",
    motto: "Talent qui monte",
    ring: "ring-slate-400/40",
    badgeBg: "bg-slate-300/20 border-slate-400/30",
    badgeText: "text-slate-700",
  },
  emerging: {
    id: "emerging",
    label: "Bronze",
    short: "Bronze",
    emoji: "🦊",
    animal: "Renard",
    range: "Top 50%",
    color: "#C97A3B",
    highlight: "#F4B26A",
    motto: "Tu démarres fort",
    ring: "ring-orange-300/40",
    badgeBg: "bg-orange-200/30 border-orange-300/40",
    badgeText: "text-orange-700",
  },
  new: {
    id: "new",
    label: "Nouveau",
    short: "Nouveau",
    emoji: "🐣",
    animal: "Poussin",
    range: "Bienvenue",
    color: "#A3A380",
    highlight: "#D9D6B0",
    motto: "L'aventure commence",
    ring: "ring-stone-400/30",
    badgeBg: "bg-stone-200/30 border-stone-300/30",
    badgeText: "text-stone-700",
  },
};

/** Ordered list, best first. Use for the climb visualization. */
export const TIER_ORDER: Tier[] = [
  TIERS.elite,
  TIERS.senior,
  TIERS.trending,
  TIERS.rising,
  TIERS.emerging,
  TIERS.new,
];

export function tierForPercentile(pct: number): Tier {
  if (pct <= 1) return TIERS.elite;
  if (pct <= 5) return TIERS.senior;
  if (pct <= 10) return TIERS.trending;
  if (pct <= 25) return TIERS.rising;
  if (pct <= 50) return TIERS.emerging;
  return TIERS.new;
}

/** "Top X%" → "Top X%" (kept for readability of imports). */
export function formatTopPercent(pct: number): string {
  if (pct <= 1) return "Top 1%";
  if (pct <= 5) return "Top 5%";
  if (pct <= 10) return "Top 10%";
  if (pct <= 25) return "Top 25%";
  if (pct <= 50) return "Top 50%";
  return "Émergent";
}
