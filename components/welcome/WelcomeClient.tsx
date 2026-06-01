"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Building2, Sparkles, Trophy, UserCircle, Zap } from "lucide-react";
import { LeagueMascot } from "@/components/ui/LeagueMascot";
import { Logo } from "@/components/ui/Logo";
import { browseAsVisitor, chooseAudience } from "@/app/welcome/actions";
import { triggerHaptic } from "@/lib/haptic";
import { track } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";
import type { Audience } from "@/lib/audience/types";

// ─────────────────────────────────────────────────────────────────────────────
// WelcomeClient — l'aiguillage. Plein écran, deux cards immersives.
//
// Design :
//   - Pas de nav, pas de footer ; le user doit choisir
//   - Logo en haut (légitime la marque) + petite phrase d'accueil
//   - 2 cards côte à côte (stack mobile) : Talent · Entreprise
//   - Chaque card a son ambiance brand : Talent=ambre/Lion · Entreprise=nuit/Aigle
//   - Hover : la card s'illumine, l'autre se met en retrait (radial focus)
//   - Click : server action set cookie + redirect
// ─────────────────────────────────────────────────────────────────────────────

export function WelcomeClient() {
  const [hovering, setHovering] = useState<Audience | null>(null);
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Audience | null>(null);

  const handleChoose = (audience: Audience) => {
    if (pending) return;
    setSelected(audience);
    triggerHaptic("medium");
    // Top-of-funnel : on log avant la nav pour ne pas perdre l'event.
    track("welcome_audience_chosen", { audience });
    startTransition(async () => {
      await chooseAudience(audience);
    });
  };

  return (
    <main
      className="relative min-h-screen w-full overflow-hidden flex flex-col"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(255,200,0,0.10), transparent 60%), radial-gradient(ellipse 60% 50% at 50% 110%, rgba(28,176,246,0.08), transparent 60%), #FFFFFF",
      }}
    >
      {/* Logo top center */}
      <header className="pt-10 pb-4 flex justify-center">
        <Logo size={42} withWordmark />
      </header>

      {/* Eyebrow + tagline */}
      <div className="text-center mt-6 max-w-2xl mx-auto px-6">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-[11px] font-bold uppercase tracking-[0.24em] text-mist-400"
        >
          Bienvenue
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="mt-4 font-display font-black tracking-tight text-mist-50"
          style={{
            fontSize: "clamp(2.2rem, 5.5vw, 4rem)",
            lineHeight: 1.02,
            letterSpacing: "-0.025em",
          }}
        >
          Tu es{" "}
          <span className="relative inline-block">
            qui ?
            <motion.span
              aria-hidden
              initial={{ scaleX: 0, transformOrigin: "0% 50%" }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
              className="absolute left-0 right-0 -bottom-1 sm:-bottom-1.5 h-[6px] sm:h-[8px] rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, rgba(255,200,0,0.3) 0%, rgba(255,200,0,0.7) 50%, rgba(255,200,0,0.3) 100%)",
              }}
            />
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 text-[15px] sm:text-[16px] text-mist-300 leading-relaxed"
        >
          TalentRank, c&apos;est deux univers en miroir.
          <br />
          Choisis le tien — tu peux changer à tout moment.
        </motion.p>
      </div>

      {/* Two giant cards */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 max-w-5xl w-full">
          <AudienceCard
            audience="talent"
            isHover={hovering === "talent"}
            isOther={hovering === "studio"}
            isPending={pending && selected === "talent"}
            onHover={(v) => setHovering(v ? "talent" : null)}
            onClick={() => handleChoose("talent")}
          />
          <AudienceCard
            audience="studio"
            isHover={hovering === "studio"}
            isOther={hovering === "talent"}
            isPending={pending && selected === "studio"}
            onHover={(v) => setHovering(v ? "studio" : null)}
            onClick={() => handleChoose("studio")}
          />
        </div>

        {/* 3e voie — audit Erin G3-Erin-1 : pour les indécis. Explorer
            librement sans engagement, sans choisir une audience. */}
        <form action={browseAsVisitor} className="mt-8">
          <button
            type="submit"
            onClick={() => track("welcome_audience_chosen", { audience: "browse" })}
            className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[12.5px] font-bold text-mist-300 hover:text-mist-50 hover:bg-white/50 transition"
            aria-label="Juste explorer sans choisir"
          >
            Juste curieux ?{" "}
            <span className="underline decoration-amber-300 decoration-2 underline-offset-2">
              Explorer librement
            </span>
            <span aria-hidden> →</span>
          </button>
        </form>
      </div>

      {/* Foot note */}
      <footer className="pb-8 text-center text-[11.5px] text-mist-400">
        <Sparkles className="inline-block h-3 w-3 -mt-0.5 mr-1 text-amber-600" strokeWidth={2.6} />
        Choix réversible depuis ton profil · Aucune création de compte requise pour explorer
      </footer>
    </main>
  );
}

