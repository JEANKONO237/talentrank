import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getCategory,
  getProfession,
  professionLabel,
} from "@/lib/professions";
import { ProfessionRankingWrapper } from "@/components/ranking/ProfessionRankingWrapper";

interface PageProps {
  params: Promise<{ profession: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { profession } = await params;
  const p = getProfession(profession);
  if (!p) return { title: "Métier introuvable — TalentRank" };
  return {
    title: `Classement ${professionLabel(p, "fr")} — TalentRank`,
    description: `Le classement officiel des ${professionLabel(p, "fr")} sur TalentRank. Filtre par ville, région, nationalité.`,
  };
}

export default async function ProfessionRankingPage({ params }: PageProps) {
  const { profession } = await params;
  const p = getProfession(profession);
  if (!p) notFound();
  const cat = getCategory(p.category);
  return (
    <ProfessionRankingWrapper
      professionId={p.id}
      professionLabel={professionLabel(p, "fr")}
      professionCategoryColor={cat?.color ?? "#1A2535"}
    />
  );
}
