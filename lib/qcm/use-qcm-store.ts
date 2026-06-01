"use client";

// TalentRank — Hook unifié auth-vs-anon pour le QCM
// ----------------------------------------------------------------------------
// Décision à chaud :
//   - User authentifié    → Supabase (lib/qcm/store.ts), enforcement DB
//   - User anonyme (démo) → localStorage (lib/qcm/session.ts), démo home
//
// Le composant UI consomme une seule API, ce hook fait le routing.

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useBrowserFingerprint } from "@/lib/anti-cheat/fingerprint";
import {
  canStartQcm as supaCanStart,
  commitAnswer as supaCommit,
  finalizeAttempt as supaFinalize,
  getCurrentAttempt as supaGetCurrent,
  getExposedQuestionIds as supaGetExposed,
  startAttempt as supaStartAttempt,
  type CanStartResult,
  type CommitAnswerResult,
  type FinalizeResult,
} from "./store";
import {
  clearCurrentAttempt as localClearCurrent,
  COOLDOWN_MS,
  finalizeAttempt as localFinalize,
  getCooldownExpiresAt as localGetCooldown,
  getCurrentAttempt as localGetCurrent,
  saveCurrentAttempt as localSave,
  subscribeCooldown as localSubCooldown,
} from "./session";
import { makeSeed } from "./registry";
import type { Attempt, CheatFlag, Question, ScoreBreakdown } from "./types";

// ─── Hook ─────────────────────────────────────────────────────────────────

export type QcmMode = "auth" | "anon" | "loading";

export interface QcmGateState {
  mode: QcmMode;
  allowed: boolean;
  reason?: CanStartResult["reason"];
  expiresAt?: number;   // epoch ms uniforme (converti depuis ISO côté Supabase)
  attemptId?: string;
  scope?: CanStartResult["scope"];
}

/** Détermine si on est en mode auth (= Supabase) ou anon (= localStorage). */
export function useQcmMode(): QcmMode {
  const [mode, setMode] = useState<QcmMode>("loading");

  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setMode(data.user ? "auth" : "anon");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setMode(session?.user ? "auth" : "anon");
    });
    return () => {
      cancelled = true;
      sub?.subscription.unsubscribe();
    };
  }, []);

  return mode;
}

/** Compute le gate (cooldown / lockout / in_progress) pour un métier donné.
 *  En mode auth, le fingerprint browser est passé à can_start_qcm pour
 *  rattraper les contournements multi-browser. */
export function useQcmGate(professionId: string): QcmGateState {
  const mode = useQcmMode();
  const fingerprint = useBrowserFingerprint();
  const [gate, setGate] = useState<QcmGateState>({ mode: "loading", allowed: false });

  useEffect(() => {
    if (mode === "loading") return;
    // En auth, on attend le fingerprint avant de query — sinon on perd le
    // bénéfice anti-cheat. En anon, le fingerprint est ignoré.
    if (mode === "auth" && fingerprint === null) return;

    let cancelled = false;
    async function refresh() {
      if (mode === "auth") {
        try {
          const res = await supaCanStart(professionId, fingerprint);
          if (cancelled) return;
          setGate({
            mode: "auth",
            allowed: res.allowed,
            reason: res.reason,
            expiresAt: res.expiresAt ? Date.parse(res.expiresAt) : undefined,
            attemptId: res.attemptId,
            scope: res.scope,
          });
        } catch (err) {
          console.error("can_start_qcm failed:", err);
          if (cancelled) return;
          setGate({ mode: "auth", allowed: false, reason: "not_authenticated" });
        }
      } else {
        // Anon : localStorage
        const ts = localGetCooldown(professionId);
        if (cancelled) return;
        setGate({
          mode: "anon",
          allowed: ts === null,
          reason: ts !== null ? "cooldown" : undefined,
          expiresAt: ts ?? undefined,
        });
      }
    }

    refresh();
    if (mode === "anon") {
      return localSubCooldown(refresh);
    }
    return () => {
      cancelled = true;
    };
  }, [mode, professionId, fingerprint]);

  return gate;
}

// ─── Actions ──────────────────────────────────────────────────────────────

export interface StartArgs {
  bank: { professionId: string; questions: Question[] };
  selectedQuestions: Question[];
  declaredYears: number;
  /** Optionnel : passe un seed déjà utilisé pour selectQuestions/shuffleOptions
   *  côté caller, pour que la DB soit cohérente avec le rendu Briefing. */
  seed?: string;
}

export interface StartResult {
  attemptId: string;
  seed: string;
}

