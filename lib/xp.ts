// TalentRank — XP & Level system (global progression 1-50)
// ----------------------------------------------------------------------------
// Le score QCM est verrouillé 1 mois (anti-cheat). Sans autre signal de
// progression, l'utilisateur n'a aucune raison de revenir entre deux passages.
// Le système XP comble ce vide : chaque action de profil-building, mission,
// review, etc. octroie de l'XP, qui pousse un niveau global 1→50.
//
// Important : XP et tier (ligue) sont DEUX axes orthogonaux.
//   - Tier  = compétence pure (calculée à partir du score QCM par métier)
//   - Level = engagement / sérieux de la présence sur la plateforme
// Ensemble, ils racontent : "Diamant niveau 32" = très bon ET très impliqué.
// Un Bronze niveau 45 est respecté pour son sérieux ; un Diamant niveau 3
// signale "vient de débarquer".
//
// Source de vérité unique. Les UI lisent ce fichier, ne hardcodent rien.
// ----------------------------------------------------------------------------

/** Maximum atteignable. Plafond cosmétique — peut être augmenté plus tard. */
export const MAX_LEVEL = 50;

// ─── Sources d'XP ────────────────────────────────────────────────────────
// IDs stables pour le tracking côté DB. Ne jamais les renommer (utilisés
// comme PK dans la table xp_events).
export interface XpSource {
  /** Stable id, snake_case. */
  id: string;
  /** Phrase verbe-d'abord, FR. */
  label: string;
  /** XP octroyé par occurrence. */
  xp: number;
  /** "once" = 1× à vie ; "monthly" = 1×/mois ; "daily" ; "repeat" = sans limite. */
  cadence: "once" | "monthly" | "daily" | "repeat";
  /** Catégorie pour grouper l'affichage. */
  category: "profil" | "qcm" | "missions" | "social" | "engagement";
}

export const XP_SOURCES: XpSource[] = [
  // ── Profil
  { id: "complete_profile",   label: "Compléter ton profil (bio, photo, dispo, lien)", xp: 80, cadence: "once",    category: "profil" },
  { id: "add_portfolio",      label: "Ajouter un portfolio / showreel",                xp: 60, cadence: "once",    category: "profil" },
  { id: "connect_github",     label: "Connecter ton GitHub",                           xp: 30, cadence: "once",    category: "profil" },
  { id: "connect_artstation", label: "Connecter ton ArtStation",                       xp: 30, cadence: "once",    category: "profil" },
  { id: "connect_linkedin",   label: "Connecter ton LinkedIn",                         xp: 20, cadence: "once",    category: "profil" },

  // ── QCM
  { id: "qcm_complete",       label: "Passer le QCM officiel",                         xp: 100, cadence: "monthly", category: "qcm" },
  { id: "qcm_personal_best",  label: "Battre ton meilleur score QCM",                  xp: 50,  cadence: "monthly", category: "qcm" },
  { id: "qcm_tier_up",        label: "Monter d'une ligue",                             xp: 150, cadence: "repeat",  category: "qcm" },

  // ── Missions
  { id: "mission_accept",     label: "Accepter une mission via TalentRank",            xp: 60,  cadence: "repeat",  category: "missions" },
  { id: "mission_5star",      label: "Mission complétée 5★",                           xp: 120, cadence: "repeat",  category: "missions" },
  { id: "review_received",    label: "Recevoir une review pro",                        xp: 40,  cadence: "repeat",  category: "missions" },

  // ── Social
  { id: "referral_signup",    label: "Un ami parrainé s'inscrit",                      xp: 30,  cadence: "repeat",  category: "social" },
  { id: "referral_qcm",       label: "Un parrainé passe son QCM",                      xp: 80,  cadence: "repeat",  category: "social" },
  { id: "share_score",        label: "Partager ton score sur les réseaux",             xp: 15,  cadence: "monthly", category: "social" },

  // ── Engagement
  { id: "daily_checkin",      label: "Connexion quotidienne",                          xp: 5,   cadence: "daily",   category: "engagement" },
  { id: "weekly_streak",      label: "Streak hebdomadaire (7 jours)",                  xp: 50,  cadence: "repeat",  category: "engagement" },
];

