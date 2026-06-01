import { StudioHero } from "@/components/landing-studio/StudioHero";
import { StudioHowItWorks } from "@/components/landing-studio/StudioHowItWorks";
import { LiveRankingPreview } from "@/components/landing-studio/LiveRankingPreview";
import { CustomQcmTeaser } from "@/components/landing-studio/CustomQcmTeaser";
import { PricingTeaser } from "@/components/landing-studio/PricingTeaser";
import { StudioFinalCTA } from "@/components/landing-studio/StudioFinalCTA";

// ─────────────────────────────────────────────────────────────────────────────
// Landing STUDIO — orientée chasse de talents.
//
// L'utilisateur arrivant ici a choisi "Je suis Entreprise" sur /welcome.
// Le ton + le visuel diffèrent de /talent :
//   - bleu nuit dominant (vs ambre prestige côté talent)
//   - vocabulaire "chasse", "filtres", "shortlist", "matching"
//   - aucune mascotte (pas le bon registre)
//   - les talents apparaissent en LISTE classée (vue recruteur)
//
// Sections :
//   1. StudioHero            — recherche par métier + Top 3 live preview
//   2. StudioHowItWorks      — 3 étapes (côté recruteur)
//   3. LiveRankingPreview    — exemple de classement Animateur 3D Paris
//   4. CustomQcmTeaser       — KEY FEATURE : génère ton QCM
//   5. PricingTeaser         — modèle économique transparent
//   6. StudioFinalCTA        — "Commencer à chasser"

const OG_TITLE = "Chasse les meilleurs.";
const OG_SUBTITLE = "Filtres avancés, scores fiables. Sans candidatures à lire.";

export const metadata = {
  title: "TalentRank · Pour les Entreprises",
  description:
    "Trouvez les meilleurs talents de chaque métier. Filtres avancés, scores de fiabilité, QCM personnalisés. Sans candidatures à lire.",
  openGraph: {
    title: `TalentRank — ${OG_TITLE}`,
    description: OG_SUBTITLE,
    images: [
      {
        url: `/api/og?audience=studio&title=${encodeURIComponent(OG_TITLE)}&subtitle=${encodeURIComponent(OG_SUBTITLE)}`,
        width: 1200,
        height: 630,
        alt: OG_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: `TalentRank — ${OG_TITLE}`,
    description: OG_SUBTITLE,
    images: [
      `/api/og?audience=studio&title=${encodeURIComponent(OG_TITLE)}&subtitle=${encodeURIComponent(OG_SUBTITLE)}`,
    ],
  },
};

export default function StudioLandingPage() {
  return (
    <main className="bg-white">
      <StudioHero />
      <StudioHowItWorks />
      <LiveRankingPreview />
      <CustomQcmTeaser />
      <PricingTeaser />
      <StudioFinalCTA />
    </main>
  );
}
