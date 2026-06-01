import { ComingSoonPage } from "@/components/stubs/ComingSoonPage";

export const metadata = { title: "TalentRank · Abonnement" };

export default function BillingPage() {
  return (
    <ComingSoonPage
      title="Ton abonnement."
      description="Gestion de ton plan TalentRank entreprise : facturation, factures, crédits recrutement consommés, upgrade/downgrade. Tout transparent, aucune surprise."
      features={[
        "Plan actuel + utilisation du mois",
        "Crédits recrutement restants",
        "Historique des factures (PDF téléchargeables)",
        "Upgrade vers Pro / Custom · changement à tout moment",
      ]}
      accent="#10B981"
      icon="credit-card"
      backHref="/studio"
      backLabel="Tableau"
    />
  );
}
