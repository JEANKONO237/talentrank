"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  Crown,
  Flame,
  Globe2,
  MapPin,
  RotateCcw,
  Share2,
  Shield,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { LeagueMascot } from "@/components/ui/LeagueMascot";
import { getHistoryFor, type CompletedAttempt } from "@/lib/qcm/session";
import {
  DIFFICULTY_LABEL,
  DIFFICULTY_WEIGHT,
  type CheatFlag,
  type QcmBank,
  type ScoreBreakdown,
} from "@/lib/qcm/types";
import { tierForPercentile, TIER_ORDER, type TierId } from "@/lib/tiers";
import { getProfession, professionLabel } from "@/lib/professions";
import { getTalentsByProfession } from "@/lib/mock-talents";
import { useTalentProfile } from "@/lib/profile/storage";
import { ShareScoreCard } from "@/components/share/ShareScoreCard";
import { track } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

// Demo city — until real auth + profile, we hardcode Paris. Replace with
// `useCurrentProfile().city` once the auth/profile pipe is wired.
const DEMO_USER_CITY = "Paris";

interface Props {
  bank: QcmBank;
}

// ─────────────────────────────────────────────────────────────────────────────
// QCM result page — cinematic close of the gameplay loop.
// Goal: every reveal should feel like a reward, not a data dump.
//   - Hero with score that COUNTS UP (drama)
//   - 3 stat tiles: XP gained, best streak, duration
//   - LEAGUE UPGRADE banner if the new score crosses a tier threshold
//   - Anti-cheat flags banner (only if any ≥ medium)
//   - Sequential reveals (each section enters with stagger)
//   - All on the light cream theme, no more dark dashboard cards
// ─────────────────────────────────────────────────────────────────────────────

export function QcmResultClient({ bank }: Props) {
  const [latest, setLatest] = useState<CompletedAttempt | null>(null);
  const [previousBest, setPreviousBest] = useState<CompletedAttempt | null>(null);
  const profession = getProfession(bank.professionId);

  useEffect(() => {
    const history = getHistoryFor(bank.professionId);
    const latestAttempt = history[0] ?? null;
    setLatest(latestAttempt);
    // Previous best = best across all attempts EXCEPT the latest one.
    const rest = history.slice(1);
    const prevBest = rest.reduce<CompletedAttempt | null>(
      (best, c) => (best === null || c.score.final > best.score.final ? c : best),
      null,
    );
    setPreviousBest(prevBest);

    // Track NSM event — qcm_completed est la moitié du North Star.
    // On le log au mount de la page result, donc dédupliqué naturellement
    // (un attempt = une visite ; refresh = re-track mais PostHog dedup côté
    // serveur via event_id si configuré). Pour le MVP on accepte le dup léger.
    if (latestAttempt) {
      const finalScore = latestAttempt.score.final;
      const t = tierForPercentile(Math.max(0, Math.min(100, 100 - finalScore)));
      const isNewBest = !prevBest || finalScore > prevBest.score.final;
      track("qcm_completed", {
        profession_id: bank.professionId,
        score: Math.round(finalScore),
        tier: t.id,
        is_new_best: isNewBest,
      });
    }
  }, [bank.professionId]);

  if (!latest) {
    return (
      <div className="container-page pt-28 pb-20 text-center max-w-md mx-auto">
        <p className="font-display text-[18px] font-bold text-mist-50">
          Aucune évaluation terminée pour ce métier.
        </p>
        <Link
          href={`/qcm/${bank.professionId}`}
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-duo-blue text-white font-bold px-5"
        >
          Passer l&apos;évaluation
          <ArrowRight className="h-4 w-4" strokeWidth={2.8} />
        </Link>
      </div>
    );
  }

  const score = latest.score;
  const tier = tierForPercentile(Math.max(0, Math.min(100, 100 - score.final)));
  const visibleFlags = score.flags.filter((f) => f.severity !== "low");
  // Identité partagée — on récupère le displayName du profil. Fallback
  // "Talent" pour éviter un partage vide. La city vient de DEMO_USER_CITY
  // tant que l'auth n'est pas câblée.
  const { profile } = useTalentProfile();
  const shareName = profile.displayName?.trim() || "Talent";

  // Rank computation — strict per-profession, then per-city subset.
  // We treat the user's final score as a virtual entry in the talent pool
  // and count how many existing talents outscore them.
  const peers = getTalentsByProfession(bank.professionId);
  const peersInCity = peers.filter(
    (t) => t.city?.toLowerCase() === DEMO_USER_CITY.toLowerCase(),
  );
  const rankInProfession =
    peers.filter((p) => p.score > score.final).length + 1;
  const rankInCity =
    peersInCity.filter((p) => p.score > score.final).length + 1;
  const totalInProfession = peers.length + 1;
  const totalInCity = peersInCity.length + 1;

  return (
    <div className="container-page pt-16 pb-20">
      <div className="max-w-4xl mx-auto space-y-8">
        <Hero
          score={score}
          tier={tier}
          attempt={latest}
          previousBest={previousBest}
          professionLabelFr={
            profession ? professionLabel(profession, "fr") : bank.frLabel
          }
          shareName={shareName}
          professionId={bank.professionId}
          shareCity={DEMO_USER_CITY}
        />

        <AttemptStatsStrip attempt={latest} bank={bank} />

        <RankSection
          professionLabelFr={
            profession ? professionLabel(profession, "fr") : bank.frLabel
          }
          city={DEMO_USER_CITY}
          rankInProfession={rankInProfession}
          totalInProfession={totalInProfession}
          rankInCity={rankInCity}
          totalInCity={totalInCity}
        />

        {visibleFlags.length > 0 && (
          <CheatBanner flags={visibleFlags} penalty={score.cheatPenalty} />
        )}

        <DimensionsSection score={score} />

        <AxesSection bank={bank} score={score} />

        <DifficultyMastery score={score} />

        <Actions professionId={bank.professionId} />

        <p className="text-center text-[11.5px] text-mist-400">
          Scoring v{latest.scoringVersion} · ton meilleur score est conservé
        </p>
      </div>
    </div>
  );
}

