"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { Check, ChevronRight, Flame, Sparkles, Trophy, X, Zap } from "lucide-react";
import { shuffleOptions } from "@/lib/qcm/registry";
import { scoreAttempt } from "@/lib/qcm/scoring";
import {
  useQcmCommit,
  useQcmFinalize,
  useQcmResume,
} from "@/lib/qcm/use-qcm-store";
import {
  DIFFICULTY_LABEL,
  DIFFICULTY_WEIGHT,
  type AnswerRecord,
  type Attempt,
  type QcmBank,
  type Question,
} from "@/lib/qcm/types";
import { cn } from "@/lib/utils";

interface Props {
  bank: QcmBank;
}

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner: "#94A3B8",
  intermediate: "#1CB0F6",
  advanced: "#58CC02",
  expert: "#FF8A00",
};

// XP gain per correct answer = difficulty weight × 10
// beginner: +10 · intermediate: +20 · advanced: +35 · expert: +60
function xpFor(q: Question): number {
  return Math.round(DIFFICULTY_WEIGHT[q.difficulty] * 10);
}

const STREAK_MILESTONES = [3, 5, 10];

// ─────────────────────────────────────────────────────────────────────────────
// QCM gameplay — competitive feel.
//   - Timer bar at the top of the card, drains over expectedSeconds, shifts
//     green → yellow → red as time depletes (and pulses red past the limit).
//   - XP counter in the top bar, animates up when a correct answer commits.
//   - Streak milestones (3 / 5 / 10) trigger a fullscreen burst.
//   - Validation badge (EXACT! / RATÉ) slides in on reveal.
//   - Wrong answers shake the question card briefly.
// All purely visual — the underlying scoring formula in lib/qcm/scoring.ts
// already accounts for response time via the reliability dimension.
// ─────────────────────────────────────────────────────────────────────────────

