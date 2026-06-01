"use server";

import { redirect } from "next/navigation";
import {
  clearAudienceServer,
  clearOnboardedServer,
} from "@/lib/audience/server";

// ─────────────────────────────────────────────────────────────────────────────
// resetAudience — efface les cookies tr_audience + tr_onboarded, force le user
// à repasser par /welcome. Appelée par le bouton "Changer d'univers" dans la
// sidebar OU le settings.
// ─────────────────────────────────────────────────────────────────────────────

export async function resetAudience() {
  await clearAudienceServer();
  await clearOnboardedServer();
  redirect("/welcome");
}
