import { WelcomeClient } from "@/components/welcome/WelcomeClient";

// ─────────────────────────────────────────────────────────────────────────────
// /welcome — le choice screen. UNE seule action possible : choisir entre
// "Je suis Talent" et "Je suis Entreprise". Tout le reste de TalentRank
// dérive de ce choix.
//
// Pourquoi pas de SearchBar / nav ici : ce screen doit être un AIGUILLAGE.
// Un user qui hésite ne doit pas s'évader vers une autre route — il doit
// trancher.
//
// L'UI vit dans le composant client pour pouvoir animer/réagir au survol
// sans aller-retour serveur.
// ─────────────────────────────────────────────────────────────────────────────

export const metadata = {
  title: "Bienvenue sur TalentRank",
  description:
    "Talent ou Entreprise ? Choisis ton univers pour démarrer.",
};

export default function WelcomePage() {
  return <WelcomeClient />;
}