export function QcmPlayClient({ bank }: Props) {
  const router = useRouter();
  // attemptId est l'UUID Supabase (mode auth) ou l'id local (mode anon).
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [serverCorrectId, setServerCorrectId] = useState<string | null>(null);
  const [xp, setXp] = useState(0);
  const [xpPop, setXpPop] = useState<number | null>(null);
  const [milestone, setMilestone] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);
  const [committing, setCommitting] = useState(false);

  // Anti-cheat signals
  const questionShownAtRef = useRef<number>(Date.now());
  const pasteCountRef = useRef(0);
  const visibilityBreaksRef = useRef(0);

  // Animated XP counter (smooth transition between numbers)
  const xpMotion = useMotionValue(0);
  const xpDisplay = useTransform(xpMotion, (v) => Math.round(v));

  // Store hooks (auth-aware : Supabase si user, localStorage sinon)
  const resume = useQcmResume(bank.professionId);
  const commitToStore = useQcmCommit();
  const finalizeToStore = useQcmFinalize();

  // ── Bootstrap : reprend l'attempt en cours via le store ──────────────────
  useEffect(() => {
    if (resume.loading) return;
    if (!resume.data) {
      router.replace(`/qcm/${bank.professionId}`);
      return;
    }
    const cur = resume.data.attempt;
    const qById = new Map(bank.questions.map((q) => [q.id, q]));
    const orderedQuestions = cur.questionIds
      .map((id) => qById.get(id))
      .filter((q): q is Question => !!q)
      .map((q) => shuffleOptions(q, cur.seed || resume.data!.attemptId));
    setAttempt(cur);
    setAttemptId(resume.data.attemptId);
    setQuestions(orderedQuestions);
    setIndex(Math.min(cur.answers.length, orderedQuestions.length));
    // Reconstituer XP / streak depuis l'historique de réponses
    let totalXp = 0;
    let runStreak = 0;
    for (const a of cur.answers) {
      const q = qById.get(a.questionId);
      if (a.correct && q) {
        totalXp += xpFor(q);
        runStreak += 1;
      } else {
        runStreak = 0;
      }
    }
    setXp(totalXp);
    setStreak(runStreak);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bank.professionId, resume.loading, resume.data]);

  // ── Reset per-question state ──────────────────────────────────────────────
  useEffect(() => {
    questionShownAtRef.current = Date.now();
    pasteCountRef.current = 0;
    visibilityBreaksRef.current = 0;
    setSelectedOptionId(null);
    setRevealed(false);
    setFeedback(null);
    setElapsedMs(0);
  }, [index]);

  // ── Timer tick (only while answering) ─────────────────────────────────────
  useEffect(() => {
    if (revealed) return;
    const t = setInterval(() => {
      setElapsedMs(Date.now() - questionShownAtRef.current);
    }, 100);
    return () => clearInterval(t);
  }, [index, revealed]);

  // ── XP smooth animation ───────────────────────────────────────────────────
  useEffect(() => {
    const controls = xpMotion.set;
    void controls;
    const start = xpMotion.get();
    const delta = xp - start;
    if (delta === 0) return;
    const startTime = Date.now();
    const dur = 700;
    let raf = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - startTime) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      xpMotion.set(start + delta * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [xp, xpMotion]);

  // ── Anti-cheat tab switch ─────────────────────────────────────────────────
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") visibilityBreaksRef.current += 1;
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const current = questions[index];

  // ── Commit answer ─────────────────────────────────────────────────────────
  // La correctness est calculée SERVER-SIDE (RPC commit_qcm_answer) en mode
  // auth ; en mode anon (démo), elle reste calculée client-side. Dans les
  // deux cas, on reçoit { isCorrect, correctOptionId } et on update l'UI.
  const commitAnswer = async (optionId: string | null) => {
    if (!attempt || !attemptId || !current || revealed || committing) return;
    setCommitting(true);

    const durationMs = Date.now() - questionShownAtRef.current;
    try {
      const result = await commitToStore({
        attemptId,
        question: current,
        optionId,
        durationMs,
        pasteCount: pasteCountRef.current,
        visibilityBreaks: visibilityBreaksRef.current,
        localAttempt: attempt,
      });

      const isCorrect = result.isCorrect;
      const record: AnswerRecord = {
        questionId: current.id,
        optionId,
        durationMs,
        correct: isCorrect,
        pasteCount: pasteCountRef.current,
        visibilityBreaks: visibilityBreaksRef.current,
      };
      const updatedAttempt: Attempt = {
        ...attempt,
        answers: [...attempt.answers, record],
      };
      setAttempt(updatedAttempt);
      setSelectedOptionId(optionId);
      setServerCorrectId(result.correctOptionId);
      setRevealed(true);
      setFeedback(isCorrect ? "correct" : "wrong");

      if (isCorrect) {
        const gain = xpFor(current);
        setXp((v) => v + gain);
        setXpPop(gain);
        setTimeout(() => setXpPop(null), 1400);
        setStreak((s) => {
          const next = s + 1;
          if (STREAK_MILESTONES.includes(next)) {
            setMilestone(next);
            setTimeout(() => setMilestone(null), 1600);
          }
          return next;
        });
      } else {
        setStreak(0);
        setShakeKey((k) => k + 1);
      }
    } catch (err) {
      console.error("commit_qcm_answer failed:", err);
      // On laisse le user re-cliquer
    } finally {
      setCommitting(false);
    }
  };

  // ── Advance ──────────────────────────────────────────────────────────────
  const advance = async () => {
    if (!attempt || !attemptId) return;
    const next = index + 1;
    if (next >= questions.length) {
      // Score côté Node (logique TS riche, gardée comme source de vérité du
      // détail). Le serveur revérifie l'intégrité via les is_correct stockés
      // en DB (via commit_qcm_answer) ; il accepte le breakdown final + flags.
      const finalAttempt: Attempt = { ...attempt, finishedAt: Date.now() };
      const breakdown = scoreAttempt(finalAttempt, bank.questions);
      try {
        await finalizeToStore({
          attemptId,
          attempt: finalAttempt,
          bankQuestions: bank.questions,
          breakdown,
          flags: breakdown.flags,
          cheatPenalty: breakdown.cheatPenalty,
        });
      } catch (err) {
        console.error("finalize_qcm_attempt failed:", err);
        // On continue quand même vers la page result (mode démo OK)
      }
      router.replace(`/qcm/${bank.professionId}/result`);
      return;
    }
    setIndex(next);
  };

  const total = questions.length;
  const progress = total === 0 ? 0 : (index / total) * 100;

  if (!attempt || !current) {
    return (
      <div className="container-page pt-28 pb-20 text-center">
        <p className="text-mist-400">Chargement de l&apos;évaluation…</p>
      </div>
    );
  }

  const correctOption = current.options.find((o) => o.correct);
  const expectedMs = current.expectedSeconds * 1000;
  const timeRatio = Math.min(1.3, elapsedMs / expectedMs); // can go above 1 (overtime)
  const secondsLeft = Math.max(0, Math.ceil((expectedMs - elapsedMs) / 1000));
  const timerColor =
    timeRatio < 0.5 ? "#58CC02" : timeRatio < 0.85 ? "#FFC800" : "#EF5350";
  const overtime = elapsedMs > expectedMs;

  return (
    <div className="container-page pt-16 pb-12 relative">
      {/* ─── Streak milestone fullscreen burst ───────────────────────────── */}
      <AnimatePresence>
        {milestone !== null && <MilestoneBurst value={milestone} />}
      </AnimatePresence>

      {/* ─── Top bar ─────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => {
              if (confirm("Quitter l'évaluation ? Ta progression sera conservée.")) {
                router.push(`/qcm/${bank.professionId}`);
              }
            }}
            className="grid h-10 w-10 place-items-center rounded-full bg-white ring-1 ring-inset ring-ink-700/15 text-mist-300 hover:text-mist-50 hover:bg-ink-850 transition shadow-card"
            aria-label="Quitter"
          >
            <X className="h-4 w-4" strokeWidth={2.4} />
          </button>

          {/* Step progress */}
          <div className="flex-1 mx-3">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink-800 ring-1 ring-inset ring-ink-700/8">
              <motion.div
                className="h-full bg-gradient-to-r from-duo-blue to-duo-green"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
            <p className="mt-1.5 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-mist-400 tabular-nums">
              Question {index + 1} / {total}
            </p>
          </div>

          {/* XP pill */}
          <div
            className="relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5"
            style={{
              background: "linear-gradient(180deg, #FFEAA0, #FFC800)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 0 #C99A00aa",
            }}
          >
            <Zap className="h-3.5 w-3.5 text-ink-950" strokeWidth={2.8} fill="#1B1208" />
            <motion.span className="font-display text-[13px] font-black tabular-nums text-ink-950">
              {xpDisplay}
            </motion.span>
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-950/70">
              XP
            </span>
            <AnimatePresence>
              {xpPop !== null && (
                <motion.span
                  initial={{ opacity: 0, y: 4, scale: 0.9 }}
                  animate={{ opacity: 1, y: -22, scale: 1 }}
                  exit={{ opacity: 0, y: -34 }}
                  transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
                  className="absolute left-1/2 -translate-x-1/2 -top-2 font-display text-[14px] font-black text-emerald-600 whitespace-nowrap pointer-events-none"
                  style={{ textShadow: "0 1px 0 rgba(255,255,255,0.8)" }}
                >
                  +{xpPop} XP
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Streak */}
          <AnimatePresence>
            {streak > 0 && (
              <motion.div
                key={streak}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5"
                style={{
                  background:
                    streak >= 5
                      ? "linear-gradient(180deg, #FF8A00, #D9442B)"
                      : "linear-gradient(180deg, #FFEAA0, #FFC800)",
                  boxShadow:
                    streak >= 5
                      ? "inset 0 1px 0 rgba(255,255,255,0.4), 0 2px 0 #8B2D0Eaa"
                      : "inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 0 #C99A00aa",
                }}
              >
                <Flame
                  className={cn("h-3.5 w-3.5", streak >= 5 ? "text-white" : "text-ink-950")}
                  strokeWidth={2.8}
                  fill={streak >= 5 ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.15)"}
                />
                <span
                  className={cn(
                    "font-display text-[13px] font-black tabular-nums",
                    streak >= 5 ? "text-white" : "text-ink-950",
                  )}
                >
                  {streak}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── Question card ────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-3xl mt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <motion.div
              key={`shake-${shakeKey}`}
              animate={
                shakeKey > 0 && feedback === "wrong"
                  ? { x: [-6, 6, -4, 4, -2, 0] }
                  : undefined
              }
              transition={{ duration: 0.45 }}
              className="relative rounded-[28px] bg-white ring-1 ring-inset ring-ink-700/10 p-7 sm:p-10 shadow-card overflow-hidden"
              onPaste={() => {
                pasteCountRef.current += 1;
              }}
            >
              {/* Timer bar at the top of the card */}
              <div className="absolute inset-x-0 top-0 h-1.5">
                <div className="h-full w-full bg-ink-800" />
                <motion.div
                  className="absolute inset-y-0 left-0"
                  animate={{
                    width: `${Math.min(100, (elapsedMs / expectedMs) * 100)}%`,
                    background: timerColor,
                    boxShadow: overtime ? `0 0 12px ${timerColor}` : "none",
                  }}
                  transition={{ ease: "linear", duration: 0.1 }}
                  style={{
                    height: "100%",
                  }}
                />
                {/* Pulse overlay when overtime */}
                {overtime && !revealed && (
                  <motion.div
                    className="absolute inset-0 bg-rose-400"
                    animate={{ opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 0.9, repeat: Infinity }}
                  />
                )}
              </div>

              {/* Top row: difficulty + axis + countdown */}
              <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.14em]"
                    style={{
                      background: `${DIFFICULTY_COLOR[current.difficulty]}22`,
                      color: DIFFICULTY_COLOR[current.difficulty],
                    }}
                  >
                    {DIFFICULTY_LABEL[current.difficulty].fr}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-ink-800 ring-1 ring-inset ring-ink-700/8 px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-mist-200">
                    {bank.axes.find((a) => a.id === current.axisId)?.frLabel ?? current.axisId}
                  </span>
                </div>
                {/* Countdown badge */}
                <motion.span
                  animate={overtime && !revealed ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                  transition={overtime && !revealed ? { duration: 0.8, repeat: Infinity } : { duration: 0 }}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1"
                  style={{
                    background: `${timerColor}22`,
                    color: timerColor,
                    boxShadow: `inset 0 0 0 1.5px ${timerColor}50`,
                  }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em]">
                    {overtime ? "Hors temps" : "Temps"}
                  </span>
                  <span className="font-display text-[14px] font-black tabular-nums leading-none">
                    {overtime ? `+${Math.ceil((elapsedMs - expectedMs) / 1000)}s` : `${secondsLeft}s`}
                  </span>
                </motion.span>
              </div>

              <h2 className="mt-5 font-display text-[20px] sm:text-[24px] font-bold leading-snug text-mist-50">
                {current.prompt}
              </h2>

              {current.code && (
                <pre className="mt-4 overflow-x-auto rounded-2xl bg-ink-850 ring-1 ring-inset ring-ink-700/15 p-4 text-[12.5px] font-mono text-mist-100">
                  <code>{current.code.content}</code>
                </pre>
              )}

              {/* Options */}
              <div className="mt-7 grid gap-2.5">
                {current.options.map((opt, i) => {
                  const isSelected = selectedOptionId === opt.id;
                  const isCorrect = revealed && opt.correct;
                  const isWrongPick = revealed && isSelected && !opt.correct;
                  return (
                    <motion.button
                      key={opt.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.04 }}
                      whileTap={!revealed && !committing ? { scale: 0.98 } : undefined}
                      disabled={revealed || committing}
                      onClick={() => commitAnswer(opt.id)}
                      className={cn(
                        "group flex items-center gap-3 rounded-2xl ring-2 px-4 py-3.5 text-left transition-all",
                        !revealed &&
                          "bg-ink-850 ring-ink-700/15 hover:bg-white hover:ring-cyan-400/40 hover:-translate-y-[1px] shadow-card",
                        isCorrect &&
                          "bg-emerald-50 ring-emerald-400 text-emerald-900 shadow-[0_0_0_4px_rgba(88,204,2,0.18)]",
                        isWrongPick &&
                          "bg-rose-50 ring-rose-400 text-rose-900",
                        revealed && !isSelected && !opt.correct &&
                          "bg-ink-850/60 ring-ink-700/8 opacity-55",
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-9 w-9 place-items-center rounded-xl font-display text-[13px] font-bold shrink-0",
                          isCorrect
                            ? "bg-emerald-500 text-white"
                            : isWrongPick
                            ? "bg-rose-500 text-white"
                            : "bg-white ring-1 ring-inset ring-ink-700/15 text-mist-100",
                        )}
                      >
                        {isCorrect ? (
                          <Check className="h-4 w-4" strokeWidth={3} />
                        ) : isWrongPick ? (
                          <X className="h-4 w-4" strokeWidth={3} />
                        ) : (
                          opt.id.toUpperCase()
                        )}
                      </span>
                      <span className="flex-1 text-[14px] leading-snug">{opt.text}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Validation badge — slides in on reveal */}
              <AnimatePresence>
                {revealed && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 380, damping: 24 }}
                    className={cn(
                      "mt-6 rounded-2xl p-4 ring-1 flex items-start gap-3",
                      feedback === "correct"
                        ? "bg-emerald-50 ring-emerald-400/60"
                        : "bg-rose-50 ring-rose-400/60",
                    )}
                  >
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1, rotate: feedback === "correct" ? [0, -8, 8, 0] : 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 18 }}
                      className={cn(
                        "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                        feedback === "correct"
                          ? "bg-emerald-500 text-white"
                          : "bg-rose-500 text-white",
                      )}
                    >
                      {feedback === "correct" ? (
                        <Check className="h-5 w-5" strokeWidth={3} />
                      ) : (
                        <X className="h-5 w-5" strokeWidth={3} />
                      )}
                    </motion.span>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "font-display text-[15px] font-black tracking-tight",
                          feedback === "correct" ? "text-emerald-900" : "text-rose-900",
                        )}
                      >
                        {feedback === "correct" ? "EXACT !" : "PAS ENCORE"}
                        {feedback === "correct" && (
                          <span className="ml-2 text-[12.5px] font-bold text-emerald-700">
                            +{xpFor(current)} XP
                          </span>
                        )}
                      </p>
                      {correctOption?.explanation && (
                        <p
                          className={cn(
                            "mt-1.5 text-[13px] leading-relaxed",
                            feedback === "correct" ? "text-emerald-800" : "text-rose-800",
                          )}
                        >
                          {correctOption.explanation}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom CTA */}
              <div className="mt-7 flex items-center justify-between gap-3">
                {!revealed ? (
                  <p className="text-[11.5px] text-mist-400">
                    Une seule réponse · pas de retour en arrière.
                  </p>
                ) : (
                  <p className="text-[11.5px] text-mist-400">
                    {index + 1 < total ? "Question suivante →" : "Voir tes résultats →"}
                  </p>
                )}
                {revealed && (
                  <motion.button
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    onClick={advance}
                    className="inline-flex h-11 items-center gap-1.5 rounded-full bg-gradient-to-b from-duo-blue to-[#1A9DDB] text-white font-bold uppercase tracking-[0.04em] text-[12.5px] px-5 border-b-[3px] border-duo-blue-deep transition-all hover:brightness-105 active:translate-y-[2px] active:border-b-[1px]"
                  >
                    {index + 1 < total ? "Continuer" : "Voir mon score"}
                    <ChevronRight className="h-4 w-4" strokeWidth={2.6} />
                  </motion.button>
                )}
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Milestone burst overlay (fullscreen-ish, 1.6s) ─────────────────────────
function MilestoneBurst({ value }: { value: number }) {
  const label = value >= 10 ? "EN FEU !" : value >= 5 ? "ENCHAÎNEMENT !" : "STREAK !";
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pointer-events-none fixed inset-0 z-40 grid place-items-center"
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        exit={{ scale: 1.2, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 18 }}
        className="relative grid place-items-center rounded-[40px] px-12 py-9"
        style={{
          background: "linear-gradient(180deg, #FFC800, #FF8A00)",
          boxShadow:
            "inset 0 4px 0 rgba(255,255,255,0.5), inset 0 -16px 32px -8px rgba(0,0,0,0.35), 0 30px 70px -10px rgba(255,138,0,0.7)",
        }}
      >
        <Flame className="absolute -top-7 -left-6 h-12 w-12 text-white drop-shadow-md" strokeWidth={2.4} fill="rgba(255,255,255,0.4)" />
        <Trophy className="absolute -bottom-5 -right-5 h-10 w-10 text-white drop-shadow-md" strokeWidth={2.4} />
        <div className="text-center">
          <p className="font-display text-[14px] font-black uppercase tracking-[0.2em] text-white/90">
            {label}
          </p>
          <p className="mt-1 font-display text-[64px] font-black leading-none text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.35)]">
            ×{value}
          </p>
          <p className="mt-1 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-white/85">
            Bonnes réponses d&apos;affilée
          </p>
        </div>
      </motion.div>

      {/* Sparkle ring */}
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <motion.span
            key={i}
            className="absolute"
            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={{
              x: Math.cos(angle) * 180,
              y: Math.sin(angle) * 180,
              opacity: [0, 1, 0],
              scale: [0, 1, 0.7],
            }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <Sparkles className="h-7 w-7 text-amber-300 drop-shadow-md" strokeWidth={2.6} />
          </motion.span>
        );
      })}
    </motion.div>
  );
}

// Re-export to keep tree-shaking honest (useMemo currently unused after refactor).
void useMemo;
