"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { LeagueMascot } from "@/components/ui/LeagueMascot";

// ─────────────────────────────────────────────────────────────────────────────
// FinalCTA — clôture du funnel de la landing.
//
// V2 (refonte) : la version précédente était en anglais, look dark/aurora,
// complètement décalée du reste de la page (cream / amber / mascotte / FR).
// Cette version raconte UNE phrase finale, dans la même grammaire visuelle
// que ScorePreview : carte cream, mascotte Lion (Or), 2 CTA. Pas plus.
//
// La promesse : "Tu es plus haut que tu ne le crois. Prouve-le."
// ─────────────────────────────────────────────────────────────────────────────

export function FinalCTA() {
  return (
    <section className="relative py-24 sm:py-28">
      <div className="container-page">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
          className="relative mx-auto max-w-4xl overflow-hidden rounded-[28px] p-10 sm:p-14 text-center"
          style={{
            background: "linear-gradient(135deg, #FFF8E1 0%, #FFE8B0 100%)",
            boxShadow:
              "0 24px 60px -16px rgba(245,158,11,0.35), inset 0 1px 0 rgba(255,255,255,0.55), 0 0 0 1px rgba(0,0,0,0.04)",
          }}
        >
          {/* Halo accent — top right */}
          <span
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-50 blur-3xl"
            style={{ background: "#F59E0B" }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -left-16 -bottom-16 h-56 w-56 rounded-full opacity-35 blur-3xl"
            style={{ background: "#FFC800" }}
          />

          {/* Lion mascot — symbole d'arrivée au sommet */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
            className="relative mx-auto mb-6 inline-block"
          >
            <div
              className="grid place-items-center rounded-full"
              style={{
                width: 110,
                height: 110,
                background:
                  "radial-gradient(circle at 30% 25%, #FFE082, #F59E0B 60%, #B45309 100%)",
                boxShadow:
                  "0 16px 32px -8px rgba(245,158,11,0.55), inset 0 3px 0 rgba(255,255,255,0.55), inset 0 -14px 22px -8px rgba(0,0,0,0.35)",
              }}
            >
              <LeagueMascot
                tier="senior"
                size={80}
                className="drop-shadow-[0_6px_10px_rgba(0,0,0,0.25)]"
              />
            </div>
          </motion.div>

          {/* Eyebrow "Dernier mot" retiré — l'orb Lion + titre punchent assez */}

          {/* Title */}
          <h2
            className="relative font-display font-black tracking-tight text-mist-50"
            style={{
              fontSize: "clamp(2rem, 4.8vw, 3.6rem)",
              lineHeight: 1.02,
              letterSpacing: "-0.025em",
            }}
          >
            Tu es plus haut{" "}
            <span className="relative inline-block">
              que tu ne le crois.
              <motion.span
                aria-hidden
                initial={{ scaleX: 0, transformOrigin: "0% 50%" }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
                className="absolute left-0 right-0 -bottom-1 sm:-bottom-1.5 h-[5px] sm:h-[6px] rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(180,83,9,0.3) 0%, rgba(180,83,9,0.65) 50%, rgba(180,83,9,0.3) 100%)",
                }}
              />
            </span>
          </h2>

          {/* Subtitle */}
          <p className="relative mt-7 mx-auto max-w-xl text-[15px] sm:text-[16px] text-mist-200 leading-relaxed">
            Le classement n&apos;attend pas. Chaque jour, un talent monte d&apos;une ligue.
            <br className="hidden sm:inline" />
            <span className="font-bold text-mist-100">Prouve-le. En 12 minutes.</span>
          </p>

          {/* Actions — CTA TALENT = ambre prestige (audit Charlotte G1-Charlotte-1).
              Le bleu nuit est réservé au studio (autorité/recrutement) ; l'ambre
              c'est la couleur du talent qui monte au classement. */}
          <div className="relative mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/qcm" className="btn-prestige group">
              Commencer le QCM
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                strokeWidth={2.6}
              />
            </Link>
            <Link
              href="/metiers"
              className="btn-glass"
              style={{ color: "#1A2535", boxShadow: "inset 0 0 0 1px rgba(26,37,53,0.25)" }}
            >
              Voir un classement
            </Link>
          </div>

          {/* Microcopy */}
          <p className="relative mt-6 text-[11px] text-mist-300">
            Aucune carte bancaire · Re-passage verrouillé 1 mois
          </p>
        </motion.div>
      </div>
    </section>
  );
}