// ─── Courbe XP → Level ───────────────────────────────────────────────────
// Total XP requis pour ATTEINDRE le niveau N : `xpForLevel(N)`
// On veut une montée rapide en début (récompense l'onboarding) et lente en
// haut (rareté du 50). Formule cubique douce : `25 * N^2.4`
//
//   Level 1   → 0 XP        (point de départ)
//   Level 2   → 130 XP      (1 QCM + complete profile suffit)
//   Level 5   → 700 XP      (~1 mois actif)
//   Level 10  → 2 400 XP    (~3 mois actif)
//   Level 25  → 18 700 XP   (~1 an actif)
//   Level 50  → 132 000 XP  (Maître — réservé aux power users)

export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level >= MAX_LEVEL) return Math.round(25 * Math.pow(MAX_LEVEL, 2.4));
  return Math.round(25 * Math.pow(level, 2.4));
}

export function levelForXp(xp: number): number {
  if (xp <= 0) return 1;
  // Inverse de la formule : level = (xp / 25)^(1/2.4)
  const level = Math.floor(Math.pow(xp / 25, 1 / 2.4));
  return Math.max(1, Math.min(MAX_LEVEL, level));
}

/** Progress (0-1) vers le niveau suivant. */
export function progressInLevel(xp: number): number {
  const lv = levelForXp(xp);
  if (lv >= MAX_LEVEL) return 1;
  const cur = xpForLevel(lv);
  const next = xpForLevel(lv + 1);
  if (next === cur) return 1;
  return Math.min(1, Math.max(0, (xp - cur) / (next - cur)));
}

/** XP qu'il reste à gagner pour atteindre le niveau suivant. */
export function xpToNextLevel(xp: number): number {
  const lv = levelForXp(xp);
  if (lv >= MAX_LEVEL) return 0;
  return xpForLevel(lv + 1) - xp;
}

// ─── Milestones / unlocks par niveau ──────────────────────────────────────
// Pas tous les niveaux portent un unlock — seuls les "paliers".
// Inspiré des perks Steam / des nameplates Discord.

export interface LevelMilestone {
  level: number;
  title: string;
  description: string;
  unlock: string;
}

export const LEVEL_MILESTONES: LevelMilestone[] = [
  { level: 1,  title: "Novice",         description: "Tu débarques.",                        unlock: "Accès lecture aux classements" },
  { level: 5,  title: "Apprenti",       description: "Profil propre, premiers signaux.",     unlock: "Tu peux postuler à des missions" },
  { level: 10, title: "Compagnon",      description: "Présence régulière, profil complet.",  unlock: "1 jour de profil featured / mois" },
  { level: 15, title: "Habitué",        description: "On commence à te reconnaître.",        unlock: "Nameplate Compagnon visible publiquement" },
  { level: 20, title: "Vétéran",        description: "Pilier discret.",                       unlock: "Priorité queue +1 cran" },
  { level: 25, title: "Pro",            description: "Tu fais partie du paysage.",            unlock: "Coaching peer-to-peer gratuit" },
  { level: 30, title: "Architecte",     description: "Tu construis ta place.",                unlock: "Profil featured 1 semaine / mois" },
  { level: 35, title: "Mentor",         description: "Tu peux guider d'autres talents.",      unlock: "Statut Mentor + droit de review" },
  { level: 40, title: "Expert",         description: "Référence reconnue.",                   unlock: "1 session coaching 1-1 offerte" },
  { level: 45, title: "Légende locale", description: "Difficile à manquer.",                  unlock: "Nameplate Légende + ring spécial" },
  { level: 50, title: "Maître",         description: "Au sommet du sommet.",                  unlock: "−5% commission à vie + Hall of Fame" },
];

/** Renvoie le milestone actuel (le plus haut atteint). */
export function currentMilestone(level: number): LevelMilestone {
  let current = LEVEL_MILESTONES[0];
  for (const m of LEVEL_MILESTONES) {
    if (m.level <= level) current = m;
    else break;
  }
  return current;
}

/** Renvoie le prochain milestone non encore atteint, ou null si Maître. */
export function nextMilestone(level: number): LevelMilestone | null {
  for (const m of LEVEL_MILESTONES) {
    if (m.level > level) return m;
  }
  return null;
}
