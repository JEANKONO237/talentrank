"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import { LeagueMascot } from "@/components/ui/LeagueMascot";
import { PortfolioCover, type PortfolioCoverKind } from "./PortfolioCovers";
import { TIERS, type TierId } from "@/lib/tiers";

// ─────────────────────────────────────────────────────────────────────────────
// TalentShowcase — remplace l'ancien ScorePreview démo.
//
// Directive de l'audit (art-director Nadia) : "Tu vends une marketplace de
// créatifs mais ne montres aucun travail créatif." Cette section corrige ça
// en exposant 3 talents mockés AVEC leur portfolio (en attendant les vrais).
//
// Format card : portfolio cover en haut (gros visuel coloré) + footer
// identité (avatar + nom + métier + tier pill + score) + CTA "Voir profil".
// L'utilisateur comprend en 3s : "ah voilà à quoi ressemble un profil ici".
//
// Mock visuels : pas d'image fichier, on génère des "cover art" via gradients
// + emoji XL + halo. Quand on aura de vrais portfolios (Supabase storage),
// on swap le PortfolioCover par <Image src={talent.cover} />.
// ─────────────────────────────────────────────────────────────────────────────

interface ShowcaseTalent {
  /** Slug profil pour le bouton. */
  slug: string;
  /** Nom affiché. */
  name: string;
  /** Initiales 2 lettres pour l'avatar. */
  initials: string;
  /** Métier (label FR). */
  profession: string;
  /** Ville · pays. */
  location: string;
  /** Tier dans son métier. */
  tier: TierId;
  /** Score QCM 0-100. */
  score: number;
  /** Position dans son classement métier. */
  rank: number;
  /** Cover : SVG illustration abstraite (placeholder pour vrais portfolios). */
  cover: {
    kind: PortfolioCoverKind;
    accent: string;
    label: string; // courte étiquette de "ce que c'est"
  };
  /** Phrase de signature courte (≤ 60 chars). */
  tagline: string;
}

const TALENTS: ShowcaseTalent[] = [
  {
    slug: "aya-tanaka",
    name: "Aya Tanaka",
    initials: "AT",
    profession: "Character Animator",
    location: "Tokyo · Japon",
    tier: "elite",
    score: 94,
    rank: 1,
    cover: { kind: "animator-3d", accent: "#22D3EE", label: "Showreel · 14 plans" },
    tagline: "Anime des dragons depuis 12 ans.",
  },
  {
    slug: "marco-vidal",
    name: "Marco Vidal",
    initials: "MV",
    profession: "Frontend Engineer",
    location: "Lisbonne · Portugal",
    tier: "senior",
    score: 88,
    rank: 4,
    cover: { kind: "frontend-dev", accent: "#1CB0F6", label: "GitHub · 2k★" },
    tagline: "Ship 90% en TS strict + framer.",
  },
  {
    slug: "leila-bouzid",
    name: "Leïla Bouzid",
    initials: "LB",
    profession: "Boulangère",
    location: "Marseille · France",
    tier: "senior",
    score: 85,
    rank: 2,
    cover: { kind: "baker", accent: "#F59E0B", label: "MOF candidate 2026" },
    tagline: "Levain naturel, 18h d'autolyse.",
  },
];

export function TalentShowcase() {
  return (
    <section
      className="relative py-20 sm:py-24"
      aria-labelledby="talent-showcase-heading"
    >
      <div className="container-page">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <h2
            id="talent-showcase-heading"
            className="font-display font-black tracking-tight text-mist-50"
            style={{
              fontSize: "clamp(2rem, 4.5vw, 3.2rem)",
              lineHeight: 1.02,
              letterSpacing: "-0.02em",
            }}
          >
            Voilà ce que produisent{" "}
            <span className="relative inline-block">
              les meilleurs.
              <span
                aria-hidden
                className="absolute left-0 right-0 -bottom-1 sm:-bottom-1.5 h-[5px] sm:h-[6px] rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(255,200,0,0.30) 0%, rgba(255,200,0,0.60) 50%, rgba(255,200,0,0.30) 100%)",
                }}
              />
            </span>
          </h2>
          <p className="mt-6 text-[15px] text-mist-300 max-w-xl mx-auto leading-relaxed">
            Trois talents, trois métiers, un classement par métier. Tu peux être Or
            en pâtisserie et débuter en animation 3D — c&apos;est attendu.
          </p>
        </div>

        {/* Cards grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 max-w-5xl mx-auto">
          {TALENTS.map((talent, i) => (
            <TalentCard key={talent.slug} talent={talent} delay={0.1 + i * 0.08} />
          ))}
        </div>

        {/* Footer note */}
        <p className="mt-10 text-center text-[12px] text-mist-400 max-w-md mx-auto">
          <Sparkles className="inline-block h-3 w-3 mr-1 -mt-0.5 text-amber-600" strokeWidth={2.6} />
          Profils démo · les vrais talents apparaissent dès le lancement de la beta.
        </p>
      </div>
    </section>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────

