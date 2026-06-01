import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { TalentShowcase } from "@/components/landing/TalentShowcase";
import { WaitlistCapture } from "@/components/landing/WaitlistCapture";
import { LeaguesSection } from "@/components/landing/LeaguesSection";
import { FinalCTA } from "@/components/landing/FinalCTA";

// Landing TALENT — funnel émotionnel (Duolingo × Clash Royale × Steam).
//
// L'utilisateur arrivant ici a choisi "Je suis Talent" sur /welcome.
// Tout le contenu lui parle DIRECTEMENT :
//   1. Hero            — recherche + 5 mondes
//   2. HowItWorks      — 3 étapes (TON parcours)
//   3. TalentShowcase  — exemples de profils accomplis (modèles)
//   4. WaitlistCapture — beta privée
//   5. LeaguesSection  — promesse d'ascension + rewards par ligue
//   6. FinalCTA        — "Commencer le QCM"

const OG_TITLE = "Monte au classement.";
const OG_SUBTITLE = "Passe le QCM officiel. Sois trouvé par les studios.";

export const metadata = {
  title: "TalentRank · Pour les Talents",
  description:
    "Passe le QCM officiel de ton métier. Monte au classement. Sois trouvé par les studios.",
  openGraph: {
    title: `TalentRank — ${OG_TITLE}`,
    description: OG_SUBTITLE,
    images: [
      {
        url: `/api/og?audience=talent&title=${encodeURIComponent(OG_TITLE)}&subtitle=${encodeURIComponent(OG_SUBTITLE)}`,
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
      `/api/og?audience=talent&title=${encodeURIComponent(OG_TITLE)}&subtitle=${encodeURIComponent(OG_SUBTITLE)}`,
    ],
  },
};

export default function TalentLandingPage() {
  return (
    <main>
      <Hero />
      <HowItWorks />
      <TalentShowcase />
      <WaitlistCapture />
      <LeaguesSection />
      <FinalCTA />
    </main>
  );
}
