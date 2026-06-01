import type { Metadata } from "next";
import { EmbedShowcaseClient } from "@/components/embed/EmbedShowcaseClient";

export const metadata: Metadata = {
  title: "Embed ton score — TalentRank",
  description:
    "Mets ton score TalentRank dans ta signature email, ton portfolio Notion, ton README GitHub. Génération SVG live, cache CDN.",
};

export default function EmbedPage() {
  return <EmbedShowcaseClient />;
}