// ─── Hero: score reveal + tier upgrade celebration ───────────────────────────

function Hero({
  score,
  tier,
  attempt,
  previousBest,
  professionLabelFr,
  shareName,
  professionId,
  shareCity,
}: {
  score: ScoreBreakdown;
  tier: ReturnType<typeof tierForPercentile>;
  attempt: CompletedAttempt;
  previousBest: CompletedAttempt | null;
  professionLabelFr: string;
  shareName: string;
  professionId: string;
  shareCity: string;
}) {
  // Compute if this attempt is a NEW best AND moves to a higher league.
  const isNewBest = !previousBest || score.final > previousBest.score.final;
  const previousTier = previousBest
    ? tierForPercentile(Math.max(0, Math.min(100, 100 - previousBest.score.final)))
    : null;
  const tierIdx = (id: TierId) => TIER_ORDER.findIndex((t) => t.id === id);
  const tierUp = previousTier ? tierIdx(tier.id) < tierIdx(previousTier.id) : false;

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-mist-400">
        Score TalentRank · {professionLabelFr}
      </p>

      <ScoreOrb finalScore={score.final} tier={tier} />

      {previousBest && !isNewBest && (
        <p className="mt-2 text-[12.5px] text-mist-400">
          Meilleur score :{" "}
          <span className="font-bold text-mist-50 tabular-nums">
            {previousBest.score.final.toFixed(0)} %
          </span>
        </p>
      )}

      {isNewBest && previousBest && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.4 }}
          className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 ring-1 ring-inset ring-emerald-300/60 px-3 py-1 text-[12px] font-bold text-emerald-800"
        >
          <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.8} />
          Nouveau meilleur score · +
          {(score.final - previousBest.score.final).toFixed(0)} pts
        </motion.p>
      )}

      {/* League upgrade celebration */}
      <AnimatePresence>
        {tierUp && previousTier && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 1.8, type: "spring", stiffness: 360, damping: 22 }}
            className="mt-6 mx-auto max-w-md rounded-[24px] p-5 text-white text-center relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${tier.color}, ${tier.color}cc)`,
              boxShadow: `0 24px 60px -16px ${tier.color}aa, inset 0 1px 0 rgba(255,255,255,0.3)`,
            }}
          >
            {/* Sparkle ring */}
            {[...Array(6)].map((_, i) => {
              const angle = (i / 6) * Math.PI * 2;
              return (
                <motion.span
                  key={i}
                  className="absolute pointer-events-none"
                  initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                  animate={{
                    x: Math.cos(angle) * 90,
                    y: Math.sin(angle) * 60,
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0.6],
                  }}
                  transition={{ duration: 1.4, delay: 1.9, ease: "easeOut" }}
                  style={{ left: "50%", top: "50%" }}
                >
                  <Sparkles className="h-4 w-4 text-white" strokeWidth={2.6} />
                </motion.span>
              );
            })}
            <div className="flex items-center justify-center gap-3">
              <motion.span
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 2.0, type: "spring", stiffness: 320 }}
              >
                <LeagueMascot tier={tier.id} size={56} />
              </motion.span>
              <div className="text-left">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-white/90">
                  Tu montes en ligue
                </p>
                <p className="font-display text-[22px] font-black leading-tight">
                  {previousTier.label} → {tier.label}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share/flex CTA — apparaît après le reveal du score. Le moment le plus
          fort pour partager : "viens de finir le QCM, fier de mon score". */}
      {score.final >= 50 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.4, duration: 0.4 }}
          className="mt-7 flex justify-center"
        >
          <ShareScoreCard
            variant="primary"
            name={shareName}
            score={Math.round(score.final)}
            percentile={Math.max(0, Math.min(100, 100 - score.final))}
            professionId={professionId}
            professionLabel={professionLabelFr}
            city={shareCity}
          />
        </motion.div>
      )}
    </motion.section>
  );
}

