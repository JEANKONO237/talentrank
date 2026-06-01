"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  Briefcase,
  ClipboardList,
  Image as ImageIcon,
  Lock,
  Shield,
  Sparkles,
  Trophy,
} from "lucide-react";
import { LeagueMascot } from "@/components/ui/LeagueMascot";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { TIER_ORDER, tierForPercentile, type Tier } from "@/lib/tiers";
import {
  getBestAttempt,
  getCooldownExpiresAt,
  subscribeCooldown,
  type CompletedAttempt,
} from "@/lib/qcm/session";
import { hasBank } from "@/lib/qcm/registry";
import { getTalentProfession, type Talent } from "@/lib/mock-talents";
import { professionLabel } from "@/lib/professions";
import { cn } from "@/lib/utils";

interface Props {
  talent: Talent;
}

// ─────────────────────────────────────────────────────────────────────────────
// /ligues — hub d'évaluation OFFICIEL, personnel.
// L'utilisateur arrive ici et comprend en 3 secondes :
//   1. Sa ligue actuelle (mascotte + label + position)
//   2. Pourquoi il est là (5 facteurs avec poids transparent)
//   3. Comment monter (CTA QCM ou cooldown qui défile)
//
// Tout est PAR MÉTIER. Rappelé en pied de page : Diamant en Animation 3D,
// Bronze en Motion Design — c'est normal et c'est ce qui rend le système
// crédible.
// ─────────────────────────────────────────────────────────────────────────────

// Pondération du score TalentRank — affichée explicitement au candidat.
// Ces poids sont la source de vérité côté UI ; la formule réelle vit dans
// lib/qcm/scoring.ts (côté QCM) et dans la couche d'agrégation backend.
const SCORE_FACTORS = [
  {
    id: "qcm",
    icon: Brain,
    label: "QCM officiel",
    weight: 55,
    color: "#1CB0F6",
    sub: ["Score technique", "Rapidité", "Logique", "Précision"],
  },
  {
    id: "experience",
    icon: Briefcase,
    label: "Expérience professionnelle",
    weight: 15,
    color: "#FFC800",
    sub: ["Années", "Cohérence du parcours", "Progression", "Stabilité"],
  },
  {
    id: "portfolio",
    icon: ImageIcon,
    label: "Portfolio · Showreel",
    weight: 15,
    color: "#A78BFA",
    sub: ["Présence", "Qualité", "Diversité", "Activité"],
  },
  {
    id: "missions",
    icon: ClipboardList,
    label: "Missions · Historique",
    weight: 10,
    color: "#58CC02",
    sub: ["Régularité", "Continuité", "Références"],
  },
  {
    id: "signals",
    icon: Sparkles,
    label: "Signaux comportementaux",
    weight: 5,
    color: "#F472B6",
    sub: ["Activité plateforme", "Réactivité", "Complétion profil", "Vérifications"],
  },
] as const;

