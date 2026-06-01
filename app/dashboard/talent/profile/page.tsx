import { RichProfileEditor } from "@/components/profile/RichProfileEditor";

// ─────────────────────────────────────────────────────────────────────────────
// /dashboard/talent/profile — édition complète du profil talent.
//
// Mode démo : tout est stocké en localStorage via useTalentProfile().
// Quand Supabase auth + storage seront branchés, on remplacera l'init du
// hook par un fetch supabase.from('talents').select() + supabase.storage
// pour les uploads photo/CV.
//
// Le composant client gère tout (édition par section, save automatique).
// ─────────────────────────────────────────────────────────────────────────────

export const metadata = {
  title: "Mon profil — TalentRank",
  description:
    "Édite ton profil talent : photos, CV, vidéos, bio, compétences, expériences, certifications.",
};

export default function ProfileEditPage() {
  return <RichProfileEditor />;
}
