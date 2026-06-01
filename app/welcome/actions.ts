"use server";

import { redirect } from "next/navigation";
import {
  isOnboardedServer,
  setAudienceServer,
  setOnboardedServer,
} from "@/lib/audience/server";
import type { Audience } from "@/lib/audience/types";

// ─────────────────────────────────────────────────────────────────────────────
// Server actions du welcome screen.
//
// chooseAudience : engage l'user dans une audience (talent ou studio).
//   - si déjà onboardé → directement la landing /{audience}
//   - sinon            → /onboarding (formulaire de signup)
//
// browseAsVisitor : 3e voie (audit Erin G3-Erin-1) — accès read-only sans
// choisir une audience. Pour ceux qui hésitent, qui veulent juste voir.
// Set onboarded=true pour ne pas re-prompter, mais PAS d'audience cookie
// → la sidebar tombera en mode talent par défaut mais l'app comprend qu'on
// est en exploration libre.
// ─────────────────────────────────────────────────────────────────────────────

export async function chooseAudience(audience: Audience) {
  await setAudienceServer(audience);
  const onboarded = await isOnboardedServer();
  redirect(onboarded ? `/${audience}` : "/onboarding");
}

export async function browseAsVisitor() {
  // Set onboarded = true pour ne pas être redirigé vers /welcome à chaque /
  // (le user a explicitement choisi de visiter). Pas d'audience cookie
  // → comportement par défaut = talent landing.
  await setAudienceServer("talent");
  await setOnboardedServer();
  redirect("/metiers");
}
