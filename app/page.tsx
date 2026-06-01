import { redirect } from "next/navigation";
import { getAudienceServer } from "@/lib/audience/server";

// ─────────────────────────────────────────────────────────────────────────────
// /  → router. Pas de contenu propre.
//
// Comportement :
//   - Pas de cookie audience  → /welcome (le choice screen)
//   - audience = 'talent'     → /talent (landing talent)
//   - audience = 'studio'     → /studio (landing studio)
//
// On NE veut PAS rendre une UI ici parce que :
//   1. Server-side redirect = pas de flash de la mauvaise UI
//   2. SEO : /talent et /studio ont leurs propres meta/titre
//   3. Sépare cleanly les 2 univers (un user qui pin /talent ne voit jamais
//      /studio par accident)
// ─────────────────────────────────────────────────────────────────────────────

export default async function RootRouterPage() {
  const audience = await getAudienceServer();
  if (audience === "talent") redirect("/talent");
  if (audience === "studio") redirect("/studio");
  redirect("/welcome");
}
