"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  Code2,
  Crosshair,
  Flame,
  Heart,
  Lock,
  MessageSquare,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { LeagueMascot } from "@/components/ui/LeagueMascot";
import { ShareScoreCard } from "@/components/share/ShareScoreCard";
import { TIER_ORDER, tierForPercentile } from "@/lib/tiers";
import { findCountry } from "@/lib/countries";
import { getTalentProfession, type Talent } from "@/lib/mock-talents";
import { professionLabel } from "@/lib/professions";

interface Props {
  talent: Talent;
}

// ─────────────────────────────────────────────────────────────────────────────
// Talent dashboard — Duolingo-feel.
//
// Trois choses, jamais plus, dans la colonne centrale :
//   1. Hero personnalisé (bannière colorée + mascotte + salutation)
//   2. Ta ligue + progression vers la suivante (la vraie boucle de jeu)
//   3. Trois cartes "prochaine action" — chacune un seul clic
//
// Le rail droit (visible sur xl+) porte tes stats live + une carte "débloque
// la suivante" + un mini quest tracker. Calqué sur Duolingo /learn.
// ─────────────────────────────────────────────────────────────────────────────

export function TalentDashboardClient({ talent }: Props) {
  const tier = tierForPercentile(talent.percentile);
  const country = findCountry(talent.countryCode);
  const profession = getTalentProfession(talent);

  // Next league = current tier minus one in TIER_ORDER (lower index = higher).
  const idxInOrder = TIER_ORDER.findIndex((t) => t.id === tier.id);
  const nextTier = idxInOrder > 0 ? TIER_ORDER[idxInOrder - 1] : null;

  // Synthetic streak / quest data. Wire to real source later.
  const streak = 4;
  const hearts = 5;
  const xp = 480;
  const xpDailyTarget = 50;
  const xpDailyDone = 32;
  const dailyPct = Math.round((xpDailyDone / xpDailyTarget) * 100);

  return (
    <AppShell rightRail={<RightRail tier={tier} streak={streak} hearts={hearts} xp={xp} xpDailyDone={xpDailyDone} xpDailyTarget={xpDailyTarget} dailyPct={dailyPct} />}>
      {/* ─── 1. Hero personnalisé ─────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl text-white"
        style={{
          background: `linear-gradient(135deg, ${tier.color}, ${tier.color}cc)`,
          boxShadow: `0 24px 60px -20px ${tier.color}55, inset 0 1px 0 rgba(255,255,255,0.25)`,
        }}
      >
        <div className="relative flex items-center gap-5 p-6 sm:p-7">
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-white/85">
              Bienvenue
            </p>
            <h1 className="mt-1.5 font-display text-[26px] sm:text-[32px] font-black leading-tight tracking-tight">
              Salut {talent.name.split(" ")[0]} 👋
            </h1>
            <p className="mt-2 text-[13.5px] text-white/90 max-w-md">
              Tu es <span className="font-bold">{tier.label}</span> en{" "}
              <span className="font-bold">{professionLabel(profession, "fr")}</span>.
              Continue à monter.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Link
                href="/qcm"
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white text-mist-50 px-5 text-[12.5px] font-bold uppercase tracking-[0.04em] transition hover:bg-ink-50"
              >
                Faire une évaluation
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.8} />
              </Link>
              {/* Share/flex CTA — visible dès qu'on a un score (>0). Le talent
                  qui partage = acquisition virale. Variante ghost pour rester
                  secondaire au CTA "Évaluation". */}
              <ShareScoreCard
                variant="ghost"
                name={talent.name}
                score={talent.score}
                percentile={talent.percentile}
                professionId={profession.id}
                professionLabel={professionLabel(profession, "fr")}
                city={talent.city}
                slug={talent.slug}
              />
            </div>
          </div>
          <div className="hidden sm:block shrink-0">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <LeagueMascot tier={tier.id} size={120} className="drop-shadow-[0_8px_20px_rgba(0,0,0,0.25)]" />
            </motion.div>
          </div>
        </div>
        {/* Decorative sparkles */}
        <span aria-hidden className="pointer-events-none absolute top-3 right-6 text-white/40">
          <Sparkles className="h-4 w-4" />
        </span>
        <span aria-hidden className="pointer-events-none absolute bottom-3 left-6 text-white/30">
          <Sparkles className="h-3 w-3" />
        </span>
      </motion.section>

      {/* ─── 2. Ligue + progression ──────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.06 }}
        className="mt-6 rounded-3xl bg-white ring-1 ring-ink-700/10 shadow-card p-6"
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-mist-400">
            Ta ligue
          </p>
          <Link href="/ranking" className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-cyan-600 hover:text-cyan-500 transition">
            Voir le classement →
          </Link>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div
            className="relative grid h-20 w-20 place-items-center rounded-full shrink-0"
            style={{
              background: `radial-gradient(circle at 30% 25%, ${tier.highlight}, ${tier.color} 60%, ${tier.color}cc 100%)`,
              boxShadow: `0 12px 28px -8px ${tier.color}aa, inset 0 2px 0 rgba(255,255,255,0.55), inset 0 -10px 18px -8px rgba(0,0,0,0.35)`,
            }}
          >
            <LeagueMascot tier={tier.id} size={56} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[20px] font-black tracking-tight text-mist-50">
              {tier.label}
            </p>
            <p className="text-[12.5px] text-mist-400">
              {tier.range} · <span style={{ color: tier.color, fontWeight: 700 }}>{tier.motto}</span>
            </p>

            {nextTier && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-[10.5px] font-bold uppercase tracking-[0.14em] text-mist-400">
                  <span>Prochaine ligue · {nextTier.label}</span>
                  <span style={{ color: nextTier.color }}>{tierProgress(talent.percentile, tier, nextTier)}%</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink-50">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${tierProgress(talent.percentile, tier, nextTier)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${tier.color}, ${nextTier.color})`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.section>

      {/* ─── 3. Trois prochaines actions ─────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12 }}
        className="mt-6"
      >
        <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-mist-400 mb-4 px-1">
          Ta prochaine étape
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ActionCard
            href="/qcm"
            Icon={Brain}
            color="#1CB0F6"
            title="Passe le QCM"
            sub="Score officiel + ligue mise à jour"
          />
          <ActionCard
            href={`/talent/${talent.slug}`}
            Icon={MessageSquare}
            color="#58CC02"
            title="Complète ton profil"
            sub="Plus tu détailles, plus tu montes"
          />
          <ActionCard
            href={`/ranking/${profession.id}`}
            Icon={Trophy}
            color="#FFC800"
            title="Vois ton classement"
            sub={`Top ${professionLabel(profession, "fr")}`}
          />
        </div>
      </motion.section>

      {/* ─── Embed widget hint — viral hook M-1 ──────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.18 }}
        className="mt-6"
      >
        <Link
          href="/embed"
          className="group block relative overflow-hidden rounded-2xl bg-white ring-1 ring-ink-700/10 hover:ring-amber-300/40 shadow-card hover:shadow-card-hover p-5 transition-all hover:-translate-y-0.5"
        >
          {/* Halo discret amber */}
          <span
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-300/30 blur-3xl"
          />
          <div className="relative flex items-center gap-4">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-100 ring-1 ring-inset ring-amber-300/40 shrink-0">
              <Code2 className="h-5 w-5 text-amber-700" strokeWidth={2.4} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-amber-800">
                Nouveau · Embed
              </p>
              <p className="mt-0.5 font-display text-[15px] font-black tracking-tight text-mist-50">
                Mets ton score dans ta signature email
              </p>
              <p className="mt-0.5 text-[12px] text-mist-300">
                Snippet à coller dans Gmail, GitHub README, Notion, portfolio.
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-mist-400 group-hover:text-amber-800 group-hover:translate-x-0.5 transition shrink-0" strokeWidth={2.6} />
          </div>
        </Link>
      </motion.section>

      {/* Country / availability footer — discreet, just for context */}
      <div className="mt-10 flex items-center justify-center gap-2 text-[12px] text-mist-400">
        <FlagPng code={country.code} />
        <span>Tu apparais à {talent.city ?? country.name} · {profession.frLabel}</span>
      </div>
    </AppShell>
  );
}

