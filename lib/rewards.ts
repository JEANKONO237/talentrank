// TalentRank — Rewards system per league
// ----------------------------------------------------------------------------
// La promesse "monte d'une ligue" doit être MATÉRIELLE, sinon c'est creux.
// Cette table définit ce que chaque tier débloque concrètement :
//   - visibilité (où ton profil apparaît)
//   - vitesse (priority queue côté recruteur)
//   - business (commission TalentRank)
//   - signaux (badges, signature email, featured)
//   - coaching / extras
//
// Source de vérité unique. Les UI (LeaguesSection, /dashboard, /pricing si on
// le construit, FAQ) doivent lire cette table — JAMAIS hardcoder.
//
// Convention copy : chaque reward = 1 phrase courte, verbe d'abord, FR.
// ----------------------------------------------------------------------------

import type { TierId } from "./tiers";

export interface Reward {
  /** Lucide icon name, ou emoji si pas d'équivalent élégant. */
  icon: "Eye" | "Zap" | "Mail" | "Percent" | "Crown" | "Sparkles" | "Star" | "Bell" | "Award" | "Heart";
  /** Phrase courte, verbe d'abord. */
  label: string;
  /** Tooltip / sous-ligne optionnelle. */
  detail?: string;
  /** Si la ligne est "phare" → bigger / accent. */
  hero?: boolean;
}

export interface TierRewards {
  /** Catchphrase de la ligue, 1 ligne, sous le nom. */
  tagline: string;
  /** % de commission TalentRank prélevée sur les missions. */
  commission: number;
  /** Délai garanti côté recruteur (réponse à une demande d'entretien). */
  priorityHours: number | null;
  /** Liste ordonnée des rewards (les hero=true sont mis en avant). */
  rewards: Reward[];
}

// ─── Le tableau ──────────────────────────────────────────────────────────
// Pyramide volontairement asymétrique : Diamant ≫ Or > Saphir > Argent > Bronze
// > Nouveau. Chaque palier ajoute une chose tangible. Le Nouveau a quand même
// quelque chose (sinon c'est punitif).
export const REWARDS: Record<TierId, TierRewards> = {
  elite: {
    tagline: "Tu es ce que les autres veulent devenir.",
    commission: 0,
    priorityHours: 24,
    rewards: [
      { icon: "Crown",    label: "Mise en avant permanente sur /chasse", hero: true },
      { icon: "Zap",      label: "Accès 48h avant tous aux missions premium" },
      { icon: "Percent",  label: "0 % de commission TalentRank", detail: "Sur toutes tes missions, à vie tant que tu restes Diamant", hero: true },
      { icon: "Star",     label: "Profil featured sur la home (rotation)" },
      { icon: "Bell",     label: "Garantie réponse recruteur < 24 h" },
      { icon: "Heart",    label: "Coaching 1 h offert chaque mois" },
      { icon: "Mail",     label: "Badge Diamant signature email + export LinkedIn" },
    ],
  },
  senior: {
    tagline: "Talent confirmé. Tu te démarques.",
    commission: 7,
    priorityHours: 48,
    rewards: [
      { icon: "Eye",      label: "Mise en avant régulière sur /chasse", hero: true },
      { icon: "Zap",      label: "Accès 24h avant tous aux nouvelles missions" },
      { icon: "Percent",  label: "7 % de commission au lieu de 15 %", hero: true },
      { icon: "Star",     label: "Profil featured 1 semaine par mois" },
      { icon: "Bell",     label: "Garantie réponse recruteur < 48 h" },
      { icon: "Mail",     label: "Badge Or signature email" },
    ],
  },
  trending: {
    tagline: "En pleine ascension. On te voit monter.",
    commission: 10,
    priorityHours: 72,
    rewards: [
      { icon: "Eye",      label: "Visibilité boostée dans tes classements métier", hero: true },
      { icon: "Bell",     label: "Notifications missions matching dans ton métier" },
      { icon: "Percent",  label: "10 % de commission au lieu de 15 %" },
      { icon: "Mail",     label: "Mention trimestrielle dans la newsletter recruteurs" },
    ],
  },
  rising: {
    tagline: "Tu construis. Ton profil prend de la valeur.",
    commission: 15,
    priorityHours: null,
    rewards: [
      { icon: "Eye",      label: "Indexé dans tous les classements de ton métier", hero: true },
      { icon: "Bell",     label: "Accès aux missions ouvertes" },
      { icon: "Award",    label: "Badge Argent sur ton profil public" },
    ],
  },
  emerging: {
    tagline: "Tu démarres fort. Le système t'aide.",
    commission: 15,
    priorityHours: null,
    rewards: [
      { icon: "Eye",      label: "Profil visible dans ton métier", hero: true },
      { icon: "Bell",     label: "Accès aux missions standard" },
      { icon: "Heart",    label: "1 review pro / mois pour feedback gratuit", detail: "Un mentor donne 5 min de retour structuré sur ton portfolio" },
    ],
  },
  new: {
    tagline: "Bienvenue. L'aventure commence ici.",
    commission: 15,
    priorityHours: null,
    rewards: [
      { icon: "Sparkles", label: "Onboarding guidé", hero: true },
      { icon: "Award",    label: "3 questions d'entraînement avant le QCM officiel" },
      { icon: "Eye",      label: "Accès lecture aux classements (non encore listé)" },
    ],
  },
};

/** Phrase courte qui décrit le saut quand on passe de `from` à `to`. */
export function rewardDiff(from: TierId, to: TierId): string {
  const fromR = REWARDS[from];
  const toR = REWARDS[to];
  if (fromR.commission > toR.commission) {
    const saved = fromR.commission - toR.commission;
    return `−${saved} pt de commission · ${toR.tagline.toLowerCase()}`;
  }
  return toR.tagline;
}
