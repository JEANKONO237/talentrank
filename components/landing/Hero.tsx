"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FloatingMotifs } from "./hero/FloatingMotifs";
import { PeekingMascot } from "./hero/PeekingMascot";
import { SearchBar } from "./hero/SearchBar";
import { WorldCard } from "./hero/WorldCard";
import { WORLDS } from "./hero/worlds";

// ─────────────────────────────────────────────────────────────────────────────
// Hero — radical simplicity à la Qwant Junior.
//
// Composant slim : orchestre 4 sous-composants extraits sous ./hero/ :
//   - PeekingMascot  — Lion qui dépasse du haut
//   - SearchBar      — pilule de recherche métier (primaire recruteur)
//   - WorldCard ×5   — 5 univers cliquables
//   - FloatingMotifs — 2 particules d'ambiance
//
// Le contenu intercalaire (eyebrow / titre / subtitle / secondary CTA QCM)
// reste inline ici car spécifique à l'orchestration de la home.
// ─────────────────────────────────────────────────────────────────────────────

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="container-page relative pt-12 sm:pt-16 pb-24 lg:pb-32">
        <PeekingMascot />

        <div className="mt-28 sm:mt-32 text-center max-w-4xl mx-auto">
          {/* Eyebrow */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-[11px] font-bold uppercase tracking-[0.24em] text-mist-400"
          >
            Tous les métiers · Un classement par métier
          </motion.p>

          {/* Title with amber underline on "classés" */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="mt-6 font-display font-black tracking-tight text-mist-50"
            style={{
              fontSize: "clamp(2.6rem, 6.8vw, 5.5rem)",
              lineHeight: 0.96,
              letterSpacing: "-0.025em",
            }}
          >
            Trouvez les meilleurs talents{" "}
            <span className="relative inline-block">
              classés.
              <motion.span
                aria-hidden
                initial={{ scaleX: 0, transformOrigin: "0% 50%" }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
                className="absolute left-0 right-0 -bottom-1 sm:-bottom-1.5 h-[5px] sm:h-[6px] rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(255,200,0,0.3) 0%, rgba(255,200,0,0.6) 50%, rgba(255,200,0,0.3) 100%)",
                }}
              />
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-7 text-[16px] sm:text-[17px] text-mist-300"
          >
            Choisis un métier. Le classement filtre. Tu chasses.
          </motion.p>

          {/* Search bar — primary entry point (recruteur) */}
          <SearchBar className="mt-10" />

          {/* Secondary entry point — talent. Distinct visuellement (link
              ghost) pour ne pas voler la primary. */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-4 text-[12.5px] text-mist-400"
          >
            Tu es talent ?{" "}
            <Link
              href="/qcm"
              className="font-bold text-night-700 underline decoration-amber-300 decoration-2 underline-offset-4 hover:decoration-amber-500 transition"
            >
              Passe ton QCM
            </Link>
            <span aria-hidden> →</span>
          </motion.p>

          {/* Les 5 mondes */}
          <div className="mt-20">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto auto-rows-[160px] sm:auto-rows-[180px]">
              {WORLDS.map((w, i) => (
                <WorldCard key={w.href} world={w} delay={0.5 + i * 0.07} />
              ))}
            </div>
          </div>
        </div>

        <FloatingMotifs />
      </div>
    </section>
  );
}
