import { ParrainageClient } from "@/components/referral/ParrainageClient";

export const metadata = {
  title: "Parrainage — TalentRank",
  description:
    "Invite 3 amis, saute la queue beta. Reçois le badge Ambassadeur. Le programme de parrainage TalentRank.",
};

export default function ParrainagePage() {
  return <ParrainageClient />;
}
