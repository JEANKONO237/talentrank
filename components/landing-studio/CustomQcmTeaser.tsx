"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Brain, Check, Sparkles, Wand2 } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// CustomQcmTeaser — KEY FEATURE entreprise.
//
// Tu cherches un profil ultra-spécifique ? Frontend React + Three.js + WebGL
// + R3F ? TalentRank te génère un QCM ciblé pour CE poste précis.
// Les talents qui passent ce QCM apparaissent dans ton classement personnalisé.
//
// Cette section vend la promesse. La page /qcm-builder délivre.
// ─────────────────────────────────────────────────────────────────────────────

const SAMPLE_SKILLS = [
  "React 19",
  "TypeScript strict",
  "Three.js + R3F",
  "WebGL Shaders",
  "Performance audit",
];

export function CustomQcmTeaser() {
  return (
    <section className="relative py-24 sm:py-28">
      <div className="container-page">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
          className="mx-auto max-w-5xl rounded-[28px] overflow-hidden relative"
          style={{
            background: "linear-gradient(135deg, #1A2535 0%, #2C3E55 100%)",
            boxShadow:
              "0 32px 80px -24px rgba(10, 16, 24, 0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        >
          {/* Halos d'ambiance */}
          <span
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full blur-3xl opacity-30"
            style={{ background: "#1CB0F6" }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -left-16 -bottom-16 h-72 w-72 rounded-full blur-3xl opacity-25"
            style={{ background: "#F59E0B" }}
          />

          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 p-9 sm:p-12">
            {/* Left : copy */}
            <div>
              <p className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/15 ring-1 ring-inset ring-cyan-400/30 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.18em] text-cyan-300">
                <Sparkles className="h-3 w-3" strokeWidth={2.8} />
                Feature flagship
              </p>
              <h2
                className="mt-5 font-display font-black tracking-tight text-white"
                style={{
                  fontSize: "clamp(2rem, 4vw, 2.8rem)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.02em",
                }}
              >
                Génère ton propre QCM.
              </h2>
              <p className="mt-5 text-[15px] text-white/70 leading-relaxed">
                Ton poste est ultra-spécifique ? React 19 + Three.js + WebGL Shaders ?
                Tape tes skills. Notre moteur compose un QCM dédié — 15 questions calibrées
                sur tes besoins exacts.
              </p>

              <ul className="mt-7 space-y-2.5">
                {[
                  "Suggestion automatique de 30 questions pertinentes",
                  "Tu cures les 15 finales en un clic",
                  "Les talents qui le passent apparaissent dans TON classement",
                  "Anti-cheat hérité du QCM officiel (cooldown 1 mois, lockout multi-clé)",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2.5 text-[13.5px] text-white/85">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300 shrink-0 mt-0.5">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/qcm-builder"
                className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-white hover:bg-cyan-50 text-night-900 px-6 text-[13px] font-bold uppercase tracking-[0.06em] transition group"
                style={{
                  boxShadow: "0 4px 0 0 #94A3B8, 0 12px 28px -8px rgba(0,0,0,0.4)",
                }}
              >
                <Wand2 className="h-4 w-4" strokeWidth={2.6} />
                Essayer le QCM Builder
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  strokeWidth={2.8}
                />
              </Link>
            </div>

            {/* Right : mockup builder */}
            <div className="relative">
              <div className="rounded-2xl bg-white/95 backdrop-blur-sm shadow-2xl p-5 ring-1 ring-inset ring-black/5">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400">
                  Poste recherché
                </p>
                <p className="mt-1.5 font-display text-[18px] font-black text-mist-50 leading-tight">
                  Frontend Engineer (3D Web)
                </p>

                <p className="mt-5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400">
                  Compétences clés
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {SAMPLE_SKILLS.map((s) => (
                    <span
                      key={s}
                      className="inline-flex h-7 items-center rounded-full bg-cyan-100 ring-1 ring-inset ring-cyan-300/40 px-2.5 text-[11.5px] font-bold text-cyan-800"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-ink-700/10">
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400 flex items-center gap-1.5">
                    <Brain className="h-3 w-3" strokeWidth={2.6} />
                    Suggestions générées
                  </p>
                  <ul className="mt-3 space-y-2">
                    {[
                      "Quelle est la différence entre forwardRef et useImperativeHandle ?",
                      "Comment optimiser un mesh > 100k vertices ?",
                      "À quoi sert useFrame() dans R3F ?",
                    ].map((q, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] text-mist-200">
                        <span className="font-display font-black text-cyan-600 shrink-0 w-5">
                          Q{i + 1}
                        </span>
                        <span className="leading-snug">{q}</span>
                      </li>
                    ))}
                    <li className="text-[10.5px] text-mist-400 italic pt-1">
                      + 27 autres suggérées · clique pour curer
                    </li>
                  </ul>
                </div>
              </div>

              {/* Floating badge */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -right-4 inline-flex items-center gap-1.5 rounded-full bg-amber-400 text-ink-950 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.10em] shadow-lg"
                style={{
                  boxShadow: "0 4px 0 0 #C99A00, 0 12px 24px -6px rgba(245,158,11,0.5)",
                }}
              >
                <Sparkles className="h-3 w-3" strokeWidth={2.8} />
                IA assistée
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