// ─── Score orb with count-up animation ──────────────────────────────────────

function ScoreOrb({
  finalScore,
  tier,
}: {
  finalScore: number;
  tier: ReturnType<typeof tierForPercentile>;
}) {
  const lightTier =
    tier.id === "new" || tier.id === "emerging" || tier.id === "rising";
  const textPrimary = lightTier ? "#1B1208" : "#FFFFFF";
  const textMuted = lightTier ? "rgba(27,18,8,0.62)" : "rgba(255,255,255,0.78)";
  const textStrong = lightTier ? "rgba(27,18,8,0.78)" : "rgba(255,255,255,0.85)";

  return (
    <motion.div
      initial={{ scale: 0.65, opacity: 0, rotate: -8 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{
        duration: 0.9,
        ease: [0.2, 0.7, 0.2, 1],
        rotate: { duration: 0.6 },
      }}
      className="relative mx-auto mt-7 grid h-52 w-52 sm:h-56 sm:w-56 place-items-center rounded-full"
      style={{
        background: `radial-gradient(circle at 30% 25%, ${tier.highlight}, ${tier.color} 60%, ${tier.color}cc 100%)`,
        boxShadow: `0 30px 70px -14px ${tier.color}cc, inset 0 4px 0 rgba(255,255,255,0.55), inset 0 -20px 36px -10px rgba(0,0,0,0.45)`,
      }}
    >
      {/* Slow rotating aura */}
      <motion.span
        aria-hidden
        className="absolute -inset-2 rounded-full opacity-30 blur-2xl"
        style={{ background: tier.color }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="relative text-center">
        <span
          className="block font-display text-[14px] font-bold uppercase tracking-[0.18em]"
          style={{ color: textStrong }}
        >
          {tier.label}
        </span>
        <span
          className="mt-1 inline-flex items-baseline gap-1 font-display leading-none tabular-nums"
          style={{
            color: textPrimary,
            textShadow: lightTier ? "none" : "0 2px 8px rgba(0,0,0,0.5)",
          }}
        >
          <span className="text-[68px] sm:text-[76px] font-black">
            <AnimatedNumber value={Math.round(finalScore)} duration={1800} />
          </span>
          <span className="text-[24px] font-black opacity-90">%</span>
        </span>
        <span
          className="mt-1 block text-[10px] font-bold uppercase tracking-[0.18em]"
          style={{ color: textMuted }}
        >
          Score TalentRank
        </span>
      </div>
    </motion.div>
  );
}

// ─── Stats strip: XP gagné · Best streak · Durée ────────────────────────────

function AttemptStatsStrip({
  attempt,
  bank,
}: {
  attempt: CompletedAttempt;
  bank: QcmBank;
}) {
  const { xpEarned, bestStreak, durationSec } = useMemo(() => {
    const qById = new Map(bank.questions.map((q) => [q.id, q]));
    let xp = 0;
    let best = 0;
    let cur = 0;
    for (const a of attempt.attempt.answers) {
      const q = qById.get(a.questionId);
      if (a.correct && q) {
        xp += Math.round(DIFFICULTY_WEIGHT[q.difficulty] * 10);
        cur += 1;
        if (cur > best) best = cur;
      } else {
        cur = 0;
      }
    }
    const ms =
      (attempt.attempt.finishedAt ?? attempt.attempt.startedAt) -
      attempt.attempt.startedAt;
    return { xpEarned: xp, bestStreak: best, durationSec: Math.round(ms / 1000) };
  }, [attempt, bank]);

  const minutes = Math.floor(durationSec / 60);
  const seconds = durationSec % 60;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.0, duration: 0.5 }}
      className="grid grid-cols-3 gap-3 sm:gap-4"
    >
      <StatTile
        icon={<Zap className="h-4 w-4" strokeWidth={2.8} fill="currentColor" />}
        label="XP gagnés"
        accent="#FFC800"
        delay={1.1}
      >
        <span className="inline-flex items-baseline">
          <span className="font-display text-[26px] sm:text-[30px] font-black tabular-nums">
            +<AnimatedNumber value={xpEarned} duration={1200} />
          </span>
        </span>
      </StatTile>

      <StatTile
        icon={<Flame className="h-4 w-4" strokeWidth={2.8} fill="currentColor" />}
        label="Meilleur streak"
        accent="#FF6A3D"
        delay={1.2}
      >
        <span className="font-display text-[26px] sm:text-[30px] font-black tabular-nums">
          ×<AnimatedNumber value={bestStreak} duration={1000} />
        </span>
      </StatTile>

      <StatTile
        icon={<Clock className="h-4 w-4" strokeWidth={2.8} />}
        label="Durée totale"
        accent="#1CB0F6"
        delay={1.3}
      >
        <span className="font-display text-[26px] sm:text-[30px] font-black tabular-nums">
          {minutes > 0 ? `${minutes}m ${String(seconds).padStart(2, "0")}s` : `${seconds}s`}
        </span>
      </StatTile>
    </motion.div>
  );
}

