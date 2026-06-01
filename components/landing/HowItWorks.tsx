"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

// ─────────────────────────────────────────────────────────────────────────────
// HowItWorks — 3 grandes étapes illustrées, light theme, beaucoup de blanc.
//
//   1. Choisis un métier      (Map+Compass)
//   2. Le classement filtre   (Trophée)
//   3. Entretien privé        (Clipboard)
//
// Plus de 2 colonnes Talents/Entreprises, plus de bridge stripe — la page
// raconte UN parcours, pas une compétition. La preuve sociale (stats live)
// reste en clôture pour ancrer la crédibilité.
// ─────────────────────────────────────────────────────────────────────────────

interface Step {
  n: string;
  title: string;
  body: string;
  image: string;
  alt: string;
  accent: string;
}

const STEPS: Step[] = [
  {
    n: "01",
    title: "Choisis un métier.",
    body: "Pas un mot-clé. Un métier précis — Animateur 3D, Boulanger, Frontend…",
    image: "/images/banner/5.png",
    alt: "Carte au trésor et boussole",
    accent: "#1CB0F6",
  },
  {
    n: "02",
    title: "Le classement filtre.",
    body: "Les meilleurs profils du métier apparaissent. Score, ligue, dispo — instantané.",
    image: "/images/banner/3.png",
    alt: "Trophée doré sur podium",
    accent: "#FFC800",
  },
  {
    n: "03",
    title: "Entretien privé.",
    body: "Un clic. Pas d'annonce, pas de CV à lire. Direct, structuré, sans bruit.",
    image: "/images/banner/2.png",
    alt: "Clipboard A+ avec stylo",
    accent: "#A78BFA",
  },
];

export function HowItWorks() {
  return (
    <section className="relative py-24 sm:py-28">
      <div className="container-page">
        {/* Header */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
          {/* Eyebrow "Comment ça marche" retiré — le titre l'exprime déjà */}
          <h2
            className="mt-4 font-display font-black tracking-tight text-mist-50"
            style={{
              fontSize: "clamp(2rem, 4.5vw, 3.2rem)",
              lineHeight: 1.02,
              letterSpacing: "-0.02em",
            }}
          >
            Trois étapes.{" "}
            <span className="relative inline-block">
              Aucun intermédiaire.
              <span
                aria-hidden
                className="absolute left-0 right-0 -bottom-1 sm:-bottom-1.5 h-[4px] sm:h-[5px] rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(255,200,0,0.28) 0%, rgba(255,200,0,0.55) 50%, rgba(255,200,0,0.28) 100%)",
                }}
              />
            </span>
          </h2>
        </div>

        {/* 3 illustrated steps */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 max-w-5xl mx-auto">
          {STEPS.map((step, i) => (
            <StepCard key={step.n} step={step} delay={0.15 + i * 0.1} />
          ))}
        </div>

        {/* Live stats strip — anchors the section, hints at scale */}
        <LiveStatsStrip />
      </div>
    </section>
  );
}

// ─── StepCard ────────────────────────────────────────────────────────────

function StepCard({ step, delay }: { step: Step; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: [0.2, 0.7, 0.2, 1] }}
      className="group relative rounded-[28px] bg-white ring-1 ring-inset ring-ink-700/10 shadow-card p-7 text-center overflow-hidden transition-shadow duration-300 hover:shadow-card-hover"
    >
      {/* Accent halo top-right */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-25 blur-3xl transition-opacity duration-300 group-hover:opacity-50"
        style={{ background: step.accent }}
      />

      {/* Step number */}
      <span
        className="relative inline-block font-display text-[42px] font-black leading-none tabular-nums"
        style={{ color: step.accent }}
      >
        {step.n}
      </span>

      {/* Illustration */}
      <div className="relative mx-auto mt-5 w-[130px] h-[110px]">
        <Image
          src={step.image}
          alt={step.alt}
          fill
          sizes="130px"
          className="object-contain drop-shadow-[0_8px_14px_rgba(0,0,0,0.18)] transition-transform duration-300 group-hover:scale-[1.06] group-hover:-rotate-[2deg]"
        />
      </div>

      {/* Copy */}
      <h3 className="relative mt-5 font-display text-[20px] font-black leading-tight tracking-tight text-mist-50">
        {step.title}
      </h3>
      <p className="relative mt-2.5 text-[13.5px] leading-relaxed text-mist-300">
        {step.body}
      </p>
    </motion.div>
  );
}

// ─── Live stats strip (kept from previous version) ───────────────────────

function LiveStatsStrip() {
  // Audit Erin G3-Erin-4 : transparence sur l'inventaire réel.
  // Au lieu de chiffres marketing fake (12842 talents, etc.), on affiche les
  // VRAIS metrics du projet pré-launch. Quand des cohortes réelles seront
  // indexées, on remplacera par des chiffres dynamiques depuis Supabase.
  const stats: { label: string; value: string | number; accent: string }[] = [
    { label: "banques QCM actives",     value: 3,    accent: "#22D3EE" },
    { label: "ligues de progression",   value: 6,    accent: "#58CC02" },
    { label: "niveaux XP par profil",   value: 50,   accent: "#F59E0B" },
    { label: "lancement",               value: "Beta", accent: "#A78BFA" },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      className="mt-20 mx-auto max-w-3xl"
    >
      <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-mist-400">
        <span className="relative inline-flex h-1.5 w-1.5">
          <span className="absolute inset-0 rounded-full bg-amber-500 animate-ping opacity-60" />
          <span className="relative h-1.5 w-1.5 rounded-full bg-amber-500" />
        </span>
        Pré-launch · État réel
      </div>
      <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-[13px]">
        {stats.map((s, i) => (
          <li key={s.label} className="flex items-center gap-2.5">
            <span
              className="h-1.5 w-1.5 rounded-full shrink-0"
              style={{ background: s.accent, boxShadow: `0 0 8px ${s.accent}` }}
              aria-hidden
            />
            {typeof s.value === "number" ? (
              <AnimatedNumber
                value={s.value}
                duration={1500 + i * 120}
                className="font-display font-black tabular-nums text-mist-50"
              />
            ) : (
              <span className="font-display font-black text-mist-50">{s.value}</span>
            )}
            <span className="text-mist-400">{s.label}</span>
            {i < stats.length - 1 && (
              <span aria-hidden className="hidden sm:inline-block ml-1 h-3 w-px bg-ink-700/20" />
            )}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
