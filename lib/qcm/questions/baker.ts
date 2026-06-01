// Baker / Boulanger — QCM question bank
// ----------------------------------------------------------------------------
// Axes (user-listed):
//   cuisson · fermentation · organisation · cadence · hygiène
//
// Hand-authored with real artisan-bakery knowledge: hydration ratios, autolyse,
// HACCP basics, cadence d'un fournil. The aim is that an actual baker reading
// this nods, and a fake claim is exposed.

import type { QcmBank, Question, SkillAxis } from "../types";

const AXES: SkillAxis[] = [
  { id: "cuisson",      label: "Baking",       frLabel: "Cuisson" },
  { id: "fermentation", label: "Fermentation", frLabel: "Fermentation" },
  { id: "organisation", label: "Organization", frLabel: "Organisation" },
  { id: "cadence",      label: "Pace",         frLabel: "Cadence" },
  { id: "hygiene",      label: "Hygiene",      frLabel: "Hygiène" },
];

const QUESTIONS: Question[] = [
  // ── Cuisson ────────────────────────────────────────────────────────────────
  {
    id: "baker-cuisson-001",
    professionId: "baker",
    axisId: "cuisson",
    difficulty: "beginner",
    expectedSeconds: 18,
    prompt: "Pourquoi injecter de la vapeur dans le four pendant les premières minutes de cuisson ?",
    options: [
      { id: "a", text: "Pour empêcher la croûte de se former et permettre la pousse maximale.", correct: true,
        explanation: "La vapeur garde la surface souple → l'oven spring est maximal. Sans vapeur, la croûte fige et le pain reste petit." },
      { id: "b", text: "Pour éviter de brûler la croûte.", correct: false },
      { id: "c", text: "Pour parfumer le pain.", correct: false },
      { id: "d", text: "Pour économiser de l'énergie.", correct: false },
    ],
    tags: ["oven-spring", "buée"],
  },
  {
    id: "baker-cuisson-002",
    professionId: "baker",
    axisId: "cuisson",
    difficulty: "intermediate",
    expectedSeconds: 25,
    prompt: "Une baguette ressort pâle et molle malgré une cuisson de 22 min à 240°C. Cause la plus probable ?",
    options: [
      { id: "a", text: "Trop de levure dans la pâte.", correct: false },
      { id: "b", text: "Sous-fermentation : pas assez de sucres résiduels pour la réaction de Maillard.", correct: true,
        explanation: "Sans assez de sucres simples libérés en fermentation, la croûte ne dore pas. Allonger la fermentation ou ajouter du diastatique." },
      { id: "c", text: "Le four est trop chaud.", correct: false },
      { id: "d", text: "Le pétrissage a été trop court.", correct: false },
    ],
    tags: ["maillard", "couleur"],
  },
  {
    id: "baker-cuisson-003",
    professionId: "baker",
    axisId: "cuisson",
    difficulty: "advanced",
    expectedSeconds: 35,
    prompt:
      "Quelle température à cœur (sonde) indique typiquement la fin de cuisson d'un pain de campagne 500g ?",
    options: [
      { id: "a", text: "60-70°C", correct: false },
      { id: "b", text: "85-90°C", correct: false },
      { id: "c", text: "95-99°C", correct: true,
        explanation: "Cœur ≥ 96°C signe que l'amidon est gélatinisé et l'humidité résiduelle bonne. Trop bas = pain pâteux à cœur." },
      { id: "d", text: "110°C+", correct: false },
    ],
    tags: ["temperature", "cœur"],
  },

  // ── Fermentation ───────────────────────────────────────────────────────────
  {
    id: "baker-ferment-001",
    professionId: "baker",
    axisId: "fermentation",
    difficulty: "intermediate",
    expectedSeconds: 25,
    prompt: "Qu'est-ce qu'une autolyse en boulangerie ?",
    options: [
      { id: "a", text: "Le refroidissement de la pâte avant cuisson.", correct: false },
      { id: "b", text: "Le repos farine + eau (sans sel ni levure) avant pétrissage final, pour développer le réseau gluten.", correct: true,
        explanation: "20-60 min d'autolyse hydrate la farine et amorce le gluten. La pâte devient extensible avec moins de pétrissage mécanique." },
      { id: "c", text: "L'ajout d'enzymes industrielles.", correct: false },
      { id: "d", text: "Le pétrissage rapide sans repos.", correct: false },
    ],
    tags: ["autolyse", "gluten"],
  },
  {
    id: "baker-ferment-002",
    professionId: "baker",
    axisId: "fermentation",
    difficulty: "advanced",
    expectedSeconds: 35,
    prompt:
      "Un pain au levain naturel sort dense avec une mie serrée alors que le levain semblait actif. Cause la plus probable ?",
    options: [
      { id: "a", text: "Trop de farine.", correct: false },
      { id: "b", text: "Sur-fermentation : le réseau gluten s'est effondré avant la cuisson.", correct: true,
        explanation: "Au-delà du peak, les protéases du levain dégradent le gluten. La pâte perd sa force et la mie reste serrée." },
      { id: "c", text: "Eau trop chaude au pétrissage.", correct: false },
      { id: "d", text: "Pas assez de sel.", correct: false },
    ],
    tags: ["over-proof", "levain"],
  },
  {
    id: "baker-ferment-003",
    professionId: "baker",
    axisId: "fermentation",
    difficulty: "expert",
    expectedSeconds: 45,
    prompt:
      "Tu veux un pain plus aérien et plus digeste sans changer tes farines. Quel levier privilégier ?",
    options: [
      { id: "a", text: "Doubler la quantité de levure.", correct: false },
      { id: "b", text: "Allonger la fermentation au froid (pointage 12-24h à 4°C).", correct: true,
        explanation: "Le froid ralentit la levée mais laisse les enzymes/bactéries pré-digérer l'amidon. Résultat : mie aérée, meilleure conservation, digestibilité accrue." },
      { id: "c", text: "Augmenter la température du four.", correct: false },
      { id: "d", text: "Réduire l'hydratation.", correct: false },
    ],
    tags: ["cold-proof", "digestibility"],
  },

  // ── Organisation ───────────────────────────────────────────────────────────
  {
    id: "baker-org-001",
    professionId: "baker",
    axisId: "organisation",
    difficulty: "beginner",
    expectedSeconds: 18,
    prompt: "Quel est le rôle principal d'un planning de fournil ?",
    options: [
      { id: "a", text: "Suivre les ventes.", correct: false },
      { id: "b", text: "Synchroniser pétrissages, pointages et enfournements pour avoir du pain frais en continu.", correct: true,
        explanation: "Le planning est la colonne vertébrale du fournil. Sans synchronisation, c'est soit du pain manquant soit du pain qui attend." },
      { id: "c", text: "Compter les sacs de farine.", correct: false },
      { id: "d", text: "Gérer la paie des employés.", correct: false },
    ],
    tags: ["planning"],
  },
  {
    id: "baker-org-002",
    professionId: "baker",
    axisId: "organisation",
    difficulty: "intermediate",
    expectedSeconds: 30,
    prompt:
      "Tu pétris à 22h pour 150 baguettes à enfourner à 5h. La pâte sort de pétrin à 24°C. Stratégie de pointage ?",
    options: [
      { id: "a", text: "Pointage à température ambiante pendant 7h.", correct: false },
      { id: "b", text: "Pointage court 1h ambiant puis chambre de pousse contrôlée à 6-8°C jusqu'au matin.", correct: true,
        explanation: "Pointage long à ambiant = sur-fermentation. Chambre froide bloque/ralentit après le démarrage et garantit la qualité à 5h." },
      { id: "c", text: "Pousse au chaud accélérée (35°C).", correct: false },
      { id: "d", text: "Aucun pointage — direct façonnage.", correct: false },
    ],
    tags: ["timing", "chambre"],
  },

  // ── Cadence ────────────────────────────────────────────────────────────────
  {
    id: "baker-cadence-001",
    professionId: "baker",
    axisId: "cadence",
    difficulty: "intermediate",
    expectedSeconds: 30,
    prompt:
      "En coup de feu, ton four à 3 niveaux est plein. Un client demande 30 baguettes pour 12h, il est 11h35. Réflexe ?",
    options: [
      { id: "a", text: "Refuser la commande.", correct: false },
      { id: "b", text: "Vérifier où en sont les apprêts en chambre + ce qui sort du four dans 5-10 min ; décaler une fournée si besoin.", correct: true,
        explanation: "Le cadenceur regarde la chaîne entière, pas juste le four. La réponse est dans le pipeline en cours, pas dans une réaction." },
      { id: "c", text: "Pétrir une nouvelle pâte immédiatement.", correct: false },
      { id: "d", text: "Augmenter la température du four.", correct: false },
    ],
    tags: ["rush"],
  },
  {
    id: "baker-cadence-002",
    professionId: "baker",
    axisId: "cadence",
    difficulty: "advanced",
    expectedSeconds: 35,
    prompt:
      "Cible : 600 baguettes/jour avec un four 60 places, 18 min de cuisson + 4 min de défournement/enfournement. Combien de fournées minimum dans la journée ?",
    options: [
      { id: "a", text: "8 fournées", correct: false },
      { id: "b", text: "10 fournées (= 600 / 60 exact)", correct: true,
        explanation: "Calcul direct : 600/60 = 10 fournées. À ~22 min de cycle, ça tient en ~3h40 de four — réaliste sur la journée." },
      { id: "c", text: "12 fournées", correct: false },
      { id: "d", text: "15 fournées", correct: false },
    ],
    tags: ["debit"],
  },

  // ── Hygiène ────────────────────────────────────────────────────────────────
  {
    id: "baker-hygiene-001",
    professionId: "baker",
    axisId: "hygiene",
    difficulty: "beginner",
    expectedSeconds: 15,
    prompt: "Selon les règles d'hygiène alimentaire, quelle est la température maximale de conservation pour les pâtes pâtissières crues à œuf ?",
    options: [
      { id: "a", text: "+10°C", correct: false },
      { id: "b", text: "+4°C", correct: true,
        explanation: "Chaîne du froid : produits frais à risque (œufs, crème) ≤ +4°C. Au-delà, salmonelle." },
      { id: "c", text: "+15°C", correct: false },
      { id: "d", text: "Pas de limite tant que c'est cuit après.", correct: false },
    ],
    tags: ["haccp", "froid"],
  },
  {
    id: "baker-hygiene-002",
    professionId: "baker",
    axisId: "hygiene",
    difficulty: "intermediate",
    expectedSeconds: 25,
    prompt: "Qu'est-ce que la marche en avant en plan de travail ?",
    options: [
      { id: "a", text: "Pétrir toujours dans le même sens.", correct: false },
      { id: "b", text: "Organiser les flux pour qu'un produit propre ne croise jamais un produit sale (réception → stockage → préparation → cuisson → vente).", correct: true,
        explanation: "Règle HACCP : les flux sales (déchets, emballages) ne croisent jamais les flux propres. C'est la base d'un fournil aux normes." },
      { id: "c", text: "Avancer en cadence pendant le rush.", correct: false },
      { id: "d", text: "Servir les clients par ordre d'arrivée.", correct: false },
    ],
    tags: ["haccp", "flux"],
  },
  {
    id: "baker-hygiene-003",
    professionId: "baker",
    axisId: "hygiene",
    difficulty: "advanced",
    expectedSeconds: 30,
    prompt:
      "Tu trouves des traces noires dans un coin du pétrin. Que fais-tu en priorité ?",
    options: [
      { id: "a", text: "Continuer la production en évitant ce coin.", correct: false },
      { id: "b", text: "Arrêter la production en cours, jeter la pâte affectée, décontaminer (eau chaude + détergent agréé alimentaire), traçabilité.", correct: true,
        explanation: "Suspicion de moisissure noire = contamination potentielle (Aspergillus). Protocole HACCP strict : isolement + désinfection + déclaration." },
      { id: "c", text: "Rincer à l'eau froide et reprendre.", correct: false },
      { id: "d", text: "Brûler les traces au chalumeau.", correct: false },
    ],
    tags: ["contamination", "haccp"],
  },
];

export const BAKER_BANK: QcmBank = {
  professionId: "baker",
  frLabel: "Boulanger",
  axes: AXES,
  questions: QUESTIONS,
};