// ─── Right rail ─────────────────────────────────────────────────────────────

function RightRail({
  tier,
  streak,
  hearts,
  xp,
  xpDailyDone,
  xpDailyTarget,
  dailyPct,
}: {
  tier: ReturnType<typeof tierForPercentile>;
  streak: number;
  hearts: number;
  xp: number;
  xpDailyDone: number;
  xpDailyTarget: number;
  dailyPct: number;
}) {
  const idx = TIER_ORDER.findIndex((t) => t.id === tier.id);
  const nextTier = idx > 0 ? TIER_ORDER[idx - 1] : null;

  return (
    <>
      {/* Stats strip — flag + streak + xp + hearts */}
      <div className="flex items-center justify-between gap-2 rounded-2xl bg-white ring-1 ring-ink-700/10 shadow-card px-4 py-3">
        <Stat icon={<Flame className="h-3.5 w-3.5 text-orange-500" strokeWidth={2.8} />} value={streak} />
        <Stat icon={<Sparkles className="h-3.5 w-3.5 text-cyan-500" strokeWidth={2.8} />} value={xp} />
        <Stat icon={<Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" strokeWidth={2.8} />} value={hearts} />
      </div>

      {/* Daily quest */}
      <div className="rounded-2xl bg-white ring-1 ring-ink-700/10 shadow-card p-5">
        <div className="flex items-center justify-between">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400">
            Quête du jour
          </p>
          <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-cyan-600">
            +XP
          </span>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-100">
            <Sparkles className="h-5 w-5 text-amber-600" strokeWidth={2.6} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-display text-[14px] font-bold text-mist-50">
              Gagne {xpDailyTarget} XP
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex-1 h-2 overflow-hidden rounded-full bg-ink-50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
                  style={{ width: `${dailyPct}%` }}
                />
              </div>
              <span className="text-[10.5px] font-mono tabular-nums text-mist-400">
                {xpDailyDone}/{xpDailyTarget}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Unlock next league */}
      {nextTier && (
        <div className="rounded-2xl bg-white ring-1 ring-ink-700/10 shadow-card p-5">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400">
            Débloque {nextTier.label}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <span
              className="grid h-12 w-12 place-items-center rounded-2xl shrink-0 relative"
              style={{
                background: `${nextTier.color}1f`,
                boxShadow: `inset 0 0 0 2px ${nextTier.color}40`,
              }}
            >
              <LeagueMascot tier={nextTier.id} size={32} />
              <span
                aria-hidden
                className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-mist-50 text-white ring-2 ring-white"
              >
                <Lock className="h-2.5 w-2.5" strokeWidth={3} />
              </span>
            </span>
            <p className="flex-1 text-[12.5px] text-mist-300 leading-snug">
              Termine 5 actions pour rejoindre la ligue{" "}
              <span className="font-bold" style={{ color: nextTier.color }}>
                {nextTier.label}
              </span>
              .
            </p>
          </div>
          <Link
            href="/qcm"
            className="mt-4 inline-flex h-9 w-full items-center justify-center gap-1 rounded-full text-white font-bold uppercase tracking-[0.04em] text-[11.5px] transition"
            style={{
              background: `linear-gradient(180deg, ${nextTier.color}, ${nextTier.color}cc)`,
              boxShadow: `0 4px 0 0 ${nextTier.color}66, inset 0 1px 0 rgba(255,255,255,0.4)`,
            }}
          >
            <Crosshair className="h-3.5 w-3.5" strokeWidth={2.8} />
            Commencer
          </Link>
        </div>
      )}

      {/* Recruiter activity strip */}
      <div className="rounded-2xl bg-white ring-1 ring-ink-700/10 shadow-card p-5">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400">
          Activité
        </p>
        <ul className="mt-3 space-y-2.5 text-[12.5px]">
          <ActivityRow icon={<Users className="h-3.5 w-3.5 text-violet-500" strokeWidth={2.6} />}>
            <span className="font-bold text-mist-50">3 studios</span> ont vu ton profil cette semaine
          </ActivityRow>
          <ActivityRow icon={<MessageSquare className="h-3.5 w-3.5 text-cyan-500" strokeWidth={2.6} />}>
            <span className="font-bold text-mist-50">1 entretien</span> en attente
          </ActivityRow>
          <ActivityRow icon={<Trophy className="h-3.5 w-3.5 text-amber-500" strokeWidth={2.6} />}>
            Tu as gagné <span className="font-bold text-mist-50">+12 places</span> ce mois
          </ActivityRow>
        </ul>
      </div>
    </>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function ActionCard({
  href,
  Icon,
  color,
  title,
  sub,
}: {
  href: string;
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number; style?: React.CSSProperties }>;
  color: string;
  title: string;
  sub: string;
}) {
  return (
    <Link
      href={href}
      className="card-squash group block rounded-2xl bg-white ring-1 ring-ink-700/10 hover:ring-ink-700/25 shadow-card hover:shadow-card-hover p-5 transition-all"
      style={{ borderBottom: `4px solid ${color}40` }}
    >
      <span
        className="inline-grid h-11 w-11 place-items-center rounded-2xl mb-4"
        style={{
          background: `${color}1a`,
          boxShadow: `inset 0 0 0 1.5px ${color}40`,
        }}
      >
        <Icon className="h-5 w-5" strokeWidth={2.6} style={{ color }} />
      </span>
      <p className="font-display text-[15px] font-black tracking-tight text-mist-50">
        {title}
      </p>
      <p className="mt-1 text-[12px] text-mist-400 leading-snug">{sub}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color }}>
        Continuer <ArrowRight className="h-3 w-3" strokeWidth={2.8} />
      </span>
    </Link>
  );
}

