import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBank, listBanks } from "@/lib/qcm/registry";
import { getProfession, professionLabel } from "@/lib/professions";
import { QcmBriefingClient } from "@/components/qcm/QcmBriefingClient";

interface PageProps {
  params: Promise<{ profession: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { profession } = await params;
  const p = getProfession(profession);
  if (!p) return { title: "Évaluation introuvable — TalentRank" };
  return {
    title: `Évaluation ${professionLabel(p, "fr")} — TalentRank`,
    description: `Le QCM officiel ${professionLabel(p, "fr")} : multi-dimensions, adaptatif, anti-cheat.`,
  };
}

export function generateStaticParams() {
  return listBanks().map((b) => ({ profession: b.professionId }));
}

export default async function QcmBriefingPage({ params }: PageProps) {
  const { profession } = await params;
  const bank = getBank(profession);
  if (!bank) notFound();
  return <QcmBriefingClient bank={bank} />;
}
