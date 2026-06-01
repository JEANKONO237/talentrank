// TalentRank — Experience class system (Solo Leveling inspired)
// ----------------------------------------------------------------------------
// Maps years of experience to a single-letter rank S → E, with the same
// dramatic feel as the Solo Leveling "Hunter" classes. S is the rarest /
// most senior; E is the entry-level "junior" rank.
//
// This is a SEPARATE axis from the tier (Diamant/Or/…). The tier reflects
// the talent's score percentile; the experience class reflects raw years
// of practice in the field.

export type ExperienceClassId = "S" | "A" | "B" | "C" | "D" | "E";

export interface ExperienceClass {
  id: ExperienceClassId;
  /** Years range (inclusive) — `null` upper = no cap. */
  minYears: number;
  maxYears: number | null;
  /** Short French label (e.g. "Rang S"). */
  label: string;
  /** Industry seniority equivalent (Sénior / Junior / etc.). */
  seniority: string;
  /** One-liner pitch — used on class-picker cards. */
  description: string;
  /** Long blurb for the class-picker hero card. */
  blurb: string;
  /** Mascot emoji that hints at the class vibe. */
  emoji: string;
  /** Primary colour. */
  color: string;
  /** Highlight (used for inner gradient stop). */
  highlight: string;
  /** Hue background (used for the glow ring). */
  ring: string;
}

// Ordered best → worst (S first).
export const EXPERIENCE_CLASSES: Record<ExperienceClassId, ExperienceClass> = {
  S: {
    id: "S",
    minYears: 20,
    maxYears: null,
    label: "Rang S",
    seniority: "Maître",
    description: "20+ ans · Top vétérans",
    blurb: "Les références absolues. Maîtrise totale, leadership d'industrie, profils ultra rares.",
    emoji: "👑",
    color: "#FF3B30",
    highlight: "#FFB4AE",
    ring: "rgba(255,59,48,0.4)",
  },
  A: {
    id: "A",
    minYears: 15,
    maxYears: 19,
    label: "Rang A",
    seniority: "Sénior +",
    description: "15-19 ans · Leaders",
    blurb: "Profils de direction technique. Vision long terme, mentorat, deep expertise.",
    emoji: "⚡",
    color: "#FF8A00",
    highlight: "#FFD9A8",
    ring: "rgba(255,138,0,0.4)",
  },
  B: {
    id: "B",
    minYears: 10,
    maxYears: 14,
    label: "Rang B",
    seniority: "Sénior",
    description: "10-14 ans · Maîtrise",
    blurb: "Maîtrise complète de leur métier. Autonomie totale sur des projets complexes.",
    emoji: "🔥",
    color: "#FFC800",
    highlight: "#FFEAA0",
    ring: "rgba(255,200,0,0.4)",
  },
  C: {
    id: "C",
    minYears: 7,
    maxYears: 9,
    label: "Rang C",
    seniority: "Confirmé",
    description: "7-9 ans · Autonomie",
    blurb: "Solides bases. Capables de prendre des projets en main du brief à la livraison.",
    emoji: "💎",
    color: "#58CC02",
    highlight: "#B0EE82",
    ring: "rgba(88,204,2,0.4)",
  },
  D: {
    id: "D",
    minYears: 4,
    maxYears: 6,
    label: "Rang D",
    seniority: "Intermédiaire",
    description: "4-6 ans · Solides",
    blurb: "Premiers projets autonomes. Excellent rapport qualité/prix sur des missions ciblées.",
    emoji: "🌟",
    color: "#1CB0F6",
    highlight: "#9CDFFF",
    ring: "rgba(28,176,246,0.4)",
  },
  E: {
    id: "E",
    minYears: 0,
    maxYears: 3,
    label: "Rang E",
    seniority: "Junior",
    description: "0-3 ans · Énergie",
    blurb: "Frais, motivés, ambitieux. Idéal pour former et bâtir sur du long terme.",
    emoji: "🌱",
    color: "#94A3B8",
    highlight: "#CBD5E1",
    ring: "rgba(148,163,184,0.4)",
  },
};

export const EXPERIENCE_ORDER: ExperienceClass[] = [
  EXPERIENCE_CLASSES.S,
  EXPERIENCE_CLASSES.A,
  EXPERIENCE_CLASSES.B,
  EXPERIENCE_CLASSES.C,
  EXPERIENCE_CLASSES.D,
  EXPERIENCE_CLASSES.E,
];

export function experienceClassForYears(years: number): ExperienceClass {
  if (years >= 20) return EXPERIENCE_CLASSES.S;
  if (years >= 15) return EXPERIENCE_CLASSES.A;
  if (years >= 10) return EXPERIENCE_CLASSES.B;
  if (years >= 7) return EXPERIENCE_CLASSES.C;
  if (years >= 4) return EXPERIENCE_CLASSES.D;
  return EXPERIENCE_CLASSES.E;
}
