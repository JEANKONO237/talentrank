"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Clock,
  Eye,
  Layers,
  Lock,
  Shield,
  Sparkles,
  Trophy,
} from "lucide-react";
import { configForYears, makeSeed, selectQuestions, shuffleOptions } from "@/lib/qcm/registry";
import { applyAntiLeak, type ExposureRecord } from "@/lib/qcm/anti-leak";
import {
  COOLDOWN_MS,
  getBestAttempt,
} from "@/lib/qcm/session";
import {
  getExposedQuestionIds,
  useQcmGate,
  useQcmStartAttempt,
} from "@/lib/qcm/use-qcm-store";
import { type QcmBank, type Question } from "@/lib/qcm/types";
import { getProfession, getCategory, professionLabel } from "@/lib/professions";
import { iconForCategory } from "@/lib/profession-icons";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { track } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

interface Props {
  bank: QcmBank;
}

export function QcmBriefingClient({ bank }: Props) {
  const router = useRouter();
  const profession = getProfession(bank.professionId);
  const category = profession ? getCategory(profession.category) : undefined;

  // ── ALL hooks declared up-front (Rules of Hooks) ────────────────────────
  const [years, setYears] = useState<number>(4);
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  // Gate unifié auth/anon (Supabase si user logged-in, localStorage sinon).
  // Source de vérité : RPC can_start_qcm côté Supabase, sinon getCooldownExpiresAt local.
  const gate = useQcmGate(bank.professionId);
  const startAttempt = useQcmStartAttempt();

  // Mode chargement : rien n'affiche tant qu'on n'a pas le gate
  if (gate.mode === "loading") {
    return (
      <div className="container-page pt-28 pb-20 text-center">
        <p className="text-mist-400">Vérification de ton accès…</p>
      </div>
    );
  }

  // Cooldown ou lockout → écran verrouillé
  if (!gate.allowed && (gate.reason === "cooldown" || gate.reason === "lockout")) {
    return (
      <CooldownLock
        bank={bank}
        expiresAt={gate.expiresAt ?? Date.now() + COOLDOWN_MS}
        reason={gate.reason}
        scope={gate.scope}
        onExpire={() => window.location.reload()}
      />
    );
  }

  const Icon = category ? iconForCategory(category.id) : Sparkles;
  const config = configForYears(years);
  const estMinutes = Math.ceil(
    (config.totalQuestions * 30) / 60, // ~30s per question average
  );

  const start = async () => {
    if (starting) return;
    setStarting(true);
    setStartError(null);
    // Track avant la logique async — capture l'intent même si le start échoue.
    track("qcm_started", { profession_id: bank.professionId });
    try {
      // 1. Charger les exposures (mode auth uniquement) — questions déjà vues
      //    par ce talent sur ce métier dans la fenêtre anti-leak.
      let exposures: ExposureRecord[] = [];
      if (gate.mode === "auth") {
        try {
          const exposed = await getExposedQuestionIds(bank.professionId, 180);
          exposures = exposed.map((e) => ({
            questionId: e.questionId,
            lastSeenAt: e.lastSeenAt,
          }));
        } catch (err) {
          // Non-bloquant — si Supabase rate, on lance quand même sans
          // anti-leak strict. Mieux que de bloquer le user.
          console.warn("Could not load exposures for anti-leak:", err);
        }
      }

      // 2. Appliquer la stratégie hybride :
      //    <80 Qs : pondération fraîcheur · 80-300 : exclusion 90j · 300+ : exclusion 180j
      const leakResult = applyAntiLeak(bank.questions, exposures);

      // 3. Construire un "filtered bank" pour le selector (ne contient que les
      //    questions candidates après anti-leak). Si tout est exclu (rare,
      //    petit pool + user power), on retombe sur le bank complet.
      const candidatePool: Question[] = leakResult.candidates.map((c) => c.question);
      const filteredBank = {
        ...bank,
        questions: candidatePool.length >= config.totalQuestions ? candidatePool : bank.questions,
      };

      // 4. Seed unique (partagé : select + shuffleOptions + startAttempt → DB)
      const seed = makeSeed();

      // 5. Sélection finale (respect config difficultyMix + minAxesCoverage)
      const selected = selectQuestions({ bank: filteredBank, config, seed });

      // 6. Shuffler les options PAR QUESTION avec un seed dérivé — l'ordre
      //    sera persisté en option_order_json côté DB.
      const shuffled = selected.map((q) => shuffleOptions(q, seed));

      // 7. Démarre l'attempt côté store (Supabase ou localStorage)
      await startAttempt({
        bank,
        selectedQuestions: shuffled,
        declaredYears: years,
        seed,
      });

      router.push(`/qcm/${bank.professionId}/play`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Démarrage impossible.";
      setStartError(msg);
      setStarting(false);
    }
  };

  return (
    <div className="container-page pt-28 pb-20">
      {/* Breadcrumb */}
      <Link
        href="/qcm"
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-mist-400 hover:text-mist-50 transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.6} />
        Toutes les évaluations
      </Link>

      {/* Header */}
      <div className="mt-6 flex items-center gap-4">
        <span
          className="inline-grid h-14 w-14 place-items-center rounded-2xl ring-1 ring-inset ring-ink-700/15 shrink-0"
          style={{
            background: category
              ? `linear-gradient(160deg, ${category.color}30, ${category.color}10)`
              : "#FFFFFF",
          }}
        >
          <Icon
            className="h-7 w-7"
            strokeWidth={2.5}
            style={{ color: category?.color ?? "#22D3EE" }}
          />
        </span>
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-mist-400">
            Évaluation officielle
          </p>
          <h1 className="mt-1 font-display text-[32px] sm:text-[40px] font-bold tracking-tight text-mist-50 leading-tight">
            {profession ? professionLabel(profession, "fr") : bank.frLabel}
          </h1>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Years declaration */}
          <Card>
            <CardLabel
              icon={<Brain className="h-4 w-4" strokeWidth={2.6} />}
              title="Tes années d'expérience"
              sub="Ce chiffre détermine la difficulté du QCM. Inutile de gonfler — l'engine compare tes réponses à ta déclaration."
            />
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3 rounded-2xl bg-ink-850 ring-1 ring-inset ring-ink-700/15 px-3 py-2">
                <button
                  onClick={() => setYears((y) => Math.max(0, y - 1))}
                  className="grid h-9 w-9 place-items-center rounded-xl bg-white ring-1 ring-inset ring-ink-700/15 text-mist-100 hover:bg-ink-800 hover:ring-ink-700/25"
                  aria-label="Diminuer"
                >
                  −
                </button>
                <div className="text-center min-w-[80px]">
                  <p className="font-display text-[36px] font-bold text-mist-50 leading-none tabular-nums">
                    {years}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-mist-400">
                    {years <= 1 ? "année" : "années"}
                  </p>
                </div>
                <button
                  onClick={() => setYears((y) => Math.min(40, y + 1))}
                  className="grid h-9 w-9 place-items-center rounded-xl bg-white ring-1 ring-inset ring-ink-700/15 text-mist-100 hover:bg-ink-800 hover:ring-ink-700/25"
                  aria-label="Augmenter"
                >
                  +
                </button>
              </div>
              <input
                type="range"
                min={0}
                max={30}
                step={1}
                value={years}
                onChange={(e) => setYears(Number(e.currentTarget.value))}
                className="flex-1 min-w-[140px] accent-cyan-400"
              />
            </div>
          </Card>

          {/* Mix preview */}
          <Card>
            <CardLabel
              icon={<Layers className="h-4 w-4" strokeWidth={2.6} />}
              title="Mix adaptatif"
              sub={`Pour ${years} ${years <= 1 ? "année" : "années"} déclarées, ton QCM contiendra :`}
            />
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Stat
                label="Débutant"
                value={config.difficultyMix.beginner}
                color="#94A3B8"
              />
              <Stat
                label="Intermédiaire"
                value={config.difficultyMix.intermediate}
                color="#1CB0F6"
              />
              <Stat
                label="Avancé"
                value={config.difficultyMix.advanced}
                color="#58CC02"
              />
              <Stat
                label="Expert"
                value={config.difficultyMix.expert}
                color="#FF8A00"
              />
            </div>
          </Card>

          {/* Rules */}
          <Card>
            <CardLabel
              icon={<Shield className="h-4 w-4" strokeWidth={2.6} />}
              title="Les règles"
              sub="Tout est local pour l'instant. L'engine note tes réponses + détecte les anomalies."
            />
            <ul className="mt-5 space-y-2 text-[13.5px] text-mist-200">
              <Rule>
                <Clock className="h-4 w-4 text-cyan-300 shrink-0" strokeWidth={2.6} />
                <span>Une seule réponse par question. Pas de retour en arrière.</span>
              </Rule>
              <Rule>
                <Eye className="h-4 w-4 text-cyan-300 shrink-0" strokeWidth={2.6} />
                <span>
                  Changer d&apos;onglet, coller du texte ou répondre trop vite est
                  enregistré et peut pénaliser le score.
                </span>
              </Rule>
              <Rule>
                <Sparkles className="h-4 w-4 text-cyan-300 shrink-0" strokeWidth={2.6} />
                <span>
                  Le score final est un agrégat de 6 dimensions. Tu peux rejouer
                  — ton meilleur score compte.
                </span>
              </Rule>
            </ul>
            <label className="mt-5 flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acceptedRules}
                onChange={(e) => setAcceptedRules(e.currentTarget.checked)}
                className="mt-0.5 h-4 w-4 accent-cyan-400 cursor-pointer"
              />
              <span className="text-[13px] text-mist-200">
                Je joue en honnêteté — pas de copie, pas de recherche externe.
              </span>
            </label>
          </Card>
        </div>

        {/* Right: summary + start CTA */}
        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-24 space-y-4">
            <div className="rounded-3xl bg-white ring-1 ring-inset ring-ink-700/10 shadow-card p-5">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400">
                Récapitulatif
              </p>
              <dl className="mt-4 space-y-3 text-[13px]">
                <Row label="Questions">{config.totalQuestions}</Row>
                <Row label="Durée estimée">~{estMinutes} min</Row>
                <Row label="Axes minimum">{config.minAxesCoverage} sur {bank.axes.length}</Row>
                <Row label="Banque totale">{bank.questions.length} questions</Row>
              </dl>
              <button
                onClick={start}
                disabled={!acceptedRules || starting}
                className={cn(
                  "mt-6 w-full inline-flex h-12 items-center justify-center gap-2 rounded-full px-5 text-[14px] font-bold tracking-tight transition-all",
                  acceptedRules && !starting
                    ? "bg-gradient-to-b from-duo-green to-[#48AB02] text-white border-b-[3px] border-duo-green-deep hover:brightness-105 active:translate-y-[2px] active:border-b-[1px]"
                    : "bg-ink-850 text-mist-500 cursor-not-allowed ring-1 ring-inset ring-ink-700/15",
                )}
              >
                {starting ? "Démarrage…" : "Commencer l’évaluation"}
                {!starting && <ArrowRight className="h-4 w-4" strokeWidth={2.8} />}
              </button>
              {startError && (
                <p className="mt-3 text-center text-[11.5px] text-rose-500 font-medium">
                  {startError}
                </p>
              )}
              <p className="mt-3 text-center text-[11px] text-mist-500">
                {acceptedRules ? "Bonne chance." : "Coche la règle d'honnêteté pour démarrer."}
              </p>
            </div>

            {/* Axis list */}
            <div className="rounded-3xl bg-white ring-1 ring-inset ring-ink-700/10 shadow-card p-5">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400">
                Axes évalués
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {bank.axes.map((a) => (
                  <span
                    key={a.id}
                    className="inline-flex items-center rounded-full bg-ink-850 ring-1 ring-inset ring-ink-700/15 px-2.5 py-1 text-[11.5px] font-medium text-mist-200"
                  >
                    {a.frLabel}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-white ring-1 ring-inset ring-ink-700/10 shadow-card p-6">
      {children}
    </div>
  );
}

function CardLabel({
  icon,
  title,
  sub,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="inline-grid h-8 w-8 place-items-center rounded-xl bg-cyan-400/15 text-cyan-300 ring-1 ring-inset ring-cyan-400/30 shrink-0">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-display text-[15px] font-bold text-mist-50">{title}</p>
        <p className="mt-1 text-[12.5px] text-mist-400 leading-relaxed">{sub}</p>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="rounded-2xl ring-1 ring-inset ring-ink-700/10 p-3 text-center"
      style={{ background: `${color}14` }}
    >
      <p className="font-display text-[26px] font-bold leading-none tabular-nums" style={{ color }}>
        {value}
      </p>
      <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-mist-400">
        {label}
      </p>
    </div>
  );
}

function Rule({ children }: { children: React.ReactNode }) {
  return <li className="flex items-start gap-2.5">{children}</li>;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-mist-400">{label}</dt>
      <dd className="font-display font-bold text-mist-50 tabular-nums">{children}</dd>
    </div>
  );
}

// ─── CooldownLock ──────────────────────────────────────────────────────────
// Shown instead of the briefing when the candidate already took the QCM for
// this profession in the last 10 days. The countdown ticks live every second
// so the experience feels like a real competitive exam timer.

function CooldownLock({
  bank,
  expiresAt,
  reason = "cooldown",
  scope,
  onExpire,
}: {
  bank: QcmBank;
  expiresAt: number;
  reason?: "cooldown" | "lockout";
  scope?: "user" | "fingerprint" | "ip";
  onExpire: () => void;
}) {
  const profession = getProfession(bank.professionId);
  const profLabel = profession ? professionLabel(profession, "fr") : bank.frLabel;
  const best = typeof window !== "undefined" ? getBestAttempt(bank.professionId) : null;
  // Compute when the cooldown originally started for the % bar.
  const startedAt = expiresAt - COOLDOWN_MS;
  const elapsed = Math.max(0, Date.now() - startedAt);
  const pct = Math.min(100, Math.round((elapsed / COOLDOWN_MS) * 100));
  const isLockout = reason === "lockout";

  return (
    <div className="container-page pt-20 pb-16">
      {/* Breadcrumb */}
      <Link
        href="/qcm"
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-mist-400 hover:text-mist-50 transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.6} />
        Toutes les évaluations
      </Link>

      <div className="mt-12 mx-auto max-w-2xl text-center">
        {/* Big lock badge */}
        <div className="relative inline-grid h-28 w-28 place-items-center rounded-full"
          style={{
            background: "radial-gradient(circle at 30% 25%, #FFEAA0, #FFC800 60%, #C99A00cc 100%)",
            boxShadow: "0 22px 50px -14px rgba(201,154,0,0.7), inset 0 3px 0 rgba(255,255,255,0.55), inset 0 -16px 28px -8px rgba(0,0,0,0.35)",
          }}
        >
          <Lock className="h-12 w-12 text-ink-950" strokeWidth={2.6} />
          {/* Subtle aura */}
          <span aria-hidden className="absolute -inset-3 rounded-full opacity-25 blur-2xl" style={{ background: "#FFC800" }} />
        </div>

        <p className="mt-7 text-[10.5px] font-bold uppercase tracking-[0.24em] text-mist-400">
          {isLockout ? "Évaluation suspendue" : "Évaluation verrouillée"}
        </p>
        <h1
          className="mt-3 font-display font-black tracking-tight text-mist-50"
          style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", lineHeight: 1.05, letterSpacing: "-0.02em" }}
        >
          {profLabel}
        </h1>
        <p className="mt-3 text-[14px] text-mist-300 max-w-md mx-auto leading-relaxed">
          {isLockout ? (
            <>
              Activité suspecte détectée. Le passage est suspendu pour préserver
              la crédibilité du classement.
              {scope === "fingerprint" && " (navigateur identifié)"}
              {scope === "ip" && " (réseau identifié)"}
            </>
          ) : (
            <>
              Tu as déjà passé ce QCM. Pour préserver la crédibilité du
              classement, chaque évaluation se reverrouille pendant{" "}
              <span className="font-bold text-mist-50">1 mois</span>.
            </>
          )}
        </p>

        {/* Live countdown */}
        <div className="mt-9 rounded-[28px] bg-white ring-1 ring-ink-700/10 shadow-card p-7">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-mist-400">
            Nouvelle tentative dans
          </p>
          <div className="mt-3 flex items-center justify-center">
            <CountdownTimer
              expiresAt={expiresAt}
              size="xl"
              onExpire={onExpire}
            />
          </div>
          {/* Progress bar */}
          <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-ink-850">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                background: "linear-gradient(90deg, #FFC800, #58CC02)",
              }}
            />
          </div>
          <p className="mt-3 text-[11.5px] text-mist-400 tabular-nums">
            {pct}% du délai écoulé
          </p>
        </div>

        {/* Best score recap if we have one */}
        {best && (
          <div className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-ink-850 ring-1 ring-inset ring-ink-700/10 px-4 py-3">
            <span className="inline-grid h-9 w-9 place-items-center rounded-full bg-amber-400/20">
              <Trophy className="h-4 w-4 text-amber-700" strokeWidth={2.6} />
            </span>
            <div className="text-left">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-mist-400">
                Ton meilleur score
              </p>
              <p className="font-display text-[18px] font-black text-mist-50 leading-tight">
                {Math.round(best.score.final)} / 100
              </p>
            </div>
          </div>
        )}

        {/* Footer help */}
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          <Link
            href={`/ranking/${bank.professionId}`}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-night-700 hover:bg-night-600 px-4 text-[12.5px] font-bold uppercase tracking-[0.04em] text-white transition"
          >
            Voir le classement
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.8} />
          </Link>
          <Link
            href="/qcm"
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white hover:bg-ink-850 ring-1 ring-inset ring-ink-700/15 px-4 text-[12.5px] font-bold uppercase tracking-[0.04em] text-mist-100 transition"
          >
            Autre métier
          </Link>
        </div>

        <p className="mt-8 text-[11.5px] text-mist-500 max-w-md mx-auto">
          <Shield className="inline-block h-3 w-3 mr-1 -mt-0.5" strokeWidth={2.6} />
          Le cooldown garantit qu&apos;un score reflète une vraie expertise, pas un spam de tentatives.
        </p>
      </div>
    </div>
  );
}
