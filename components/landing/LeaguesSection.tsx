"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { LeagueMascot } from "@/components/ui/LeagueMascot";
import { LeagueRewards } from "@/components/rewards/LeagueRewards";
import { TIER_ORDER } from "@/lib/tiers";
import { REWARDS } from "@/lib/rewards";

// ─────────────────────────────────────────────────────────────────────────────
// Section "Les ligues" — Duolingo-soul, TalentRank-skin.
// Chaque ligue est un personnage (mascotte SVG) sur son propre podium coloré.
// Les podiums s'agrandissent de gauche (Nouveau) à droite (Diamant), le regard
// monte naturellement.
//
// Règles UX inspirées de Duolingo :
//   - Beaucoup d'espace blanc autour des médaillons (ne JAMAIS remplir l'écran)
//   - Le mascotte EST la carte — pas de wrap UI qui prend la place
//   - Animations douces (idle bobbing pour les paliers hauts, hover bounce)
//   - Le label en bas est court, gras, propre — pas de bla-bla
// ─────────────────────────────────────────────────────────────────────────────

export function LeaguesSection() {
  // Ascension : du Nouveau (gauche) au Diamant (droite).
  const climb = [...TIER_ORDER].reverse();
  const [showRewards, setShowRewards] = useState(false);

  return (
    <section className="relative py-28 sm:py-32">
      {/* Fond blanc nu — wash jaune retiré pour cohérence neutre */}

      <div className="container-page">
        {/* Eyebrow "Les ligues" retiré — le titre s'auto-explique */}
        <div className="text-center max-w-2xl mx-auto">
          <h2
            className="mt-4 font-display font-black tracking-tight text-mist-50"
            style={{
              fontSize: "clamp(2rem, 4.5vw, 3.4rem)",
              lineHeight: 1.02,
              letterSpacing: "-0.02em",
            }}
          >
            Six paliers.{" "}
            <span className="relative inline-block">
              Une ascension.
              <span
                aria-hidden
                className="absolute left-0 right-0 -bottom-1 sm:-bottom-1.5 h-[5px] sm:h-[7px] rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(255,200,0,0.4) 0%, rgba(255,200,0,0.75) 50%, rgba(255,200,0,0.4) 100%)",
                }}
              />
            </span>
          </h2>
          <p className="mt-7 text-[15px] leading-relaxed text-mist-300 max-w-xl mx-auto">
            Chaque ligue a sa mascotte. Plus tu grimpes, plus tu rejoins les
            rares qui dominent ton métier.
          </p>
        </div>

        {/* Mascots row — desktop : 6 colonnes en arc montant.
            Mobile : grille 3×2 propre. */}
        <div className="mt-20 sm:mt-24 mx-auto max-w-5xl">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-6 sm:gap-3 items-end">
            {climb.map((tier, i) => {
              // Échelle progressive — Nouveau le plus petit, Diamant le plus grand
              const t = i / (climb.length - 1);
              const lift = t * 44; // monte de 0 à 44px (escalier plus marqué)
              const mascotSize = 90 + t * 70;  // 90 → 160 (gros)
              const podiumSize = 130 + t * 90; // 130 → 220

              return (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{
                    duration: 0.55,
                    delay: i * 0.1,
                    ease: [0.2, 0.7, 0.2, 1],
                  }}
                  className="flex flex-col items-center text-center"
                  style={{ transform: `translateY(-${lift}px)` }}
                >
                  {/* Mascotte sur podium coloré.
                      Outer = hover scale ; inner = idle bobbing pour les 2
                      paliers les plus hauts (séparation pour éviter le
                      conflit de transitions sur un même élément). */}
                  <motion.div
                    whileHover={{ scale: 1.07, y: -4 }}
                    transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
                    className="relative"
                    style={{ width: podiumSize, height: podiumSize }}
                  >
                    <motion.div
                      className="absolute inset-0"
                      animate={i >= climb.length - 2 ? { y: [0, -4, 0] } : undefined}
                      transition={
                        i >= climb.length - 2
                          ? { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
                          : undefined
                      }
                    >
                      {/* Aura ambiante */}
                      <span
                        aria-hidden
                        className="pointer-events-none absolute -inset-3 rounded-full opacity-30 blur-2xl"
                        style={{ background: tier.color }}
                      />
                      {/* Podium = grosse pastille colorée 3D */}
                      <span
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: `radial-gradient(circle at 30% 25%, ${tier.highlight}, ${tier.color} 60%, ${tier.color}cc 100%)`,
                          boxShadow: `0 24px 50px -12px ${tier.color}88, inset 0 4px 0 rgba(255,255,255,0.55), inset 0 -22px 36px -10px rgba(0,0,0,0.4)`,
                        }}
                        aria-hidden
                      />
                      {/* Mascotte centrée */}
                      <span
                        className="absolute inset-0 grid place-items-center"
                        aria-hidden
                      >
                        <LeagueMascot
                          tier={tier.id}
                          size={mascotSize}
                          className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]"
                        />
                      </span>
                    </motion.div>
                  </motion.div>

                  {/* Label sous le podium */}
                  <p
                    className="mt-6 font-display font-black tracking-tight text-mist-50 leading-tight"
                    style={{ fontSize: 14 + t * 6 }}
                  >
                    {tier.label}
                  </p>
                  <p
                    className="mt-1 text-[10.5px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: tier.color }}
                  >
                    {tier.range}
                  </p>
                  {/* Motto only on the top 2 tiers — keeps the base clean */}
                  {t > 0.7 && (
                    <p className="mt-2 text-[11px] text-mist-400 italic max-w-[130px] mx-auto leading-snug">
                      « {tier.motto} »
                    </p>
                  )}
                  {/* Teaser commission — ce qui change vraiment */}
                  {t > 0.5 && (
                    <p
                      className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em]"
                      style={{ color: tier.color }}
                    >
                      {REWARDS[tier.id].commission}% commission
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Foot note */}
          <p className="mt-20 text-center text-[12.5px] text-mist-400 max-w-md mx-auto">
            Chaque ligue est calculée <span className="font-bold text-mist-100">par métier</span>.
            Tu peux être Diamant en Animation 3D et Bronze en Motion Design — c&apos;est normal.
          </p>

          {/* Toggle : voir ce que chaque ligue débloque concrètement */}
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={() => setShowRewards((v) => !v)}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[12.5px] font-bold uppercase tracking-[0.08em] text-mist-50 ring-1 ring-inset ring-ink-700/10 shadow-card hover:-translate-y-0.5 hover:shadow-card-hover transition-all"
              aria-expanded={showRewards}
            >
              {showRewards ? "Masquer" : "Que débloque chaque ligue ?"}
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform text-amber-700 ${showRewards ? "rotate-180" : ""}`}
                strokeWidth={2.6}
              />
            </button>
          </div>

          <AnimatePresence initial={false}>
            {showRewards && (
              <motion.div
                key="rewards"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-10 mx-auto max-w-2xl">
                  <LeagueRewards />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
