"use client";

import { motion } from "framer-motion";
import { Filter, Search, UserCheck } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// StudioHowItWorks — 3 étapes côté recruteur. Ton sec, efficacité.
//
//   1. Tape un métier précis
//   2. Filtre par ville, dispo, score
//   3. Contacte directement les meilleurs
//
// Pas de mascotte. Lignes nettes. Numérotation forte.
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    n: "01",
    icon: Search,
    title: "Tape un métier précis.",
    body: "Animateur 3D Unreal · Frontend React · Boulanger MOF. Le classement filtre par ce métier — jamais d'amalgame.",
    accent: "#1A2535",
  },
  {
    n: "02",
    icon: Filter,
    title: "Affine 17 critères.",
    body: "Ville, disponibilité, score min, ligue, années d'exp, software, langue, secteur. Le système ne te montre QUE qui matche.",
    accent: "#2C3E55",
  },
  {
    n: "03",
    icon: UserCheck,
    title: "Contacte les meilleurs.",
    body: "Pas de candidature à lire. Tu vois le score, le portfolio, la dispo. Un clic = entretien programmé.",
    accent: "#4D5A6B",
  },
];

export function StudioHowItWorks() {
  return (
    <section className="relative py-24 sm:py-28">
      <div className="container-page">
        <div className="text-center max-w-2xl mx-auto">
          <h2
            className="font-display font-black tracking-tight text-mist-50"
            style={{
              fontSize: "clamp(2rem, 4.5vw, 3.2rem)",
              lineHeight: 1.02,
              letterSpacing: "-0.02em",
            }}
          >
            Trois étapes.{" "}
            <span className="relative inline-block">
              Zéro candidature.
              <span
                aria-hidden
                className="absolute left-0 right-0 -bottom-1 sm:-bottom-1.5 h-[4px] sm:h-[5px] rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(26,37,53,0.28) 0%, rgba(26,37,53,0.55) 50%, rgba(26,37,53,0.28) 100%)",
                }}
              />
            </span>
          </h2>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 max-w-5xl mx-auto">
          {STEPS.map((step, i) => (
            <StudioStepCard key={step.n} step={step} delay={0.15 + i * 0.1} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StudioStepCard({
  step,
  delay,
}: {
  step: (typeof STEPS)[number];
  delay: number;
}) {
  const Icon = step.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: [0.2, 0.7, 0.2, 1] }}
      className="card-white relative p-7 group"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-20 blur-3xl transition-opacity duration-300 group-hover:opacity-40"
        style={{ background: step.accent }}
      />

      <div className="relative flex items-center gap-3">
        <span
          className="font-display text-[42px] font-black leading-none tabular-nums"
          style={{ color: step.accent }}
        >
          {step.n}
        </span>
        <span
          className="grid h-12 w-12 place-items-center rounded-2xl"
          style={{
            background: `${step.accent}15`,
            color: step.accent,
          }}
        >
          <Icon className="h-6 w-6" strokeWidth={2.2} />
        </span>
      </div>

      <h3 className="relative mt-5 font-display text-[20px] font-black leading-tight tracking-tight text-mist-50">
        {step.title}
      </h3>
      <p className="relative mt-2.5 text-[13.5px] leading-relaxed text-mist-300">
        {step.body}
      </p>
    </motion.div>
  );
}