function StatTile({
  icon,
  label,
  accent,
  children,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  accent: string;
  children: React.ReactNode;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
      className="rounded-[20px] bg-white ring-1 ring-inset ring-ink-700/10 shadow-card p-4 sm:p-5 text-center"
    >
      <span
        className="inline-grid h-8 w-8 place-items-center rounded-lg mb-2"
        style={{ background: `${accent}22`, color: accent }}
      >
        {icon}
      </span>
      <div style={{ color: accent }}>{children}</div>
      <p className="mt-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-mist-400">
        {label}
      </p>
    </motion.div>
  );
}

// ─── Rank section: ton rang mondial + local ─────────────────────────────────

function RankSection({
  professionLabelFr,
  city,
  rankInProfession,
  totalInProfession,
  rankInCity,
  totalInCity,
}: {
  professionLabelFr: string;
  city: string;
  rankInProfession: number;
  totalInProfession: number;
  rankInCity: number;
  totalInCity: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.35, duration: 0.5 }}
    >
      <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-mist-400 text-center mb-3">
        Ton rang aujourd&apos;hui
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <RankCard
          icon={<Globe2 className="h-4 w-4" strokeWidth={2.8} />}
          scopeLabel="Mondial"
          rank={rankInProfession}
          total={totalInProfession}
          subtext={professionLabelFr}
          accent="#1CB0F6"
          delay={1.45}
        />
        <RankCard
          icon={<MapPin className="h-4 w-4" strokeWidth={2.8} />}
          scopeLabel={`À ${city}`}
          rank={rankInCity}
          total={totalInCity}
          subtext={`${professionLabelFr}s · ${city}`}
          accent="#58CC02"
          delay={1.55}
        />
      </div>
    </motion.section>
  );
}

