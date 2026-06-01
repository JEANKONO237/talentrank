"use server";

import { redirect } from "next/navigation";
import {
  getAudienceServer,
  setOnboardedServer,
} from "@/lib/audience/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

// ─────────────────────────────────────────────────────────────────────────────
// Onboarding server actions — flow réel end-to-end.
//
// Mode RÉEL (isSupabaseConfigured = true) :
//   1. supabase.auth.signUp(email, password, options.data = { role, username,
//      display_name, profession })
//   2. Le trigger handle_new_auth_user (migration 0014) crée automatiquement
//      profile + talents/studios row + talent_scores
//   3. Cookie tr_onboarded set
//   4. Redirect /{audience}
//
// Mode DÉMO (Supabase pas configuré) :
//   - Aucune persistence DB, juste set cookie onboarded
//   - Le user voit l'app marcher mais aucune donnée n'est sauvegardée
//   - Voir SUPABASE_SETUP.md à la racine pour brancher du réel
// ─────────────────────────────────────────────────────────────────────────────

export interface OnboardingPayload {
  email: string;
  password: string;
  displayName: string;
  // Pour talent : profession_id requis
  profession?: string;
  // Pour studio : nom de l'entreprise + secteur
  companyName?: string;
  sector?: string;
}

export interface OnboardingResult {
  ok: boolean;
  error?: string;
  /** Si true, le user a été créé en DB. Sinon mode démo localStorage only. */
  realAuth: boolean;
}

// Génère un slug @username à partir de l'email + suffix aléatoire 4 chars
// (collision-safe à 1.7M usernames pour 1% de collision).
function generateUsername(email: string): string {
  const local = email.split("@")[0].toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const trimmed = local.replace(/^-+|-+$/g, "").slice(0, 20);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${trimmed || "user"}-${suffix}`;
}

export async function completeOnboarding(
  payload: OnboardingPayload,
): Promise<OnboardingResult> {
  const audience = await getAudienceServer();
  if (!audience) {
    return { ok: false, error: "Audience non choisie.", realAuth: false };
  }

  // ─── Mode RÉEL : Supabase signUp ────────────────────────────────────
  if (isSupabaseConfigured) {
    try {
      const supabase = await getSupabaseServerClient();
      const username = generateUsername(payload.email);

      // Métadonnées consommées par le trigger handle_new_auth_user (0014)
      const metadata: Record<string, string> = {
        role: audience, // 'talent' | 'studio'
        username,
        display_name: payload.displayName.trim(),
        country_code: "FR", // default — la ville/pays se complète plus tard
      };

      if (audience === "talent" && payload.profession) {
        // Le trigger attend `discipline` enum. profession_id de QCM bank ≠ discipline.
        // Mapping minimal : on passe `generalist-3d` par défaut et on stocke
        // le vrai profession_id dans talents.profession_id via update post-signup.
        metadata.discipline = "generalist-3d";
      }

      if (audience === "studio") {
        metadata.studio_name = payload.companyName?.trim() ?? payload.displayName.trim();
      }

      const { data, error } = await supabase.auth.signUp({
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
        options: { data: metadata },
      });

      if (error) {
        return { ok: false, error: error.message, realAuth: true };
      }

      // Post-signup : si talent + profession choisie, on update talents.profession_id
      // (le trigger a créé la row avec discipline default, on ajoute le profession_id)
      if (data.user && audience === "talent" && payload.profession) {
        await supabase
          .from("talents")
          .update({ profession_id: payload.profession })
          .eq("id", data.user.id);
      }

      // Post-signup studio : si secteur fourni, on l'ajoute à studios
      if (data.user && audience === "studio" && payload.sector) {
        await supabase
          .from("studios")
          .update({ sector: payload.sector })
          .eq("id", data.user.id);
      }

      await setOnboardedServer();
      // Note : le user est sign-in automatiquement après signUp (sauf si email
      // confirmation est requise dans le projet Supabase — auquel cas il devra
      // cliquer le lien email avant de pouvoir s'authentifier).
      redirect(`/${audience}`);
    } catch (err) {
      // redirect() throw NEXT_REDIRECT — c'est normal, on le relaie
      if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) throw err;
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Erreur inattendue.",
        realAuth: true,
      };
    }
  }

  // ─── Mode DÉMO : juste cookie onboarded ─────────────────────────────
  await setOnboardedServer();
  redirect(`/${audience}`);
}

export async function skipOnboarding() {
  const audience = await getAudienceServer();
  if (!audience) {
    redirect("/welcome");
  }
  await setOnboardedServer();
  redirect(`/${audience}`);
}
