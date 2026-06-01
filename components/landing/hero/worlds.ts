import type { TierId } from "@/lib/tiers";

// ─────────────────────────────────────────────────────────────────────────────
// Les 5 mondes — data partagée entre WorldsGrid + WorldCard + tests.
//
// Chaque catégorie = un MONDE avec sa mascotte, son ambiance, sa palette.
// Tailles et positions volontairement asymétriques (CSS grid templates) pour
// casser l'effet "grille SaaS" et donner une sensation de carte/territoire.
// ─────────────────────────────────────────────────────────────────────────────

export interface World {
  href: string;
  /** Glyph optionnel — kept for SEO / og:image generation, plus affiché. */
  emoji?: string;
  name: string;
  /** Métiers exemples concrets pour donner de l'identité. */
  roles: string;
  /** Mascotte LeagueMascot id. */
  mascot: TierId;
  /** Couleur d'ambiance — halo + accent. */
  accent: string;
  /** Background dégradé doux unique au monde. */
  bg: string;
  /** Position dans la grille 4×2 (col-span, row-span). */
  span: string;
  /** Badge "hot" si le monde est en effervescence. */
  badge?: string;
}

export const WORLDS: World[] = [
  {
    href: "/metiers/creative",
    emoji: "🎨",
    name: "Création & Visuel",
    roles: "Animateurs · VFX · Concept Art · Storyboard",
    mascot: "emerging", // renard
    accent: "#F472B6",
    bg: "linear-gradient(135deg, #FFE4F2 0%, #FFD0E5 100%)",
    span: "sm:col-span-2 sm:row-span-2",
    badge: "🔥 Le plus actif",
  },
  {
    href: "/metiers/tech",
    emoji: "💻",
    name: "Tech & Code",
    roles: "Frontend · Backend · DevOps · Mobile",
    mascot: "elite", // dragon
    accent: "#22D3EE",
    bg: "linear-gradient(135deg, #E0F7FF 0%, #BAEEFF 100%)",
    span: "sm:col-span-2",
  },
  {
    href: "/metiers/data",
    emoji: "🧠",
    name: "Data & IA",
    roles: "Data Science · ML · Analytics · MLOps",
    mascot: "trending", // aigle
    accent: "#A78BFA",
    bg: "linear-gradient(135deg, #EEE9FF 0%, #DDD0FF 100%)",
    span: "sm:col-span-2",
  },
  {
    href: "/metiers/hospitality",
    emoji: "🥖",
    name: "Artisanat",
    roles: "Boulangers · Chefs · Pâtissiers · Sommeliers",
    mascot: "new", // poussin
    accent: "#FFC800",
    bg: "linear-gradient(135deg, #FFF6D6 0%, #FFEAA0 100%)",
    span: "sm:col-span-1",
  },
  {
    href: "/metiers/health",
    emoji: "🩺",
    name: "Santé",
    roles: "Médecins · Infirmiers · Kinés · Sage-femmes",
    mascot: "senior", // lion
    accent: "#FF8FA3",
    bg: "linear-gradient(135deg, #FFE8EC 0%, #FFCDD2 100%)",
    span: "sm:col-span-1",
  },
];
