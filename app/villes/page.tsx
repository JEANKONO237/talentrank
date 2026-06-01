import type { Metadata } from "next";
import { CitiesDirectoryClient } from "@/components/cities/CitiesDirectoryClient";
import { getCities } from "@/lib/cities";

export const metadata: Metadata = {
  title: "Talents par ville — TalentRank",
  description:
    "Les meilleurs talents par ville. Pas de classement global toutes professions — chaque ville révèle les Top par métier.",
  openGraph: {
    title: "Talents par ville · TalentRank",
    description:
      "Découvre les meilleurs Motion Designers à Lyon, Character Animators à Tokyo, Devs à Lagos.",
  },
};

export default function VillesPage() {
  const cities = getCities();
  const slim = cities.map((c) => ({
    name: c.name,
    countryCode: c.countryCode,
    totalTalents: c.totalTalents,
    averageScore: c.averageScore,
    topProfessions: c.topProfessions.map((tp) => ({
      id: tp.profession.id,
      frLabel: tp.profession.frLabel,
      category: tp.profession.category,
      count: tp.count,
    })),
    topTalent: c.topTalent
      ? {
          slug: c.topTalent.slug,
          name: c.topTalent.name,
          score: c.topTalent.score,
          initials: c.topTalent.initials,
          gradient: c.topTalent.avatarGradient,
        }
      : null,
  }));

  return <CitiesDirectoryClient cities={slim} />;
}