function TalentCard({ talent, delay }: { talent: ShowcaseTalent; delay: number }) {
  const tier = TIERS[talent.tier];
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease: [0.2, 0.7, 0.2, 1] }}
      className="card-white overflow-hidden group transition-transform hover:-translate-y-1"
    >
      {/* Cover : illustration SVG abstraite (placeholder pour vrai portfolio).
          Audit Nadia G1-Nadia-3 : remplace l'emoji XL plat par un visuel riche
          évocateur — scène 3D, IDE, four à pain — qui ressemble plus à un
          aperçu de showreel/projet. Quand Supabase storage sera branché,
          remplacer par <Image src={talent.coverUrl} /> du vrai portfolio. */}
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <PortfolioCover
          kind={talent.cover.kind}
          className="absolute inset-0 h-full w-full"
        />
        {/* Halo accent au hover */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full opacity-0 group-hover:opacity-30 blur-3xl transition-opacity duration-300"
          style={{ background: talent.cover.accent }}
        />

        {/* Cover bottom-left label */}
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/30 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white ring-1 ring-inset ring-white/20">
          {talent.cover.label}
        </span>

        {/* Rank badge top-right */}
        <span
          className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-black tabular-nums text-white ring-1 ring-inset ring-white/30"
          style={{
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          }}
        >
          #{talent.rank}
          <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/75">
            · {talent.profession.split(" ")[0]}
          </span>
        </span>
      </div>

      {/* Identity footer */}
      <div className="p-5">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <span
            className="relative inline-grid h-12 w-12 place-items-center rounded-full font-display text-[13px] font-black text-white shrink-0"
            style={{
              background: "linear-gradient(160deg, #4D7EA8, #1F3A57)",
              boxShadow:
                "inset 0 2px 0 rgba(255,255,255,0.3), 0 6px 14px -4px rgba(0,0,0,0.25)",
            }}
          >
            {talent.initials}
            {/* Tier mascot mini-peek */}
            <span
              aria-hidden
              className="absolute -bottom-1.5 -right-1.5 inline-flex items-center justify-center rounded-full bg-white ring-1 ring-ink-700/10"
              style={{
                width: 22,
                height: 22,
                boxShadow: "0 4px 10px -3px rgba(0,0,0,0.25)",
              }}
            >
              <LeagueMascot tier={talent.tier} size={18} />
            </span>
          </span>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <p className="font-display text-[15px] font-black text-mist-50 leading-tight truncate">
              {talent.name}
            </p>
            <p className="mt-0.5 text-[12px] text-mist-300 leading-tight truncate">
              {talent.profession}
            </p>
            <p className="mt-1 inline-flex items-center gap-1 text-[10.5px] text-mist-400">
              <MapPin className="h-2.5 w-2.5" strokeWidth={2.6} />
              {talent.location}
            </p>
          </div>

          {/* Score */}
          <div className="text-right shrink-0">
            <p
              className="font-display text-[24px] font-black leading-none tabular-nums"
              style={{ color: tier.color }}
            >
              {talent.score}
            </p>
            <p
              className="mt-0.5 text-[9.5px] font-bold uppercase tracking-[0.14em]"
              style={{ color: tier.color }}
            >
              {tier.label}
            </p>
          </div>
        </div>

        {/* Tagline */}
        <p className="mt-4 text-[12.5px] text-mist-200 italic leading-snug">
          « {talent.tagline} »
        </p>

        {/* CTA */}
        <Link
          href={`/talent/${talent.slug}`}
          className="mt-4 inline-flex w-full h-10 items-center justify-center gap-1.5 rounded-full bg-night-700 hover:bg-night-600 px-4 text-[12px] font-bold uppercase tracking-[0.06em] text-white transition group/cta"
        >
          Voir le profil
          <ArrowRight
            className="h-3.5 w-3.5 transition-transform group-hover/cta:translate-x-0.5"
            strokeWidth={2.6}
          />
        </Link>
      </div>
    </motion.article>
  );
}
