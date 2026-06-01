"use client";

import { motion } from "framer-motion";
import { MapPin, Star } from "lucide-react";
import { LeagueMascot } from "@/components/ui/LeagueMascot";
import { TIERS, type TierId } from "@/lib/tiers";

// ─────────────────────────────────────────────────────────────────────────────
// LiveRankingPreview — montre à QUOI ressemble un classement métier vu côté
// recruteur. Cette section RÉPOND à la question "Concrètement, je vois quoi
// quand je clique chasser ?".
//
// Mock data : Top 5 Animateurs 3D à Paris. Quand l'API ranking est branchée,
// remplacer par <RankingTable profession="animation-3d" city="paris" limit=5 />.
// ─────────────────────────────────────────────────────────────────────────────

interface RankRow {
  rank: number;
  name: string;
  initials: string;
  tier: TierId;
  score: number;
  city: string;
  availability: "now" | "30d" | "90d";
  yearsExp: number;
  topSkill: string;
}

const MOCK_ROWS: RankRow[] = [
  { rank: 1, name: "Aya Tanaka", initials: "AT", tier: "elite",    score: 94, city: "Paris",     availability: "30d", yearsExp: 12, topSkill: "Unreal · MoCap" },
  { rank: 2, name: "Léo Martin", initials: "LM", tier: "senior",   score: 88, city: "Paris 11e", availability: "now", yearsExp: 8,  topSkill: "Maya · Rigging" },
  { rank: 3, name: "Sara Khoury", initials: "SK", tier: "senior",  score: 85, city: "Paris 18e", availability: "now", yearsExp: 7,  topSkill: "Blender · VFX" },
  { rank: 4, name: "Tomás Rivas", initials: "TR", tier: "trending", score: 79, city: "Paris 09e", availability: "30d", yearsExp: 5,  topSkill: "Houdini · Sim" },
  { rank: 5, name: "Mei Lin",    initials: "ML", tier: "trending", score: 76, city: "Paris 13e", availability: "90d", yearsExp: 4,  topSkill: "Unreal · Lighting" },
];

const AVAILABILITY_LABEL: Record<RankRow["availability"], { label: string; color: string }> = {
  now: { label: "Dispo", color: "#10B981" },
  "30d": { label: "30j", color: "#F59E0B" },
  "90d": { label: "90j", color: "#94A3B8" },
};

export function LiveRankingPreview() {
  return (
    <section className="relative py-24 sm:py-28 bg-ink-850">
      <div className="container-page">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-night-500">
            Exemple live · Animation 3D · Paris
          </p>
          <h2
            className="mt-4 font-display font-black tracking-tight text-mist-50"
            style={{
              fontSize: "clamp(2rem, 4.5vw, 3.2rem)",
              lineHeight: 1.02,
              letterSpacing: "-0.02em",
            }}
          >
            Voilà ce que tu vois.
          </h2>
          <p className="mt-6 text-[14.5px] text-mist-300 max-w-xl mx-auto leading-relaxed">
            Pas une liste de CV. Un classement réel, par métier, par ville.
            Les Top 5 d&apos;abord — les autres en un scroll.
          </p>
        </div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
          className="mt-12 mx-auto max-w-3xl card-white overflow-hidden"
        >
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[60px_1fr_140px_100px_80px] gap-4 px-5 py-3 bg-ink-850 border-b border-ink-700/10 text-[10.5px] font-bold uppercase tracking-[0.14em] text-mist-400">
            <span>Rang</span>
            <span>Talent</span>
            <span>Compétence top</span>
            <span>Dispo</span>
            <span className="text-right">Score</span>
          </div>

          <ul className="divide-y divide-ink-700/8">
            {MOCK_ROWS.map((row, i) => (
              <RankRow key={row.rank} row={row} delay={i * 0.06} />
            ))}
          </ul>

          {/* Footer hint */}
          <div className="px-5 py-3 border-t border-ink-700/10 bg-ink-850 text-center">
            <p className="text-[11.5px] text-mist-400">
              + 47 autres talents classés en Animation 3D à Paris
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function RankRow({ row, delay }: { row: RankRow; delay: number }) {
  const tier = TIERS[row.tier];
  const avail = AVAILABILITY_LABEL[row.availability];
  const isPodium = row.rank <= 3;
  return (
    <motion.li
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay, ease: [0.2, 0.7, 0.2, 1] }}
      className="group grid grid-cols-[60px_1fr] sm:grid-cols-[60px_1fr_140px_100px_80px] gap-4 items-center px-5 py-3.5 hover:bg-night-50 transition cursor-pointer"
    >
      {/* Rank */}
      <span
        className={`font-display font-black tabular-nums leading-none ${isPodium ? "text-[22px]" : "text-[17px] text-mist-400"}`}
        style={isPodium ? { color: tier.color } : undefined}
      >
        #{row.rank}
      </span>

      {/* Talent name + city */}
      <div className="min-w-0 flex items-center gap-3">
        <span className="relative shrink-0">
          <span
            className="inline-grid h-10 w-10 place-items-center rounded-full font-display text-[12px] font-black text-white"
            style={{
              background: "linear-gradient(160deg, #4D7EA8, #1F3A57)",
              boxShadow: "inset 0 2px 0 rgba(255,255,255,0.3)",
            }}
          >
            {row.initials}
          </span>
          {isPodium && (
            <span
              aria-hidden
              className="absolute -bottom-1 -right-1 inline-flex items-center justify-center rounded-full bg-white ring-1 ring-ink-700/10"
              style={{ width: 18, height: 18, boxShadow: "0 2px 6px -2px rgba(0,0,0,0.25)" }}
            >
              <LeagueMascot tier={row.tier} size={14} />
            </span>
          )}
        </span>
        <div className="min-w-0">
          <p className="font-display text-[14px] font-black text-mist-50 leading-tight truncate">
            {row.name}
          </p>
          <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-mist-400">
            <MapPin className="h-2.5 w-2.5" strokeWidth={2.6} />
            {row.city} · {row.yearsExp} ans d&apos;exp
          </p>
        </div>
      </div>

      {/* Top skill */}
      <p className="hidden sm:block text-[12px] text-mist-200 truncate">{row.topSkill}</p>

      {/* Availability */}
      <span
        className="hidden sm:inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.10em] w-fit"
        style={{
          background: `${avail.color}1A`,
          color: avail.color,
          boxShadow: `inset 0 0 0 1px ${avail.color}33`,
        }}
      >
        <span className="h-1 w-1 rounded-full" style={{ background: avail.color }} />
        {avail.label}
      </span>

      {/* Score */}
      <p
        className="hidden sm:block font-display text-[20px] font-black text-right tabular-nums leading-none"
        style={{ color: tier.color }}
      >
        {row.score}
      </p>
    </motion.li>
  );
}
