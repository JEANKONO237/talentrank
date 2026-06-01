"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// StudioFinalCTA — clôture du funnel recruteur. Ton sobre, ambition haute.
// Pas de mascotte. Bleu nuit dominant.
// ─────────────────────────────────────────────────────────────────────────────

export function StudioFinalCTA() {
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
            background: "linear-gradient(135deg, #0A1018 0%, #1A2535 60%, #2C3E55 100%)",
            boxShadow:
              "0 32px 80px -24px rgba(10, 16, 24, 0.6), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        >
          {/* Halos */}
          <span
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-30 blur-3xl"
            style={{ background: "#1CB0F6" }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -left-16 -bottom-16 h-56 w-56 rounded-full opacity-25 blur-3xl"
            style={{ background: "#F59E0B" }}
          />

          {/* Title */}
          <h2
            className="relative font-display font-black tracking-tight text-white"
            style={{
              fontSize: "clamp(2rem, 4.8vw, 3.4rem)",
              lineHeight: 1.04,
              letterSpacing: "-0.025em",
            }}
          >
            Le meilleur talent de ce métier
            <br />
            <span className="relative inline-block">
              t&apos;attend.
              <span
                aria-hidden
                className="absolute left-0 right-0 -bottom-1 sm:-bottom-1.5 h-[5px] sm:h-[6px] rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(255,200,0,0.4) 0%, rgba(255,200,0,0.85) 50%, rgba(255,200,0,0.4) 100%)",
                }}
              />
            </span>
          </h2>

          {/* Subtitle */}
          <p className="relative mt-7 mx-auto max-w-xl text-[15px] sm:text-[16px] text-white/70 leading-relaxed">
            Tu peux chercher pendant 6 mois sur LinkedIn,
            <br className="hidden sm:inline" />
            <span className="font-bold text-white">ou le trouver en 5 minutes ici.</span>
          </p>

          {/* Actions */}
          <div className="relative mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/chasse"
              className="group inline-flex h-12 items-center gap-2 rounded-full bg-white text-night-900 px-6 text-[13px] font-bold uppercase tracking-[0.06em] transition-all hover:bg-cyan-50 active:translate-y-[1px]"
              style={{
                boxShadow:
                  "0 4px 0 0 #94A3B8, 0 12px 28px -8px rgba(0,0,0,0.4)",
              }}
            >
              Commencer à chasser
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                strokeWidth={2.6}
              />
            </Link>
            <Link
              href="/qcm-builder"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-white/10 hover:bg-white/15 ring-1 ring-inset ring-white/20 px-6 text-[13px] font-bold uppercase tracking-[0.06em] text-white transition"
            >
              Voir le QCM Builder
            </Link>
          </div>

          {/* Microcopy */}
          <p className="relative mt-6 text-[11px] text-white/50">
            <Sparkles className="inline-block h-3 w-3 mr-1 -mt-0.5" strokeWidth={2.6} />
            Aucune carte requise · 5 recherches gratuites pour démarrer
          </p>
        </motion.div>
      </div>
    </section>
  );
}
