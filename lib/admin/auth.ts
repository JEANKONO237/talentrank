import "server-only";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@/lib/supabase/database.types";

// ─────────────────────────────────────────────────────────────────────────────
// Admin auth — gating réutilisable pour toutes les routes /admin/*.
//
// Pattern d'usage dans une page Server Component :
//
//   import { requireAdmin } from "@/lib/admin/auth";
//   export default async function AdminPage() {
//     const admin = await requireAdmin();
//     ...
//   }
//
// Le helper :
//   1. Vérifie qu'un user est connecté → sinon redirect /auth/sign-in
//   2. Vérifie qu'il a role='admin' → sinon redirect / (avec ?error=forbidden)
//   3. Retourne le profile complet pour pouvoir l'utiliser dans la page
//
// La sécurité réelle vit au niveau DB via le helper SQL public.is_admin()
// utilisé dans les RLS policies (migration 0022). Ce gate est juste un
// fast-fail côté serveur pour éviter de render la page si non-admin.
// ─────────────────────────────────────────────────────────────────────────────

export async function requireAdmin(): Promise<ProfileRow> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in?next=/admin");
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || profile.role !== "admin") {
    redirect("/?error=forbidden");
  }
  return profile as ProfileRow;
}

/** Variante non-redirect — utile dans les API routes ou middleware.
 *  Renvoie null si pas admin (le caller décide quoi faire). */
export async function getAdminOrNull(): Promise<ProfileRow | null> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || profile.role !== "admin") return null;
  return profile as ProfileRow;
}