function RankCard({
  icon,
  scopeLabel,
  rank,
  total,
  subtext,
  accent,
  delay,
}: {
  icon: React.ReactNode;
  scopeLabel: string;
  rank: number;
  total: number;
  subtext: string;
  accent: string;
  delay: number;
}) {
  // Visual prestige indicator — top-3 gets a crown vibe
  const isPodium = rank <= 3;
  const podiumColor = rank === 1 ? "#FFC800" : rank === 2 ? "#C0C8D2" : rank === 3 ? "#D88A4A" : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
      className="relative overflow-hidden rounded-[24px] bg-white ring-1 ring-inset ring-ink-700/10 shadow-card p-6"
    >
      {/* Accent halo top-right */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-25 blur-3xl"
        style={{ background: podiumColor ?? accent }}
      />

      <div className="relative flex items-center gap-2.5 mb-4">
        <span
          className="inline-grid h-8 w-8 place-items-center rounded-lg"
          style={{ background: `${accent}22`, color: accent }}
        >
          {icon}
        </span>
        <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400">
          {scopeLabel}
        </p>
        {isPodium && (
          <motion.span
            initial={{ scale: 0, rotate: -25 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: delay + 0.35, type: "spring", stiffness: 380, damping: 22 }}
            className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em]"
            style={{
              background: `linear-gradient(180deg, ${podiumColor!}, ${podiumColor!}cc)`,
              color: "#1B1208",
              boxShadow: `0 2px 0 0 ${podiumColor!}aa, inset 0 1px 0 rgba(255,255,255,0.5)`,
            }}
          >
            <Crown className="h-3 w-3" strokeWidth={2.8} />
            Podium
          </motion.span>
        )}
      </div>

      <div className="relative">
        <span className="inline-flex items-baseline gap-1.5">
          <span
            className="font-display text-[14px] font-black opacity-80"
            style={{ color: accent }}
          >
            #
          </span>
          <span
            className="font-display font-black tabular-nums leading-none"
            style={{
              fontSize: "clamp(48px, 6vw, 64px)",
              color: podiumColor ?? accent,
            }}
          >
            <AnimatedNumber value={rank} duration={1200} />
          </span>
          <span className="font-display text-[18px] font-bold text-mist-400 tabular-nums">
            / {total}
          </span>
        </span>
      </div>

      <p className="relative mt-3 text-[12.5px] text-mist-300 leading-snug">
        {subtext}
      </p>

      {/* Progress bar — how high in the cohort */}
      <div className="relative mt-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-800">
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{
              width: `${Math.max(4, ((total - rank + 1) / total) * 100)}%`,
            }}
            transition={{ delay: delay + 0.2, duration: 1, ease: "easeOut" }}
            style={{ background: podiumColor ?? accent }}
          />
        </div>
        <p className="mt-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-mist-400 tabular-nums">
          Top {Math.max(1, Math.round((rank / total) * 100))}%
        </p>
      </div>
    </motion.div>
  );
}

// ─── Cheat banner ────────────────────────────────────────────────────────────

function CheatBanner({ flags, penalty }: { flags: CheatFlag[]; penalty: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.7, duration: 0.4 }}
      className="rounded-3xl bg-amber-50 ring-1 ring-inset ring-amber-300/60 p-5"
    >
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-amber-700" strokeWidth={2.6} />
        <p className="font-display text-[13.5px] font-black text-amber-800">
          {flags.length} signal{flags.length > 1 ? "aux" : ""} anti-cheat · -
          {penalty.toFixed(0)} pts
        </p>
      </div>
      <ul className="mt-3 space-y-1.5">
        {flags.map((f, i) => (
          <FlagRow key={i} flag={f} />
        ))}
      </ul>
    </motion.div>
  );
}

function FlagRow({ flag }: { flag: CheatFlag }) {
  const tone = flag.severity === "high" ? "text-rose-800" : "text-amber-900";
  return (
    <li className="flex items-start gap-2">
      <AlertTriangle
        className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", tone)}
        strokeWidth={2.6}
      />
      <span className={cn("text-[12.5px] leading-relaxed font-medium", tone)}>
        {flag.detail}
      </span>
    </li>
  );
}

// ─── Dimensions section (radar + bars) ───────────────────────────────────────

