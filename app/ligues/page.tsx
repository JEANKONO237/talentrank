import type { Metadata } from "next";
import { LiguesClient } from "@/components/ligues/LiguesClient";
import { TALENTS } from "@/lib/mock-talents";

export const metadata: Metadata = {
  title: "Ligues — TalentRank",
  description:
    "Ton évaluation officielle TalentRank. Score, ligue actuelle, axes de calcul transparents.",
};

export default function LiguesPage() {
  // Demo profile: Jean-Marie. Wire to real session once auth lands.
  return <LiguesClient talent={TALENTS[0]} />;
}