export function LiguesClient({ talent }: Props) {
  const profession = getTalentProfession(talent);
  const profLabel = professionLabel(profession, "fr");
  const tier = tierForPercentile(talent.percentile);

  const idxInOrder = TIER_ORDER.findIndex((t) => t.id === tier.id);
  const nextTier = idxInOrder > 0 ? TIER_ORDER[idxInOrder - 1] : null;
  const tierProgressPct = computeTierProgress(talent.percentile, tier);

  // Cooldown subscription
  const [cooldownExpiresAt, setCooldownExpiresAt] = useState<number | null>(null);
  const [best, setBest] = useState<CompletedAttempt | null>(null);
  useEffect(() => {
    setCooldownExpiresAt(getCooldownExpiresAt(profession.id));
    setBest(getBestAttempt(profession.id));
    return subscribeCooldown(() => {
      setCooldownExpiresAt(getCooldownExpiresAt(profession.id));
      setBest(getBestAttempt(profession.id));
    });
  }, [profession.id]);

  const qcmAvailable = hasBank(profession.id);
  const cooldownActive = cooldownExpiresAt !== null;

  return (
    <div className="container-page pt-10 pb-20 max-w-4xl mx-auto">
      {/* ─── Hero : ta ligue actuelle ──────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-[28px] text-white"
        style={{
          background: `linear-gradient(135deg, ${tier.color}, ${tier.color}cc)`,
          boxShadow: `0 28px 60px -22px ${tier.color}55, inset 0 1px 0 rgba(255,255,255,0.3)`,
        }}
      >
        <div className="relative grid grid-cols-1 sm:grid-cols-[1fr_auto] items-center gap-6 p-7 sm:p-9">
          <div className="min-w-0">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-white/85">
              Ton classement officiel
            </p>
            <h1 className="mt-2 font-display font-black tracking-tight leading-tight"
              style={{ fontSize: "clamp(2rem, 4.5vw, 3rem)", letterSpacing: "-0.02em" }}
            >
              Tu es <span className="underline decoration-white/40 decoration-[6px] underline-offset-4">{tier.label}</span>
            </h1>
            <p className="mt-3 text-[14.5px] text-white/95">
              {profLabel} · <span className="font-bold">Top {percentLabel(talent.percentile)}</span>
            </p>

            {/* Progress to next tier */}
            {nextTier && (
              <div className="mt-5 max-w-md">
                <div className="flex items-center justify-between text-[10.5px] font-bold uppercase tracking-[0.14em] text-white/85">
                  <span>Prochaine ligue · {nextTier.label}</span>
                  <span className="tabular-nums">{tierProgressPct}%</span>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-black/15">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${tierProgressPct}%` }}
                    transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
                    className="h-full rounded-full bg-white/85"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Mascot — large hero medallion */}
          <div className="shrink-0 mx-auto sm:mx-0">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
              className="grid place-items-center rounded-full"
              style={{
                width: 200,
                height: 200,
                background: `radial-gradient(circle at 30% 25%, ${tier.highlight}, ${tier.color}dd 60%, ${tier.color}aa 100%)`,
                boxShadow: `inset 0 5px 0 rgba(255,255,255,0.55), inset 0 -28px 44px -10px rgba(0,0,0,0.4), 0 26px 50px -12px rgba(0,0,0,0.3)`,
              }}
            >
              <LeagueMascot tier={tier.id} size={150} className="drop-shadow-[0_8px_14px_rgba(0,0,0,0.35)]" />
            </motion.div>
          </div>
        </div>
        {/* Decorative sparkles */}
        <span aria-hidden className="pointer-events-none absolute top-4 right-6 text-white/40">
          <Sparkles className="h-4 w-4" />
        </span>
      </motion.section>

      {/* ─── Action principale : QCM ou cooldown ────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08 }}
        className="mt-6"
      >
        {cooldownActive ? (
          <CooldownCard expiresAt={cooldownExpiresAt!} bestScore={best?.score.final ?? null} />
        ) : qcmAvailable ? (
          <QcmCallToAction professionId={profession.id} professionLabel={profLabel} />
        ) : (
          <NoQcmYet professionLabel={profLabel} />
        )}
      </motion.section>

      {/* ─── Score factors : transparence totale ────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.15 }}
        className="mt-10 rounded-[24px] bg-white ring-1 ring-ink-700/10 shadow-card p-6 sm:p-7"
      >
        <div className="flex items-center justify-between gap-3 mb-1">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-mist-400">
            Comment ton score est calculé
          </p>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-[0.14em] text-mist-400">
            <Shield className="h-3 w-3" strokeWidth={2.6} />
            Algorithme officiel
          </span>
        </div>
        <h2
          className="font-display font-black tracking-tight text-mist-50"
          style={{ fontSize: "clamp(1.4rem, 2.6vw, 1.9rem)", lineHeight: 1.1 }}
        >
          5 axes mesurés, transparents.
        </h2>
        <p className="mt-3 text-[13.5px] text-mist-300 leading-relaxed">
          Pas une note arbitraire : ton score TalentRank est l&apos;agrégat de
          5 mesures, pondérées. Le QCM officiel domine — c&apos;est ton mérite
          technique. Le reste affine ta crédibilité globale.
        </p>

        <ul className="mt-6 space-y-2.5">
          {SCORE_FACTORS.map((f) => {
            const Icon = f.icon;
            return (
              <li
                key={f.id}
                className="rounded-2xl bg-ink-50/60 ring-1 ring-inset ring-ink-700/8 p-4"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="inline-grid h-10 w-10 place-items-center rounded-xl shrink-0"
                    style={{ background: `${f.color}1f`, boxShadow: `inset 0 0 0 1.5px ${f.color}40` }}
                  >
                    <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" strokeWidth={2.6} style={{ color: f.color }} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-display text-[14.5px] font-black tracking-tight text-mist-50">
                        {f.label}
                      </p>
                      <span
                        className="font-display text-[16px] font-black tabular-nums"
                        style={{ color: f.color }}
                      >
                        {f.weight}%
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${f.weight}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: f.color }}
                      />
                    </div>
                  </div>
                </div>
                <p className="mt-2.5 text-[11.5px] text-mist-400 leading-relaxed pl-[52px]">
                  {f.sub.join(" · ")}
                </p>
              </li>
            );
          })}
        </ul>
      </motion.section>

      {/* ─── Échelle des ligues (compacte) ──────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.22 }}
        className="mt-10"
      >
        <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-mist-400 mb-4 px-1">
          Les six paliers · ton métier
        </p>
        <LeagueLadder current={tier.id} />
      </motion.section>

      {/* ─── Rappel par métier ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.3 }}
        className="mt-10 rounded-2xl bg-white ring-1 ring-ink-700/10 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3"
      >
        <span className="inline-grid h-9 w-9 place-items-center rounded-full bg-cyan-100 shrink-0">
          <Shield className="h-4 w-4 text-cyan-700" strokeWidth={2.6} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-display text-[14px] font-black text-mist-50">
            Le classement est calculé <span className="text-cyan-600">par métier</span>.
          </p>
          <p className="mt-1 text-[12px] text-mist-400 leading-relaxed">
            Tu peux être <span className="font-bold text-mist-200">Diamant en Animation 3D</span> et{" "}
            <span className="font-bold text-mist-200">Bronze en Motion Design</span>.
            C&apos;est normal — chaque métier a ses propres exigences.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ─── QCM call-to-action (when no cooldown) ───────────────────────────────
function QcmCallToAction({
  professionId,
  professionLabel,
}: {
  professionId: string;
  professionLabel: string;
}) {
  return (
    <div className="rounded-[24px] bg-white ring-1 ring-ink-700/10 shadow-card p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center gap-5">
      <span
        className="inline-grid h-14 w-14 place-items-center rounded-2xl shrink-0"
        style={{ background: "linear-gradient(160deg, rgba(28,176,246,0.18), rgba(28,176,246,0.08))", boxShadow: "inset 0 0 0 1.5px rgba(28,176,246,0.35)" }}
      >
        <Brain className="h-6 w-6 text-cyan-600" strokeWidth={2.5} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400">
          Action principale
        </p>
        <h3 className="mt-1 font-display text-[20px] sm:text-[22px] font-black tracking-tight text-mist-50 leading-tight">
          Passe le QCM officiel
        </h3>
        <p className="mt-1.5 text-[13px] text-mist-400 leading-relaxed">
          12 questions adaptées à ton niveau {professionLabel}. Score multi-dimensions, anti-cheat intégré.
        </p>
      </div>
      <Link
        href={`/qcm/${professionId}`}
        className="inline-flex h-12 items-center gap-2 rounded-full px-6 font-bold uppercase tracking-[0.04em] text-[13px] text-white whitespace-nowrap"
        style={{
          background: "linear-gradient(180deg, #1CB0F6, #1A9DDB)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 4px 0 #0E84BB, 0 10px 24px -8px rgba(28,176,246,0.55)",
        }}
      >
        Commencer
        <ArrowRight className="h-4 w-4" strokeWidth={2.8} />
      </Link>
    </div>
  );
}

// ─── Cooldown card ──────────────────────────────────────────────────────
function CooldownCard({
  expiresAt,
  bestScore,
}: {
  expiresAt: number;
  bestScore: number | null;
}) {
  return (
    <div className="rounded-[24px] bg-white ring-1 ring-ink-700/10 shadow-card p-6 sm:p-7">
      <div className="flex items-center gap-4">
        <span
          className="inline-grid h-14 w-14 place-items-center rounded-2xl shrink-0"
          style={{
            background: "linear-gradient(160deg, #FFEAA0, #FFC800)",
            boxShadow: "inset 0 0 0 1.5px rgba(201,154,0,0.45), 0 6px 14px -6px rgba(201,154,0,0.5)",
          }}
        >
          <Lock className="h-6 w-6 text-ink-950" strokeWidth={2.6} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400">
            Évaluation verrouillée
          </p>
          <h3 className="mt-1 font-display text-[18px] sm:text-[20px] font-black tracking-tight text-mist-50 leading-tight">
            Nouvelle tentative dans
          </h3>
          <div className="mt-2">
            <CountdownTimer expiresAt={expiresAt} size="md" />
          </div>
        </div>
      </div>
      <p className="mt-4 text-[11.5px] text-mist-400 leading-relaxed">
        Pour préserver la crédibilité du classement, chaque évaluation se reverrouille pendant 1 mois.
        {bestScore !== null && (
          <>
            {" "}Ton meilleur score actuel :{" "}
            <span className="font-display font-black text-mist-100 tabular-nums">
              {Math.round(bestScore)} / 100
            </span>
            .
          </>
        )}
      </p>
    </div>
  );
}

function NoQcmYet({ professionLabel }: { professionLabel: string }) {
  return (
    <div className="rounded-[24px] bg-white ring-1 ring-dashed ring-ink-700/20 p-7 text-center">
      <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400">
        Évaluation à venir
      </p>
      <h3 className="mt-2 font-display text-[18px] font-black text-mist-50">
        QCM {professionLabel} en préparation
      </h3>
      <p className="mt-2 text-[12.5px] text-mist-400 max-w-md mx-auto">
        Le QCM officiel de ton métier est en cours de préparation. En attendant, tu peux explorer
        les autres évaluations.
      </p>
      <Link
        href="/qcm"
        className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-full bg-ink-50 hover:bg-ink-100 ring-1 ring-inset ring-ink-700/10 px-4 text-[12.5px] font-bold text-mist-100"
      >
        Voir toutes les évaluations
        <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.6} />
      </Link>
    </div>
  );
}

// ─── League ladder (compact, highlights current tier) ─────────────────────
function LeagueLadder({ current }: { current: Tier["id"] }) {
  // From Nouveau on left to Diamant on right
  const climb = [...TIER_ORDER].reverse();
  return (
    <div className="rounded-[24px] bg-white ring-1 ring-ink-700/10 shadow-card p-6 sm:p-9">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-x-3 gap-y-8 sm:gap-3 items-end">
        {climb.map((tier, i) => {
          const t = i / (climb.length - 1);
          const lift = t * 22; // élévation progressive plus marquée
          const size = 64 + t * 46; // 64 → 110 (beaucoup plus visibles)
          const mascotSize = Math.round(size * 0.72);
          const isCurrent = tier.id === current;
          return (
            <div
              key={tier.id}
              className="flex flex-col items-center text-center"
              style={{ transform: `translateY(-${lift}px)` }}
            >
              <div
                className="relative grid place-items-center rounded-full transition-transform hover:scale-[1.06]"
                style={{
                  width: size,
                  height: size,
                  background: `radial-gradient(circle at 30% 25%, ${tier.highlight}, ${tier.color} 60%, ${tier.color}cc 100%)`,
                  boxShadow: isCurrent
                    ? `0 18px 36px -8px ${tier.color}aa, inset 0 3px 0 rgba(255,255,255,0.55), inset 0 -14px 24px -8px rgba(0,0,0,0.35), 0 0 0 5px white, 0 0 0 8px ${tier.color}`
                    : `0 10px 22px -8px ${tier.color}80, inset 0 2px 0 rgba(255,255,255,0.5), inset 0 -12px 20px -8px rgba(0,0,0,0.3)`,
                }}
              >
                <LeagueMascot
                  tier={tier.id}
                  size={mascotSize}
                  className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]"
                />
              </div>
              <p
                className="mt-3 font-display font-black leading-none truncate w-full"
                style={{
                  fontSize: 12 + t * 3,
                  color: isCurrent ? tier.color : "#3A2812",
                }}
              >
                {tier.label}
              </p>
              {isCurrent && (
                <span
                  className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                  style={{ background: `${tier.color}22`, color: tier.color }}
                >
                  <Trophy className="h-2.5 w-2.5" strokeWidth={2.8} />
                  Toi
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function computeTierProgress(pct: number, current: Tier): number {
  // Same bands as the dashboard helper. Returns 0..100 — closer to next tier
  // means closer to 100.
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
  const progressed = (band.min - pct) / (band.min - band.max);
  return Math.max(0, Math.min(100, Math.round(progressed * 100)));
}

function percentLabel(pct: number): string {
  if (pct <= 1) return "1% mondial";
  if (pct <= 5) return "5% mondial";
  if (pct <= 10) return "10% mondial";
  if (pct <= 25) return "25% mondial";
  if (pct <= 50) return "50% mondial";
  return "100% — bienvenue";
}