function DimensionsSection({ score }: { score: ScoreBreakdown }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.8, duration: 0.5 }}
      className="grid grid-cols-1 lg:grid-cols-5 gap-6"
    >
      {/* Radar */}
      <div className="lg:col-span-2 rounded-[24px] bg-white ring-1 ring-inset ring-ink-700/10 shadow-card p-6">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400">
          Six dimensions
        </p>
        <p className="mt-1 font-display text-[15px] font-black text-mist-50">
          Profil de performance
        </p>
        <div className="mt-5 grid place-items-center">
          <DimensionRadar score={score} />
        </div>
      </div>

      {/* Numeric breakdown */}
      <div className="lg:col-span-3 space-y-3">
        <DimensionBar label="Technique" value={score.technical} hint="Bonnes réponses, pondérées par difficulté" delay={1.9} />
        <DimensionBar label="Expérience" value={score.experience} hint="Cohérence avec tes années déclarées" delay={1.95} />
        <DimensionBar label="Fiabilité" value={score.reliability} hint="Stabilité du rythme + absence de skip" delay={2.0} />
        <DimensionBar label="Spécialisation" value={score.specialization} hint="Profondeur sur tes 3 meilleurs axes" delay={2.05} />
        <DimensionBar label="Communication" value={score.communication} hint="Placeholder · activé quand les Q libres arrivent" delay={2.1} />
        <DimensionBar label="Cohérence" value={score.coherence} hint="Cross-check expérience vs difficulté maîtrisée" delay={2.15} />
      </div>
    </motion.div>
  );
}

// ─── Axes section ────────────────────────────────────────────────────────────