// ─── AudienceCard ────────────────────────────────────────────────────────

function AudienceCard({
  audience,
  isHover,
  isOther,
  isPending,
  onHover,
  onClick,
}: {
  audience: Audience;
  isHover: boolean;
  isOther: boolean;
  isPending: boolean;
  onHover: (v: boolean) => void;
  onClick: () => void;
}) {
  const config = audience === "talent" ? TALENT_CONFIG : STUDIO_CONFIG;
  const Icon = config.icon;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onFocus={() => onHover(true)}
      onBlur={() => onHover(false)}
      disabled={isPending}
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{
        opacity: isOther ? 0.5 : 1,
        y: 0,
        scale: isHover ? 1.02 : 1,
      }}
      transition={{
        duration: 0.45,
        delay: audience === "talent" ? 0.35 : 0.45,
        ease: [0.2, 0.7, 0.2, 1],
      }}
      className={cn(
        "relative group overflow-hidden rounded-[28px] text-left p-7 sm:p-9 transition-shadow duration-300",
        "ring-1 ring-inset",
        isPending && "cursor-wait",
      )}
      style={{
        background: config.bg,
        boxShadow: isHover
          ? `0 28px 64px -16px ${config.shadowColor}, inset 0 1px 0 rgba(255,255,255,0.55), 0 0 0 2px ${config.accent}`
          : `0 16px 40px -16px ${config.shadowColor}, inset 0 1px 0 rgba(255,255,255,0.55), 0 0 0 1px rgba(0,0,0,0.04)`,
      }}
      aria-label={`Choisir : Je suis ${config.label}`}
    >
      {/* Halo accent top-right */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full opacity-50 blur-3xl transition-opacity duration-300 group-hover:opacity-75"
        style={{ background: config.accent }}
      />

      {/* Mascot/icon centerpiece */}
      <div className="relative flex justify-center mb-6">
        <motion.div
          animate={isHover ? { y: -6, scale: 1.05 } : { y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
          className="relative grid place-items-center rounded-full"
          style={{
            width: 140,
            height: 140,
            background: config.orbBg,
            boxShadow: config.orbShadow,
          }}
        >
          {config.mascot ? (
            <LeagueMascot
              tier={config.mascot}
              size={96}
              className="drop-shadow-[0_6px_12px_rgba(0,0,0,0.3)]"
            />
          ) : (
            <Icon
              className="h-16 w-16 text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)]"
              strokeWidth={1.8}
            />
          )}
        </motion.div>
      </div>

      {/* Title */}
      <div className="relative text-center">
        <p
          className="text-[10.5px] font-bold uppercase tracking-[0.22em]"
          style={{ color: config.eyebrow }}
        >
          {config.eyebrowText}
        </p>
        <h2
          className="mt-2 font-display font-black tracking-tight"
          style={{
            fontSize: "clamp(1.6rem, 3.2vw, 2.2rem)",
            color: config.titleColor,
            letterSpacing: "-0.02em",
          }}
        >
          {config.title}
        </h2>
        <p
          className="mt-3 text-[14px] sm:text-[14.5px] leading-relaxed mx-auto max-w-[340px]"
          style={{ color: config.bodyColor }}
        >
          {config.body}
        </p>
      </div>

      {/* Feature highlights — audit Anya G2-Anya-3 :
          label "Tu vas pouvoir" explicite + contraste renforcé pour aider la
          décision. Le user qui hésite voit clairement ce qu'il obtient. */}
      <div className="relative mt-6 max-w-[320px] mx-auto">
        <p
          className="text-[10.5px] font-black uppercase tracking-[0.18em] mb-3 text-center"
          style={{ color: config.accent }}
        >
          ↓ Tu vas pouvoir ↓
        </p>
        <ul className="space-y-2.5">
          {config.features.map((f, i) => (
            <li
              key={i}
              className="flex items-center gap-2.5 text-[13px] font-medium"
              style={{ color: config.bodyColor }}
            >
              <span
                className="inline-flex h-6 w-6 items-center justify-center rounded-full shrink-0"
                style={{
                  background: config.accent,
                  color: "#FFFFFF",
                  boxShadow: `0 2px 6px -1px ${config.accent}66`,
                }}
              >
                <f.icon className="h-3.5 w-3.5" strokeWidth={2.6} />
              </span>
              <span>{f.label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA badge — visible mais pas un bouton qui catch le click du parent */}
      <div className="relative mt-7 flex justify-center">
        <span
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[12.5px] font-bold uppercase tracking-[0.06em]"
          style={{
            background: config.ctaBg,
            color: config.ctaText,
            boxShadow: `inset 0 1px 0 ${config.ctaInset}, 0 8px 20px -6px ${config.shadowColor}`,
          }}
        >
          {isPending ? "Chargement…" : config.ctaLabel}
          {!isPending && (
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1"
              strokeWidth={2.8}
            />
          )}
        </span>
      </div>
    </motion.button>
  );
}

// ─── Config par audience ─────────────────────────────────────────────────

const TALENT_CONFIG = {
  label: "Talent",
  icon: UserCircle,
  mascot: "senior" as const, // Lion Or
  eyebrowText: "Je suis Talent",
  eyebrowColor: "#B45309",
  eyebrow: "#B45309",
  title: "Monte au classement.",
  body: "Passe le QCM officiel de ton métier. Construis ton profil. Sois trouvé par les studios qui comptent.",
  bg: "linear-gradient(135deg, #FFF8E1 0%, #FFE8B0 100%)",
  accent: "#F59E0B",
  shadowColor: "rgba(245, 158, 11, 0.35)",
  orbBg:
    "radial-gradient(circle at 30% 25%, #FFE082, #F59E0B 60%, #B45309 100%)",
  orbShadow:
    "0 16px 32px -8px rgba(245,158,11,0.55), inset 0 3px 0 rgba(255,255,255,0.55), inset 0 -14px 22px -8px rgba(0,0,0,0.35)",
  titleColor: "#1B1208",
  bodyColor: "#3E2E1B",
  ctaBg: "linear-gradient(180deg, #FFEAA0, #FFC800)",
  ctaText: "#1B1208",
  ctaInset: "rgba(255,255,255,0.5)",
  ctaLabel: "Commencer mon parcours",
  features: [
    { icon: Trophy, label: "Classement par métier + ville" },
    { icon: Zap, label: "QCM intelligent · niveaux 1→50" },
    { icon: Sparkles, label: "Badges, ligues, récompenses" },
  ],
};

const STUDIO_CONFIG = {
  label: "Entreprise",
  icon: Building2,
  mascot: undefined,
  eyebrowText: "Je suis Entreprise",
  eyebrowColor: "#1A2535",
  eyebrow: "#1A2535",
  title: "Chasse les meilleurs.",
  body: "Recherche par métier précis. Filtres avancés. Shortlist, comparaison, génère ton propre QCM. Sans CV à lire.",
  bg: "linear-gradient(135deg, #E7EAEF 0%, #C6CCD6 100%)",
  accent: "#1A2535",
  shadowColor: "rgba(26, 37, 53, 0.30)",
  orbBg:
    "radial-gradient(circle at 30% 25%, #4D5A6B, #2C3E55 60%, #0A1018 100%)",
  orbShadow:
    "0 16px 32px -8px rgba(26,37,53,0.55), inset 0 3px 0 rgba(255,255,255,0.18), inset 0 -14px 22px -8px rgba(0,0,0,0.5)",
  titleColor: "#0A1018",
  bodyColor: "#1F3045",
  ctaBg: "linear-gradient(180deg, #2C3E55, #1A2535)",
  ctaText: "#FFFFFF",
  ctaInset: "rgba(255,255,255,0.15)",
  ctaLabel: "Accéder à la chasse",
  features: [
    { icon: Trophy, label: "Top candidats classés par métier" },
    { icon: Zap, label: "QCM personnalisé pour ton poste" },
    { icon: Sparkles, label: "Matching intelligent · Shortlist" },
  ],
};
