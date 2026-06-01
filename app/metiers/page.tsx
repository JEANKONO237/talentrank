import type { Metadata } from "next";
import { MetiersIndexClient } from "@/components/metiers/MetiersIndexClient";

export const metadata: Metadata = {
  title: "Métiers — TalentRank",
  description:
    "Parcoure tous les métiers classés sur TalentRank. Un métier = un classement. Pas de mix.",
};

export default function MetiersPage() {
  return <MetiersIndexClient />;
}