/** Démarre un attempt. Mode auth → Supabase RPC. Mode anon → localStorage. */
export function useQcmStartAttempt(): (args: StartArgs) => Promise<StartResult> {
  const mode = useQcmMode();
  const fingerprint = useBrowserFingerprint();
  return useCallback(
    async (args) => {
      const seed = args.seed ?? makeSeed();
      if (mode === "auth") {
        // Construire option_orders : pour chaque Q servie, l'ordre courant
        // des options (déjà shuffled par selectQuestions + shuffleOptions).
        const optionOrders: Record<string, string[]> = {};
        for (const q of args.selectedQuestions) {
          optionOrders[q.id] = q.options.map((o) => o.id);
        }
        const attemptId = await supaStartAttempt({
          professionId: args.bank.professionId,
          declaredYears: args.declaredYears,
          seed,
          questionIds: args.selectedQuestions.map((q) => q.id),
          optionOrders,
          fingerprintHash: fingerprint,
        });
        return { attemptId, seed };
      }
      // Anon → localStorage (utilise le même seed que la sélection caller)
      const attempt: Attempt = {
        id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        professionId: args.bank.professionId,
        talentId: "anonymous",
        declaredYears: args.declaredYears,
        questionIds: args.selectedQuestions.map((q) => q.id),
        answers: [],
        startedAt: Date.now(),
        finishedAt: null,
        seed, // partagé avec selectQuestions / shuffleOptions
      };
      localSave(attempt);
      return { attemptId: attempt.id, seed };
    },
    [mode],
  );
}

export interface CommitArgs {
  attemptId: string;
  question: Question;
  optionId: string | null;
  durationMs: number;
  pasteCount: number;
  visibilityBreaks: number;
  /** Pour le mode anon : on a besoin de l'attempt local en mémoire. */
  localAttempt?: Attempt | null;
}

/** Commit une réponse. Retourne is_correct + correct_option_id pour le reveal. */
export function useQcmCommit(): (args: CommitArgs) => Promise<CommitAnswerResult> {
  const mode = useQcmMode();
  return useCallback(
    async (args) => {
      if (mode === "auth") {
        return await supaCommit({
          attemptId: args.attemptId,
          questionId: args.question.id,
          optionId: args.optionId,
          durationMs: args.durationMs,
          pasteCount: args.pasteCount,
          visibilityBreaks: args.visibilityBreaks,
        });
      }
      // Anon : on a la correctness dans le bundle (mode démo, acceptable)
      const correctOption = args.question.options.find((o) => o.correct);
      const isCorrect =
        args.optionId !== null && correctOption?.id === args.optionId;
      // Persist locally
      if (args.localAttempt) {
        const updated: Attempt = {
          ...args.localAttempt,
          answers: [
            ...args.localAttempt.answers,
            {
              questionId: args.question.id,
              optionId: args.optionId,
              durationMs: args.durationMs,
              correct: isCorrect,
              pasteCount: args.pasteCount,
              visibilityBreaks: args.visibilityBreaks,
            },
          ],
        };
        localSave(updated);
      }
      return {
        isCorrect,
        correctOptionId: correctOption?.id ?? "",
      };
    },
    [mode],
  );
}

export interface FinalizeArgs {
  attemptId: string;
  attempt: Attempt;
  bankQuestions: Question[];
  breakdown: ScoreBreakdown;
  flags: CheatFlag[];
  cheatPenalty: number;
}

/** Finalize un attempt. Pose la cooldown server-side (auth) ou local (anon). */
export function useQcmFinalize(): (args: FinalizeArgs) => Promise<FinalizeResult | null> {
  const mode = useQcmMode();
  return useCallback(
    async (args) => {
      if (mode === "auth") {
        return await supaFinalize({
          attemptId: args.attemptId,
          finalScore: args.breakdown.final,
          cheatPenalty: args.cheatPenalty,
          breakdown: args.breakdown,
          flags: args.flags,
          cooldownDays: 30,
        });
      }
      // Anon : localStorage classique
      localFinalize(args.attempt, args.bankQuestions);
      return null;
    },
    [mode],
  );
}

// ─── Resume helpers ───────────────────────────────────────────────────────

export interface ResumeData {
  attemptId: string;
  attempt: Attempt;   // shape unifiée pour le composant UI
}

export function useQcmResume(professionId: string): {
  loading: boolean;
  data: ResumeData | null;
  refetch: () => void;
} {
  const mode = useQcmMode();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ResumeData | null>(null);

  const refetch = useCallback(() => {
    setLoading(true);
    if (mode === "loading") return;
    if (mode === "auth") {
      supaGetCurrent(professionId).then((cur) => {
        if (!cur) {
          setData(null);
        } else {
          const attempt: Attempt = {
            id: cur.attemptId,
            professionId,
            talentId: "auth",
            declaredYears: 0,
            questionIds: cur.questionIds,
            answers: cur.answers,
            startedAt: Date.now(),
            finishedAt: null,
            seed: "",
          };
          setData({ attemptId: cur.attemptId, attempt });
        }
        setLoading(false);
      });
    } else {
      const cur = localGetCurrent(professionId);
      setData(cur ? { attemptId: cur.id, attempt: cur } : null);
      setLoading(false);
    }
  }, [mode, professionId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { loading, data, refetch };
}

// Re-exports utiles
export { COOLDOWN_MS, localClearCurrent, supaGetExposed as getExposedQuestionIds };