function Stat({ icon, value }: { icon: React.ReactNode; value: number | string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {icon}
      <span className="font-display text-[14px] font-black tabular-nums text-mist-50">{value}</span>
    </span>
  );
}

function ActivityRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-mist-300 leading-relaxed">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span>{children}</span>
    </li>
  );
}

function FlagPng({ code }: { code: string }) {
  const lower = code.toLowerCase();
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={`https://flagcdn.com/w20/${lower}.png`}
      srcSet={`https://flagcdn.com/w40/${lower}.png 2x`}
      width={16}
      height={12}
      alt={`${code} flag`}
      className="rounded-[2px] object-cover"
      loading="lazy"
    />
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function tierProgress(
  pct: number,
  current: { id: string },
  next: { id: string },
): number {
  // Synthetic progression — invert percentile (lower = better), normalize per
  // tier band. Returns 0..100.
  const bands: Record<string, { min: number; max: number }> = {
    new: { min: 100, max: 50 },
    emerging: { min: 50, max: 25 },
    rising: { min: 25, max: 10 },
    trending: { min: 10, max: 5 },
    senior: { min: 5, max: 1 },
    elite: { min: 1, max: 0 },
  };
  const band = bands[current.id];
  if (!band) return 0;
  // pct closer to max means closer to next tier.
  const progressed = (band.min - pct) / (band.min - band.max);
  return Math.max(0, Math.min(100, Math.round(progressed * 100)));
}
