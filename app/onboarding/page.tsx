import { redirect } from "next/navigation";
import { getAudienceServer, isOnboardedServer } from "@/lib/audience/server";
import { OnboardingClient } from "@/components/onboarding/OnboardingClient";

// ─────────────────────────────────────────────────────────────────────────────
// /onboarding — formulaire skippable après /welcome.
//
// Gating server-side :
//   - pas d'audience cookie    → /welcome (faire le choix d'abord)
//   - déjà onboardé            → /{audience} (pas re-demander)
//   - sinon                    → rendre le client
//
// Le formulaire change selon l'audience (talent demande métier, studio
// demande entreprise). Bouton "Compléter plus tard" omniprésent.
// ─────────────────────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Bienvenue · Quelques infos sur toi",
};

export default async function OnboardingPage() {
  const audience = await getAudienceServer();
  if (!audience) redirect("/welcome");

  const onboarded = await isOnboardedServer();
  if (onboarded) redirect(`/${audience}`);

  return <OnboardingClient audience={audience} />;
}
