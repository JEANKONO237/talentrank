import { CandidatesClient } from "@/components/candidats/CandidatesClient";

export const metadata = { title: "TalentRank · Mes candidats" };

// /candidats — pour les studios uniquement. Affiche les talents que tu as :
//   - mis dans ta file (queue / shortlist)
//   - mis en suivi (follow / veille)
//
// Le client lit le localStorage (en attendant Supabase). Si rien encore,
// fallback sur le ComingSoonPage (état vide).

export default function CandidatesPage() {
  return <CandidatesClient />;
}
