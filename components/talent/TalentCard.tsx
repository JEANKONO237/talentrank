"use client";

import Link from "next/link";
import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { AvatarChip } from "@/components/ui/AvatarChip";
import { TierEmblem } from "@/components/ui/TierEmblem";
import { ExperienceBadge } from "@/components/ui/ExperienceBadge";
import { AvailabilityDot } from "@/components/ui/AvailabilityDot";
import { Flag } from "@/components/ui/Flag";
import { ProposeInterviewModal } from "@/components/recruiter/ProposeInterviewModal";
import { CrosshairOverlay } from "@/components/hunter/CrosshairOverlay";
import { findCountry } from "@/lib/countries";
import { getDiscipline } from "@/lib/disciplines";
import { PROFESSIONS, type ProfessionCategoryId } from "@/lib/professions";
import { tierForPercentile } from "@/lib/tiers";
import type { Talent } from "@/lib/mock-talents";
import { cn } from "@/lib/utils";

interface TalentCardProps {
  talent: Talent;
  variant?: "default" | "compact";
  className?: string;
  rankIndex?: number;
  showRecruiterActions?: boolean;
}

export function TalentCard({ talent, className, rankIndex }: TalentCardProps) {
  const country = findCountry(talent.countryCode);
  const nationality = findCountry(talent.nationalityCode ?? talent.countryCode);
  const isDual = nationality.code !== country.code;
  const discipline = getDiscipline(talent.discipline);
  const profession = talent.professionId
    ? PROFESSIONS.find((p) => p.id === talent.professionId)
    : undefined;
  const roleLabel = profession?.short ?? discipline.short;
  const category: ProfessionCategoryId = (profession?.category ?? "creative") as ProfessionCategoryId;
  const tier = tierForPercentile(talent.percentile);

  const [proposeOpen, setProposeOpen] = useState(false);

  return (
    <>
      <div
        className={cn(
          "group relative flex flex-col items-center text-center",
          "rounded-3xl bg-ink-900 border border-ink-700/40 hover:border-ink-700/70",
          "shadow-card hover:shadow-card-hover active:shadow-card-press",
          "card-squash overflow-hidden",
          "pt-8 pb-5 px-5",
          className,
        )}
        role="article"
        aria-label={`Talent ${talent.name} · ${roleLabel} · Score ${talent.score} · ${tier.label}. Cliquer pour voir le profil et le shortlister.`}
      >
        {/* Crosshair viseur — apparait au hover si audience studio.
            Concept Bounty Hunter : tu vises la prime. Décoratif (aria-hidden)
            l'info "shortlisterable" est dans le aria-label parent (G2-Anya-2). */}
        <CrosshairOverlay accent="#F59E0B" />

        {/* Experience class badge top-left (Solo Leveling style: S/A/B/C/D/E) */}
        <div className="absolute left-3 top-3">
          <ExperienceBadge years={talent.yearsExperience} size="sm" />
        </div>

        {/* Rank badge (if provided) — small floater under the class badge */}
        {rankIndex != null && (
          <span className="absolute left-3 top-12 inline-flex items-center rounded-full bg-ink-850 ring-1 ring-inset ring-ink-700/40 px-2 py-0.5 font-mono text-[10px] font-bold text-mist-400">
            #{rankIndex + 1}
          </span>
        )}

        {/* Tier emblem top-right — the animal is the visual hero */}
        <div className="absolute right-3 top-3">
          <TierEmblem tier={tier.id} size="sm" />
        </div>

        {/* Avatar + flag */}
        <Link href={`/talent/${talent.slug}`} className="mt-2">
          <AvatarChip
            initials={talent.initials}
            gradient={`bg-gradient-to-br ${talent.avatarGradient}`}
            category={category}
            size="lg"
          />
        </Link>

        {/* Name + métier */}
        <Link
          href={`/talent/${talent.slug}`}
          className="mt-4 inline-block focus:outline-none"
        >
          <h3 className="font-display text-[18px] font-bold tracking-tight text-mist-50 group-hover:text-duo-blue transition-colors">
            {talent.name}
          </h3>
          <p className="mt-0.5 text-[13px] font-medium text-mist-300">{roleLabel}</p>
        </Link>

        {/* Score — big, central, with the tier color */}
        <div
          className="mt-4 inline-flex h-12 min-w-[64px] items-center justify-center rounded-full px-4 font-display font-bold text-white text-[20px]"
          style={{
            background: `linear-gradient(180deg, ${tier.highlight}, ${tier.color})`,
            boxShadow: `0 4px 0 0 ${tier.color}99, inset 0 1px 0 rgba(255,255,255,0.4)`,
            color: tier.id === "rising" || tier.id === "emerging" || tier.id === "new" ? "#1B1208" : "#FFFFFF",
          }}
        >
          {talent.score}
        </div>

        {/* Tier label + small flag */}
        <div className="mt-3 flex items-center gap-2 text-[11px]">
          <span className="font-bold uppercase tracking-[0.12em]" style={{ color: tier.color }}>
            {tier.label} · {tier.range}
          </span>
        </div>

        {/* Availability */}
        <div className="mt-3 flex items-center gap-2 text-[12px] text-mist-400">
          <AvailabilityDot status={talent.availability} />
        </div>

        {/* Residence + nationality */}
        <div className="mt-2 flex flex-col items-center gap-1 text-mist-300">
          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold">
            <Flag code={country.code} size="xs" />
            Vit à {talent.city ?? country.name}
          </span>
          {isDual && (
            <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-mist-400">
              <Flag code={nationality.code} size="xs" />
              {nationality.name}
            </span>
          )}
        </div>

        {/* Single CTA */}
        <button
          onClick={() => setProposeOpen(true)}
          className={cn(
            "mt-5 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-2xl",
            "bg-gradient-to-b from-duo-blue to-[#1A9DDB] text-white font-bold uppercase tracking-[0.04em] text-[12.5px]",
            "border-b-[3px] border-duo-blue-deep",
            "transition-all duration-100",
            "hover:brightness-105 active:translate-y-[2px] active:border-b-[1px]",
          )}
        >
          <MessageSquarePlus className="h-4 w-4" strokeWidth={2.5} />
          Proposer un entretien
        </button>
      </div>

      {proposeOpen && (
        <ProposeInterviewModal
          talent={{
            id: talent.id,
            name: talent.name,
            roleLabel,
            initials: talent.initials,
            gradient: talent.avatarGradient,
          }}
          onClose={() => setProposeOpen(false)}
        />
      )}
    </>
  );
}
