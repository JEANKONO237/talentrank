// TalentRank — Audience types
// ----------------------------------------------------------------------------
// L'arrivée sur TalentRank impose un choix : "Je suis Talent" ou "Je suis
// Entreprise". Ce choix conditionne :
//   - le contenu de la home
//   - les items de la sidebar
//   - les pages dashboard
//   - les CTAs prioritaires
//   - les filtres/tris par défaut
//
// Ce module est la source de vérité du type Audience et du nom du cookie.
// ----------------------------------------------------------------------------

export type Audience = "talent" | "studio";

/** Nom du cookie qui persiste le choix audience.
 *  Pas httpOnly : on doit pouvoir le lire en client pour adapter la sidebar
 *  sans round-trip. Path / pour qu'il s'applique à toutes les routes. */
export const AUDIENCE_COOKIE = "tr_audience";

/** Durée du cookie : 365 jours. Le user peut switcher via le widget AudienceSwitcher. */
export const AUDIENCE_COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

/** Marqueur d'onboarding terminé (ou skippé). Le user ne re-passe pas par
 *  /onboarding tant que ce cookie existe. Reset = suppression du cookie. */
export const ONBOARDED_COOKIE = "tr_onboarded";

/** Type narrow check — quand on lit le cookie, on doit valider le contenu
 *  (pas trust le client). */
export function isAudience(v: string | undefined | null): v is Audience {
  return v === "talent" || v === "studio";
}

/** Métadonnées d'affichage pour chaque audience. Centralisé ici pour éviter
 *  les duplications inline dans 5 composants. */
export const AUDIENCE_META: Record<
  Audience,
  {
    label: string;
    tagline: string;
    accent: string;       // brand color
    accentSoft: string;   // bg léger
    icon: "user-circle" | "building";
  }
> = {
  talent: {
    label: "Talent",
    tagline: "Monte au classement. Sois trouvé.",
    accent: "#F59E0B",       // ambre prestige
    accentSoft: "#FFF8E1",
    icon: "user-circle",
  },
  studio: {
    label: "Entreprise",
    tagline: "Chasse les meilleurs. Sans bruit.",
    accent: "#1A2535",       // bleu nuit autorité
    accentSoft: "#E7EAEF",
    icon: "building",
  },
};
