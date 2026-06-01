import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PROFESSION_CATEGORIES, categoryLabel, type ProfessionCategoryId } from "@/lib/professions";
import { MetiersCategoryClient } from "@/components/metiers/MetiersCategoryClient";

interface PageProps {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const cat = PROFESSION_CATEGORIES.find((c) => c.id === category);
  if (!cat) return { title: "Catégorie introuvable — TalentRank" };
  return {
    title: `${categoryLabel(cat, "fr")} — TalentRank`,
    description: `Tous les métiers de la catégorie ${categoryLabel(cat, "fr")} classés sur TalentRank.`,
  };
}

export function generateStaticParams() {
  return PROFESSION_CATEGORIES.map((c) => ({ category: c.id }));
}

export default async function CategoryPage({ params }: PageProps) {
  const { category } = await params;
  const cat = PROFESSION_CATEGORIES.find((c) => c.id === category);
  if (!cat) notFound();
  return <MetiersCategoryClient categoryId={cat.id as ProfessionCategoryId} />;
}
