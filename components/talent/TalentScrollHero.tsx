"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { AvatarChip } from "@/components/ui/AvatarChip";
import { TierEmblem } from "@/components/ui/TierEmblem";
import { ExperienceBadge } from "@/components/ui/ExperienceBadge";
import { AvailabilityDot } from "@/components/ui/AvailabilityDot";
import { Flag } from "@/components/ui/Flag";
import { CanvasRevealEffect } from "@/components/ui/canvas-reveal";
import { findCountry } from "@/lib/countries";
import { getDiscipline } from "@/lib/disciplines";
import { PROFESSIONS } from "@/lib/professions";
import { tierForPercentile } from "@/lib/tiers";
import type { Talent } from "@/lib/mock-talents";

interface TalentScrollHeroProps {
  talent: Talent;
}

// Scroll-tied reveal: the talent's identity card starts small + centered,
// then grows as the user scrolls. After the section, normal scroll resumes
// and the rest of the profile content shows.
//
// Uses Framer Motion's `useScroll` (no scroll-jacking) for buttery feel.

export function TalentScrollHero({ talent }: TalentScrollHeroProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Card grows from 0.55× to 1.18× as the user scrolls through the section.
  const cardScale = useTransform(scrollYProgress, [0, 0.85], [0.55, 1.18]);
  const cardOpacity = useTransform(scrollYProgress, [0.75, 1], [1, 0]);
  const bgOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0.25]);
  // Hint at bottom fades out once user starts scrolling
  const hintOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  const country = findCountry(talent.countryCode);
  const nationality = findCountry(talent.nationalityCode ?? talent.countryCode);
  const isDual = nationality.code !== country.code;
  const tier = tierForPercentile(talent.percentile);
  const discipline = getDiscipline(talent.discipline);
  const profession = talent.professionId
    ? PROFESSIONS.find((p) => p.id === talent.professionId)
    : undefined;
  const roleLabel = profession?.label ?? discipline.label;

  return (
    <section ref={ref} className="relative h-[140vh]">
      {/* Sticky viewport that holds the expanding card */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Animated dot-matrix BG, fades out as user scrolls past */}
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{ opacity: bgOpacity }}
          aria-hidden
        >
          <CanvasRevealEffect
            colors={[
              [88, 204, 2],
              [28, 176, 246],
              [206, 130, 255],
            ]}
            dotSize={3}
            animationSpeed={0.6}
            showGradient={false}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 50% 50%, transparent 0%, rgba(255,251,241,0.7) 80%)",
            }}
          />
        </motion.div>

        {/* Back link */}
        <div className="absolute left-5 top-6 z-30 sm:left-8 sm:top-7">
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/90 ring-1 ring-ink-700/30 backdrop-blur px-3.5 py-2 text-[12.5px] font-semibold text-mist-200 hover:bg-white shadow-card"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.4} />
            Retour
          </Link>
        </div>

        {/* The card itself — scale-tied to scroll */}
        <div className="absolute inset-0 grid place-items-center">
          <motion.div
            className="relative isolate origin-center overflow-hidden rounded-[40px]"
            style={{
              scale: cardScale,
              opacity: cardOpacity,
              boxShadow:
                "0 30px 80px -20px rgba(0,0,0,0.4), 0 8px 0 0 rgba(213,200,164,0.6)",
              background: `radial-gradient(120% 100% at 30% 0%, ${tier.highlight} 0%, ${tier.color} 60%, ${tier.color}dd 100%)`,
              width: "min(360px, 86vw)",
              height: "min(520px, 76vh)",
            }}
          >
            {/* Subtle noise + radial overlays for premium feel */}
            <div className="pointer-events-none absolute inset-0 bg-noise opacity-[0.05] mix-blend-overlay" />
            <div
              className="pointer-events-none absolute -inset-x-10 -top-10 h-32 rounded-full"
              style={{
                background: `radial-gradient(circle, ${tier.highlight}99, transparent 70%)`,
                filter: "blur(40px)",
              }}
            />

            {/* Card content */}
            <div className="relative h-full w-full flex flex-col items-center justify-center px-6 py-8 text-center">
              {/* Experience class badge top-left */}
              <div className="absolute left-5 top-5">
                <ExperienceBadge years={talent.yearsExperience} size="md" />
              </div>
              {/* Tier emblem top-right */}
              <div className="absolute right-5 top-5">
                <TierEmblem tier={tier.id} size="md" />
              </div>

              {/* Avatar with country flag */}
              <AvatarChip
                initials={talent.initials}
                gradient={`bg-gradient-to-br ${talent.avatarGradient}`}
                countryCode={country.code}
                size="xl"
              />

              {/* Name */}
              <h1
                className="mt-6 font-display text-[26px] sm:text-[32px] font-black tracking-tight text-white"
                style={{ textShadow: "0 3px 14px rgba(0,0,0,0.32)" }}
              >
                {talent.name}
              </h1>
              <p
                className="mt-1 text-[13.5px] font-semibold text-white/95"
                style={{ textShadow: "0 1px 8px rgba(0,0,0,0.3)" }}
              >
                {roleLabel}
              </p>

              {/* Score orb */}
              <div className="mt-5 inline-flex items-center gap-3 rounded-full bg-ink-950/35 px-4 py-2 backdrop-blur-md ring-1 ring-inset ring-white/20">
                <span
                  className="font-display text-[28px] font-black text-white leading-none"
                  style={{ textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}
                >
                  {talent.score}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/90">
                  {tier.label} · {tier.range}
                </span>
              </div>

              {/* Location */}
              <div className="mt-5 flex flex-col items-center gap-1.5 text-white">
                <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold">
                  <Flag code={country.code} size="xs" />
                  Vit à {talent.city ?? country.name}
                </span>
                {isDual && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-white/80">
                    <Flag code={nationality.code} size="xs" />
                    {nationality.name}
                  </span>
                )}
              </div>

              {/* Availability */}
              <div className="mt-4">
                <AvailabilityDot status={talent.availability} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll hint at bottom */}
        <motion.div
          className="pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center gap-2"
          style={{ opacity: hintOpacity }}
        >
          <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-mist-300">
            Scroll pour explorer le profil
          </p>
          <motion.span
            className="text-mist-300 text-[14px]"
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          >
            ↓
          </motion.span>
        </motion.div>
      </div>
    </section>
  );
}