function AxesSection({ bank, score }: { bank: QcmBank; score: ScoreBreakdown }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2.2, duration: 0.5 }}
      className="rounded-[24px] bg-white ring-1 ring-inset ring-ink-700/10 shadow-card p-6"
    >
      <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400">
        Réussite par axe
      </p>
      <p className="mt-1 font-display text-[15px] font-black text-mist-50">
        Où tu brilles · où tu peux progresser
      </p>
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {bank.axes.map((axis) => {
          const v = score.axisScores[axis.id];
          const has = typeof v === "number";
          return (
            <div
              key={axis.id}
              className={cn(
                "rounded-2xl ring-1 ring-inset ring-ink-700/10 px-3 py-2.5",
                has ? "bg-ink-850" : "bg-ink-850/50",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-bold text-mist-100">
                  {axis.frLabel}
                </span>
                <span
                  className="font-display text-[14px] font-black tabular-nums"
                  style={{ color: colorForScore(has ? v! : 0) }}
                >
                  {has ? `${v!.toFixed(0)} %` : "—"}
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink-200/60">
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${has ? Math.max(2, v!) : 0}%` }}
                  transition={{ delay: 2.0, duration: 0.9, ease: "easeOut" }}
                  style={{ background: colorForScore(has ? v! : 0) }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Difficulty mastery ─────────────────────────────────────────────────────

function DifficultyMastery({ score }: { score: ScoreBreakdown }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2.4, duration: 0.5 }}
      className="rounded-[24px] bg-white ring-1 ring-inset ring-ink-700/10 shadow-card p-6"
    >
      <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400">
        Réussite par difficulté
      </p>
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(["beginner", "intermediate", "advanced", "expert"] as const).map((d) => (
          <div
            key={d}
            className="rounded-2xl ring-1 ring-inset ring-ink-700/10 p-3 text-center"
            style={{ background: `${DIFFICULTY_COLOR[d]}15` }}
          >
            <p
              className="font-display text-[22px] font-black leading-none tabular-nums"
              style={{ color: DIFFICULTY_COLOR[d] }}
            >
              <AnimatedNumber value={Math.round(score.difficultyScores[d])} duration={1100} />
              <span className="text-[14px] opacity-80"> %</span>
            </p>
            <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-mist-400">
              {DIFFICULTY_LABEL[d].fr}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Actions ─────────────────────────────────────────────────────────────────

function Actions({ professionId }: { professionId: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2.6, duration: 0.5 }}
      className="flex flex-wrap justify-center gap-2.5"
    >
      <Link
        href={`/qcm/${professionId}`}
        className="inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-b from-duo-blue to-[#1A9DDB] text-white font-bold uppercase tracking-[0.04em] text-[12.5px] px-5 border-b-[3px] border-duo-blue-deep transition-all hover:brightness-105 active:translate-y-[2px] active:border-b-[1px]"
      >
        <RotateCcw className="h-4 w-4" strokeWidth={2.6} />
        Rejouer pour améliorer
      </Link>
      <Link
        href={`/ranking/${professionId}`}
        className="inline-flex h-11 items-center gap-2 rounded-full bg-white hover:bg-ink-850 ring-1 ring-inset ring-ink-700/15 text-mist-100 font-bold text-[12.5px] px-5 shadow-card"
      >
        <Crown className="h-4 w-4" strokeWidth={2.6} />
        Voir le classement
      </Link>
      <button className="inline-flex h-11 items-center gap-2 rounded-full bg-white hover:bg-ink-850 ring-1 ring-inset ring-ink-700/15 text-mist-100 font-bold text-[12.5px] px-5 shadow-card">
        <Share2 className="h-4 w-4" strokeWidth={2.6} />
        Partager
      </button>
    </motion.div>
  );
}

// ─── Difficulty color palette + helpers ──────────────────────────────────────

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner: "#94A3B8",
  intermediate: "#1CB0F6",
  advanced: "#58CC02",
  expert: "#FF8A00",
};

function colorForScore(v: number): string {
  if (v >= 80) return "#58CC02";
  if (v >= 60) return "#1CB0F6";
  if (v >= 40) return "#FFC800";
  if (v >= 20) return "#FF8A00";
  return "#94A3B8";
}

// ─── Radar (custom SVG hexagon) ──────────────────────────────────────────────

function DimensionRadar({ score }: { score: ScoreBreakdown }) {
  const dims: { key: keyof ScoreBreakdown; label: string }[] = [
    { key: "technical", label: "Tech" },
    { key: "experience", label: "Exp" },
    { key: "reliability", label: "Fiab" },
    { key: "specialization", label: "Spé" },
    { key: "communication", label: "Com" },
    { key: "coherence", label: "Cohé" },
  ];

  const cx = 110;
  const cy = 110;
  const radius = 90;

  const angleFor = (i: number) => (Math.PI * 2 * i) / dims.length - Math.PI / 2;
  const pointFor = (value: number, i: number) => {
    const r = (value / 100) * radius;
    return [cx + r * Math.cos(angleFor(i)), cy + r * Math.sin(angleFor(i))];
  };

  const dataPoints = dims.map((d, i) => pointFor(score[d.key] as number, i));
  const polygon = dataPoints.map(([x, y]) => `${x},${y}`).join(" ");

  return (
    <svg width={220} height={220} viewBox="0 0 220 220">
      {[0.25, 0.5, 0.75, 1].map((scale) => (
        <polygon
          key={scale}
          points={dims
            .map((_, i) => {
              const [x, y] = pointFor(100 * scale, i);
              return `${x},${y}`;
            })
            .join(" ")}
          fill="none"
          stroke="rgba(60,40,20,0.12)"
          strokeWidth={1}
        />
      ))}
      {dims.map((_, i) => {
        const [x, y] = pointFor(100, i);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="rgba(60,40,20,0.1)"
            strokeWidth={1}
          />
        );
      })}
      <motion.polygon
        points={polygon}
        fill="rgba(28,176,246,0.22)"
        stroke="#1CB0F6"
        strokeWidth={2}
        strokeLinejoin="round"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
        transition={{ duration: 0.7, delay: 1.6, ease: [0.2, 0.7, 0.2, 1] }}
      />
      {dataPoints.map(([x, y], i) => (
        <motion.circle
          key={i}
          cx={x}
          cy={y}
          r={3}
          fill="#1CB0F6"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 1.8 + i * 0.05 }}
        />
      ))}
      {dims.map((d, i) => {
        const [lx, ly] = pointFor(118, i);
        return (
          <text
            key={d.key}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#5A4528"
            style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em" }}
          >
            {d.label.toUpperCase()}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Dimension bar ────────────────────────────────────────────────────────────

function DimensionBar({
  label,
  value,
  hint,
  delay,
}: {
  label: string;
  value: number;
  hint: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
      className="rounded-2xl bg-white ring-1 ring-inset ring-ink-700/10 shadow-card px-4 py-3.5"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-[13.5px] font-black text-mist-50">{label}</p>
          <p className="text-[11px] text-mist-400 leading-snug">{hint}</p>
        </div>
        <span
          className="font-display text-[20px] font-black tabular-nums shrink-0"
          style={{ color: colorForScore(value) }}
        >
          <AnimatedNumber value={Math.round(value)} duration={1200} />
          <span className="text-[14px] opacity-80"> %</span>
        </span>
      </div>
      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-ink-200/60">
        <motion.div
          className="h-full rounded-full"
          style={{ background: colorForScore(value) }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ delay: delay + 0.2, duration: 0.9, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}
