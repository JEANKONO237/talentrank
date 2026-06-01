import type { Metadata } from "next";
import { RankingDirectoryClient } from "@/components/ranking/RankingDirectoryClient";
import { professionStats } from "@/lib/profession-stats";
import { PROFESSIONS, PROFESSION_CATEGORIES } from "@/lib/professions";

export const metadata: Metadata = {
  title: "Classements — TalentRank",
  description:
    "Le classement TalentRank est toujours scopé à un métier. Choisis un métier pour voir son classement. Épingle tes métiers cibles pour les garder en tête.",
};

// ─────────────────────────────────────────────────────────────────────────────
// /ranking — annuaire complet des classements par métier.
//
// Server Component minimal : charge les stats agrégées et la liste complète
// des professions + categories, délègue toute l'UI au Client (qui consomme
// le hook usePinnedProfessions + useAudience).
// ─────────────────────────────────────────────────────────────────────────────

export default function RankingPage() {
  const stats = professionStats();
  // Passe au client une shape stable (pas d'objets exotiques)
  const flatProfessions = PROFESSIONS.map((p) => {
    const stat = stats.find((s) => s.profession.id === p.id);
    return {
      id: p.id,
      label: p.label,
      frLabel: p.frLabel,
      category: p.category,
      talentCount: stat?.talentCount ?? 0,
      topScore: stat?.topScore ?? null,
    };
  });
  const categories = PROFESSION_CATEGORIES.map((c) => ({
    id: c.id,
    frLabel: c.frLabel,
    color: c.color,
  }));

  return (
    <RankingDirectoryClient professions={flatProfessions} categories={categories} />
  );
}
