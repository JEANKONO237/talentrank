import type { Metadata } from "next";
import { TalentDashboardClient } from "@/components/dashboard/TalentDashboardClient";
import { TALENTS } from "@/lib/mock-talents";

export const metadata: Metadata = { title: "Accueil — TalentRank" };

export default function TalentDashboardPage() {
  // Demo user: Jean-Marie. In production this comes from getCurrentProfile().
  const talent = TALENTS[0];
  return <TalentDashboardClient talent={talent} />;
}
