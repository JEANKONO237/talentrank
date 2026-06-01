"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { HunterMascot } from "@/components/ui/HunterMascot";

// ─────────────────────────────────────────────────────────────────────────────
// PeekingMascot — la tête du CHASSEUR DE TÊTES qui dépasse du haut du Hero.
//
// Concept Chasseur/Chassé (v2) : le studio surveille les talents.
// Le bounty hunter te repère avant que tu ne le voies. Métaphore positive :
// on te trouve même quand tu ne cherches pas.
//
// Orb : gradient sombre cuir/sunset (vs l'ancien gold) pour matcher le ton.
// Entrée slide-down au mount ; pas d'idle bobbing (audit motion P0-3).
// ─────────────────────────────────────────────────────────────────────────────

export function PeekingMascot() {
  // Micro-parallax au scroll (audit Léo G2-Léo-3) :
  // le sheriff s'élève très légèrement quand le user scroll = dynamise sans
  // ajouter d'idle bobbing répétitif. -40px max sur les 500 premiers px.
  const { scrollY } = useScroll();
  const parallaxY = useTransform(scrollY, [0, 500], [0, -40]);

  return (
    <motion.div
      initial={{ y: -120 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.2, 0.7, 0.2, 1], delay: 0.15 }}
      className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
      style={{ zIndex: 5, y: parallaxY }}
      aria-hidden
    >
      <div className="relative" style={{ width: 140, height: 70, overflow: "hidden" }}>
        <div
          className="absolute left-1/2 -translate-x-1/2 grid place-items-center rounded-full"
          style={{
            width: 140,
            height: 140,
            top: 0,
            // Orb warm western (v2) — chaleureux mais signature chasseur.
            // Audit Yuki : remplace l'orb sunset sombre v1 par un orange terre
            // cuite plus accueillant, cohérent avec la tonale joyeuse des
            // autres mascots.
            background:
              "radial-gradient(circle at 30% 25%, #FFD7A8, #F59E0B 55%, #B45309 100%)",
            boxShadow:
              "0 12px 24px -6px rgba(180, 83, 9, 0.45), inset 0 4px 0 rgba(255, 255, 255, 0.45), inset 0 -16px 28px -8px rgba(0, 0, 0, 0.30)",
          }}
        >
          <HunterMascot
            size={100}
            className="-mt-2 drop-shadow-[0_4px_8px_rgba(0,0,0,0.30)]"
          />
        </div>
      </div>
    </motion.div>
  );
}
