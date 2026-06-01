import { ComingSoonPage } from "@/components/stubs/ComingSoonPage";

export const metadata = { title: "TalentRank · Opportunités" };

export default function OpportunitiesPage() {
  return (
    <ComingSoonPage
      title="Tes opportunités."
      description="Les entreprises qui te shortlistent, les propositions d'entretien et les missions qui matchent ton profil arrivent ici. Pas de spam — uniquement ce qui te correspond."
      features={[
        "Propositions reçues (entretiens, missions)",
        "Invitations directes de studios qui t'ont repéré",
        "Statut de tes candidatures envoyées",
        "Filtres : dispo immédiate, type de contrat, ville",
      ]}
      accent="#F59E0B"
      icon="inbox"
      backHref="/talent"
      backLabel="Accueil"
    />
  );
}
