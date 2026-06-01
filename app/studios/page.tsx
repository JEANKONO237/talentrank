import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  Briefcase,
  Crown,
  Layers,
  Mail,
  MapPin,
  Sparkles,
} from "lucide-react";
import { AvatarChip } from "@/components/ui/AvatarChip";
import { findCountry } from "@/lib/countries";
import { getTopByProfession, getTalentProfession, TALENTS } from "@/lib/mock-talents";
import { professionStats } from "@/lib/profession-stats";
import { professionLabel } from "@/lib/professions";
import { tierForPercentile } from "@/lib/tiers";

export const metadata: Metadata = {
  title: "Entreprises — TalentRank",
  description:
    "Choisis un métier. Les meilleurs profils classés apparaissent. Envoie un entretien privé. Pas d'annonce, pas de bruit.",
};

// ──────────────────────────────────────────────────────────────────────────
// Page Entreprises — point d'entrée recruteur.
// 4 sections, jamais plus :
//   1. Hero — promesse claire + 2 actions.
//   2. Comment ça marche — 3 cartes, 1 phrase chacune.
//   3. Live market — les #1 de chaque métier, vivants, drapeaux + scores.
//   4. Shortlist — visualisation d'une équipe en cours de constitution.
// ──────────────────────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  {
    n: "01",
    title: "Choisis un métier.",
    body: "Pas un mot-clé. Un métier précis : Animateur 3D, Développeur Frontend, Boulanger…",
    color: "#1CB0F6",
  },
  {
    n: "02",
    title: "Le classement filtre.",
    body: "Les meilleurs profils du métier apparaissent. Score, ligue, disponibilité — instantané.",
    color: "#58CC02",
  },
  {
    n: "03",
    title: "Entretien privé.",
    body: "Un clic. Pas d'annonce, pas de candidatures, pas de CV à lire. Direct.",
    color: "#FFC800",
  },
];

// Live market : on prend les top professions actives + leur #1.
const LIVE_MARKET = professionStats()
  .filter((s) => s.talentCount > 0)
  .slice(0, 6)
  .flatMap((s) => {
    const top = getTopByProfession(s.profession.id, 1)[0];
    return top ? [{ profession: s.profession, talent: top }] : [];
  });

// Shortlist demo : une équipe créative en cours de constitution.
// On pioche dans les mocks par professionId pour avoir un casting cohérent.
const SHORTLIST_DEMO = (() => {
  const picks = [
    { professionId: "animation-3d", role: "Animation" },
    { professionId: "storyboard-artist", role: "Storyboard" },
    { professionId: "vfx-artist", role: "VFX" },
    { professionId: "environment-artist", role: "Environment" },
  ];
  return picks
    .map(({ professionId, role }) => {
      const top = getTopByProfession(professionId, 1)[0];
      return top ? { talent: top, role } : null;
    })
    .filter(<T,>(x: T | null): x is T => x !== null);
})();

export default function StudiosPage() {
  return (
    <div className="bg-white">
      {/* ───────────────────── Section 1 — Hero ───────────────────── */}
      <section className="container-page pt-28 sm:pt-32 pb-16 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-mist-400">
          Pour les entreprises
        </p>
        <h1
          className="mx-auto mt-5 max-w-4xl font-display font-black tracking-tight text-mist-50"
          style={{ fontSize: "clamp(2.6rem, 6.5vw, 5.2rem)", lineHeight: 0.96 }}
        >
          Trouve les meilleurs talents{" "}
          <span
            style={{
              background: "linear-gradient(180deg, #1CB0F6 0%, #0E84BB 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            classés.
          </span>
        </h1>
        <p className="mx-auto mt-7 max-w-2xl text-[16px] sm:text-[17px] leading-relaxed text-mist-300">
          Choisis un métier. Les meilleurs profils apparaissent immédiatement.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/chasse"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-b from-duo-blue to-[#1A9DDB] text-white font-bold uppercase tracking-[0.04em] text-[13px] px-6 border-b-[3px] border-duo-blue-deep transition-all hover:brightness-105 active:translate-y-[2px] active:border-b-[1px]"
          >
            Commencer une chasse
            <ArrowRight className="h-4 w-4" strokeWidth={2.8} />
          </Link>
          <Link
            href="/metiers"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-white ring-2 ring-ink-700/20 text-mist-50 font-bold uppercase tracking-[0.04em] text-[13px] px-6 hover:ring-ink-700/40 hover:bg-ink-50/40 transition"
          >
            Voir les métiers
          </Link>
        </div>
      </section>

      {/* ───────────────────── Section 2 — Comment ça marche ───────────────────── */}
      <section className="container-page py-16 sm:py-20">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-mist-400">
            Comment ça marche
          </p>
          <h2 className="mt-3 font-display text-[28px] sm:text-[34px] font-black tracking-tight text-mist-50">
            Trois étapes. Pas une de plus.
          </h2>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {HOW_IT_WORKS.map((step) => (
            <div
              key={step.n}
              className="card-squash relative overflow-hidden rounded-3xl bg-white ring-1 ring-ink-700/15 p-7 shadow-card"
              style={{ borderBottom: `4px solid ${step.color}40` }}
            >
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-30 blur-3xl"
                style={{ background: step.color }}
              />
              <span
                className="relative font-display text-[42px] font-black leading-none tabular-nums"
                style={{ color: step.color }}
              >
                {step.n}
              </span>
              <h3 className="relative mt-5 font-display text-[20px] font-black leading-tight tracking-tight text-mist-50">
                {step.title}
              </h3>
              <p className="relative mt-2.5 text-[13.5px] leading-relaxed text-mist-300">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────────── Section 3 — Live market ───────────────────── */}
      <section className="container-page py-16 sm:py-20">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 max-w-5xl mx-auto">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 ring-1 ring-inset ring-emerald-400/30 px-2.5 py-1">
              <span className="grid h-2 w-2 place-items-center">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              </span>
              <span className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                Live · marché mondial
              </span>
            </div>
            <h2 className="mt-3 font-display text-[28px] sm:text-[34px] font-black tracking-tight text-mist-50">
              Les #1 du moment.
            </h2>
            <p className="mt-2 text-[13.5px] text-mist-400 max-w-md">
              Chaque carte est le numéro un de SON métier. Pas un mélange.
            </p>
          </div>
          <Link
            href="/ranking"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-bold uppercase tracking-[0.14em] text-cyan-600 hover:text-cyan-500 transition"
          >
            Tous les classements
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.8} />
          </Link>
        </div>

        <div className="mt-8 max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {LIVE_MARKET.map(({ profession, talent }) => {
            const country = findCountry(talent.countryCode);
            const tier = tierForPercentile(talent.percentile);
            return (
              <Link
                key={profession.id}
                href={`/ranking/${profession.id}`}
                className="card-squash group relative overflow-hidden rounded-2xl bg-white ring-1 ring-ink-700/15 p-4 shadow-card hover:shadow-card-hover"
              >
                {/* League dot accent */}
                <span
                  className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full opacity-25 blur-2xl"
                  style={{ background: tier.color }}
                />
                <div className="relative flex items-center gap-3">
                  <AvatarChip
                    initials={talent.initials}
                    gradient={`bg-gradient-to-br ${talent.avatarGradient}`}
                    countryCode={country.code}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-600">
                      <Crown className="h-3 w-3" strokeWidth={2.8} />
                      #1 · {professionLabel(profession, "fr")}
                    </p>
                    <p className="mt-1 truncate font-display text-[15px] font-bold leading-tight text-mist-50">
                      {talent.name}
                    </p>
                    <p className="mt-0.5 truncate text-[11.5px] text-mist-400">
                      <MapPin className="inline-block h-3 w-3 -mt-0.5 mr-0.5" strokeWidth={2.4} />
                      {talent.city ?? country.name}
                    </p>
                  </div>
                  <ScoreOrb tier={tier} score={talent.score} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ───────────────────── Section 4 — Shortlist ───────────────────── */}
      <section className="container-page py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 max-w-5xl mx-auto">
          <div className="lg:col-span-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 ring-1 ring-inset ring-amber-400/30 px-2.5 py-1">
              <Bookmark className="h-3 w-3 text-amber-700" strokeWidth={2.6} />
              <span className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-amber-700">
                Shortlist
              </span>
            </div>
            <h2 className="mt-3 font-display text-[26px] sm:text-[32px] font-black tracking-tight text-mist-50 leading-tight">
              Construis ton équipe,{" "}
              <span
                style={{
                  background: "linear-gradient(180deg, #FFC800 0%, #C99A00 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                profil par profil.
              </span>
            </h2>
            <p className="mt-4 text-[14px] leading-relaxed text-mist-300">
              Sauvegarde les talents qui t&apos;intéressent dans une shortlist privée par projet.
              Partage avec ton équipe. Lance les entretiens quand tu es prêt.
            </p>
            <Link
              href="/dashboard/recruiter"
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-mist-50 hover:bg-ink-900 text-white font-bold uppercase tracking-[0.04em] text-[12.5px] px-5 transition"
            >
              Ouvrir le tableau de bord
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.8} />
            </Link>
          </div>

          <div className="lg:col-span-3">
            <div className="rounded-3xl bg-white ring-1 ring-ink-700/15 p-5 shadow-card">
              {/* Project header */}
              <div className="flex items-center justify-between gap-3 pb-4 border-b border-ink-700/10">
                <div className="flex items-center gap-2.5">
                  <span
                    className="grid h-9 w-9 place-items-center rounded-xl text-white"
                    style={{
                      background: "linear-gradient(160deg, #8B5CF6, #5B21B6)",
                    }}
                  >
                    <Briefcase className="h-4 w-4" strokeWidth={2.6} />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-mist-400">
                      Projet
                    </p>
                    <p className="font-display text-[14.5px] font-bold text-mist-50">
                      Film cinématique UE5
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 ring-1 ring-inset ring-emerald-400/30 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.12em] text-emerald-700">
                  <Layers className="h-3 w-3" strokeWidth={2.6} />
                  {SHORTLIST_DEMO.length} talents
                </span>
              </div>

              {/* Member rows */}
              <ul className="mt-3 space-y-1.5">
                {SHORTLIST_DEMO.map(({ talent, role }) => {
                  const country = findCountry(talent.countryCode);
                  const tier = tierForPercentile(talent.percentile);
                  const profession = getTalentProfession(talent);
                  return (
                    <li
                      key={talent.id}
                      className="flex items-center gap-3 rounded-2xl bg-ink-50/50 hover:bg-ink-50 ring-1 ring-inset ring-ink-700/10 px-3 py-2.5 transition"
                    >
                      <AvatarChip
                        initials={talent.initials}
                        gradient={`bg-gradient-to-br ${talent.avatarGradient}`}
                        countryCode={country.code}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-[13.5px] font-bold text-mist-50">
                          {talent.name}
                        </p>
                        <p className="truncate text-[11.5px] text-mist-400">
                          {professionLabel(profession, "fr")} ·{" "}
                          <span className="font-bold" style={{ color: tier.color }}>
                            {role}
                          </span>
                        </p>
                      </div>
                      <span
                        className="inline-grid h-8 w-8 place-items-center rounded-full font-display text-[11.5px] font-black"
                        style={{
                          background: `linear-gradient(180deg, ${tier.highlight}, ${tier.color})`,
                          boxShadow: `0 2px 0 0 ${tier.color}aa, inset 0 1px 0 rgba(255,255,255,0.5)`,
                          color:
                            tier.id === "rising" || tier.id === "emerging" || tier.id === "new"
                              ? "#1B1208"
                              : "#FFFFFF",
                        }}
                      >
                        {talent.score}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {/* Footer CTA */}
              <div className="mt-4 flex items-center justify-between gap-2 pt-4 border-t border-ink-700/10">
                <p className="text-[11px] text-mist-400">
                  Composition en cours · ajouter Lighting Artist ?
                </p>
                <button className="inline-flex items-center gap-1 rounded-full bg-cyan-400/15 ring-1 ring-inset ring-cyan-400/30 px-2.5 py-1 text-[11px] font-bold text-cyan-700 hover:bg-cyan-400/25 transition">
                  <Mail className="h-3 w-3" strokeWidth={2.6} />
                  Lancer les entretiens
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────── Closing CTA ───────────────────── */}
      <section className="container-page pb-24">
        <div className="max-w-3xl mx-auto rounded-[32px] bg-mist-50 text-white p-10 sm:p-14 text-center relative overflow-hidden">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-amber-500/20 blur-3xl" />
          <div className="relative">
            <Sparkles className="mx-auto h-6 w-6 text-cyan-300" strokeWidth={2.6} />
            <h2 className="mt-4 font-display text-[26px] sm:text-[34px] font-black tracking-tight leading-tight">
              Le classement vivant des talents.
              <br />
              <span className="text-mist-400">Métier par métier.</span>
            </h2>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/chasse"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-b from-duo-blue to-[#1A9DDB] font-bold uppercase tracking-[0.04em] text-[13px] px-6 border-b-[3px] border-duo-blue-deep transition-all hover:brightness-105 active:translate-y-[2px] active:border-b-[1px]"
              >
                Commencer une chasse
                <ArrowRight className="h-4 w-4" strokeWidth={2.8} />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-white/10 ring-1 ring-inset ring-white/20 hover:bg-white/15 font-bold uppercase tracking-[0.04em] text-[13px] px-6 transition"
              >
                Voir les tarifs
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Small score orb used in Live Market ─────────────────────────────────
function ScoreOrb({
  tier,
  score,
}: {
  tier: ReturnType<typeof tierForPercentile>;
  score: number;
}) {
  const lightTier = tier.id === "rising" || tier.id === "emerging" || tier.id === "new";
  return (
    <span
      className="inline-grid h-12 w-12 place-items-center rounded-full font-display text-[14px] font-black shrink-0"
      style={{
        background: `radial-gradient(circle at 30% 25%, ${tier.highlight}, ${tier.color} 60%, ${tier.color}cc 100%)`,
        boxShadow: `0 6px 16px -4px ${tier.color}aa, inset 0 2px 0 rgba(255,255,255,0.55), inset 0 -10px 18px -8px rgba(0,0,0,0.4)`,
        color: lightTier ? "#1B1208" : "#FFFFFF",
      }}
    >
      {score}
    </span>
  );
}
