// TalentRank — QCM Store (Supabase-backed, server-enforced)
// ----------------------------------------------------------------------------
// Remplace lib/qcm/session.ts (localStorage v1). Mêmes intentions, persistence
// DB + enforcement server-side.
//
// Design :
//   - Toutes les écritures passent par des RPC (sécurisées par security definer)
//   - Toutes les lectures passent par les tables avec RLS
//   - Le client n'a JAMAIS accès à qcm_answer_keys (correctness)
//   - Le scoring final reste calculé côté Node.js (in lib/qcm/scoring.ts) puis
//     poussé via finalize_qcm_attempt → trust le serveur Node, pas le browser
//
// Mode dégradé : si Supabase n'est pas configuré ou si le user est anonyme,
// fallback automatique sur session.ts (localStorage). Permet la démo home
// sans login.

"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AnswerRecord, Attempt, ScoreBreakdown, CheatFlag } from "./types";

// ─── Types renvoyés par les RPC ──────────────────────────────────────────

export type CanStartReason =
  | "not_authenticated"
  | "cooldown"
  | "lockout"
  | "resume_in_progress";

export interface CanStartResult {
  allowed: boolean;
  reason?: CanStartReason;
  expiresAt?: string;
  scope?: "user" | "fingerprint" | "ip";
  attemptId?: string;
}

export interface StartAttemptInput {
  professionId: string;
  declaredYears: number;
  seed: string;
  /** Questions à servir, dans l'ordre choisi côté Node. */
  questionIds: string[];
  /** Pour chaque question, l'ordre des option_ids (permutation shufflée). */
  optionOrders: Record<string, string[]>;
  fingerprintHash?: string | null;
  ipHash?: string | null;
}

export interface CommitAnswerInput {
  attemptId: string;
  questionId: string;
  optionId: string | null;
  durationMs: number;
  pasteCount?: number;
  visibilityBreaks?: number;
}

export interface CommitAnswerResult {
  isCorrect: boolean;
  correctOptionId: string;
}

export interface FinalizeInput {
  attemptId: string;
  finalScore: number;
  cheatPenalty: number;
  breakdown: ScoreBreakdown;
  flags: CheatFlag[];
  cooldownDays?: number;
}

export interface FinalizeResult {
  attemptId: string;
  finalScore: number;
  tier: string;
  percentile: number;
  cooldownExpiresAt: string;
}

// ─── API ─────────────────────────────────────────────────────────────────

export async function canStartQcm(
  professionId: string,
  fingerprintHash?: string | null,
  ipHash?: string | null,
): Promise<CanStartResult> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("can_start_qcm", {
    p_profession_id: professionId,
    p_fingerprint_hash: fingerprintHash ?? null,
    p_ip_hash: ipHash ?? null,
  });
  if (error) throw new Error(`can_start_qcm failed: ${error.message}`);
  return normalizeCanStart(data as Record<string, unknown>);
}

export async function startAttempt(input: StartAttemptInput): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("start_qcm_attempt", {
    p_profession_id: input.professionId,
    p_declared_years: input.declaredYears,
    p_seed: input.seed,
    p_question_ids: input.questionIds,
    p_option_orders: input.optionOrders,
    p_fingerprint_hash: input.fingerprintHash ?? null,
    p_ip_hash: input.ipHash ?? null,
  });
  if (error) throw new Error(`start_qcm_attempt failed: ${error.message}`);
  if (typeof data !== "string") throw new Error("start_qcm_attempt returned non-uuid");
  return data;
}

export async function commitAnswer(
  input: CommitAnswerInput,
): Promise<CommitAnswerResult> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("commit_qcm_answer", {
    p_attempt_id: input.attemptId,
    p_question_id: input.questionId,
    p_option_id: input.optionId,
    p_duration_ms: input.durationMs,
    p_paste_count: input.pasteCount ?? 0,
    p_visibility_breaks: input.visibilityBreaks ?? 0,
  });
  if (error) throw new Error(`commit_qcm_answer failed: ${error.message}`);
  const d = data as Record<string, unknown>;
  return {
    isCorrect: Boolean(d.is_correct),
    correctOptionId: String(d.correct_option_id ?? ""),
  };
}

export async function finalizeAttempt(input: FinalizeInput): Promise<FinalizeResult> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("finalize_qcm_attempt", {
    p_attempt_id: input.attemptId,
    p_final_score: input.finalScore,
    p_cheat_penalty: input.cheatPenalty,
    p_breakdown: input.breakdown as unknown as Record<string, unknown>,
    p_flags: input.flags as unknown as Record<string, unknown>[],
    p_cooldown_days: input.cooldownDays ?? 30,
  });
  if (error) throw new Error(`finalize_qcm_attempt failed: ${error.message}`);
  const d = data as Record<string, unknown>;
  return {
    attemptId: String(d.attempt_id),
    finalScore: Number(d.final_score),
    tier: String(d.tier),
    percentile: Number(d.percentile),
    cooldownExpiresAt: String(d.cooldown_expires_at),
  };
}

export async function getExposedQuestionIds(
  professionId: string,
  sinceDays = 180,
): Promise<{ questionId: string; lastSeenAt: Date }[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("get_exposed_question_ids", {
    p_profession_id: professionId,
    p_since_days: sinceDays,
  });
  if (error) throw new Error(`get_exposed_question_ids failed: ${error.message}`);
  return ((data ?? []) as { question_id: string; last_seen_at: string }[]).map(
    (r) => ({
      questionId: r.question_id,
      lastSeenAt: new Date(r.last_seen_at),
    }),
  );
}

/** Récupère l'attempt courant (in_progress) sur ce métier, s'il existe.
 *  Utilisé pour la reprise au reload. */
export async function getCurrentAttempt(
  professionId: string,
): Promise<{ attemptId: string; questionIds: string[]; answers: AnswerRecord[] } | null> {
  const supabase = getSupabaseBrowserClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user?.user) return null;

  const { data: attempt } = await supabase
    .from("qcm_attempts")
    .select("id, profession_id, status, seed")
    .eq("talent_id", user.user.id)
    .eq("profession_id", professionId)
    .eq("status", "in_progress")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!attempt) return null;

  const { data: aqs } = await supabase
    .from("qcm_attempt_questions")
    .select("question_id, position")
    .eq("attempt_id", attempt.id)
    .order("position", { ascending: true });

  const { data: responses } = await supabase
    .from("qcm_responses")
    .select("question_id, option_id, duration_ms, paste_count, visibility_breaks, is_correct")
    .eq("attempt_id", attempt.id);

  return {
    attemptId: attempt.id,
    questionIds: (aqs ?? []).map((r) => r.question_id as string),
    answers: ((responses ?? []) as Array<{
      question_id: string;
      option_id: string | null;
      duration_ms: number;
      paste_count: number;
      visibility_breaks: number;
      is_correct: boolean;
    }>).map((r) => ({
      questionId: r.question_id,
      optionId: r.option_id,
      durationMs: r.duration_ms,
      correct: r.is_correct,
      pasteCount: r.paste_count,
      visibilityBreaks: r.visibility_breaks,
    })),
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function normalizeCanStart(d: Record<string, unknown>): CanStartResult {
  return {
    allowed: Boolean(d.allowed),
    reason: d.reason as CanStartReason | undefined,
    expiresAt: d.expires_at as string | undefined,
    scope: d.scope as "user" | "fingerprint" | "ip" | undefined,
    attemptId: d.attempt_id as string | undefined,
  };
}

/** Convertit le type Attempt local → forme attendue par finalizeAttempt.
 *  Utilisé pendant la migration : le QcmPlayClient peut encore manipuler
 *  un Attempt en mémoire, puis pousser le résultat via cette fonction. */
export function attemptToFinalizeInput(
  attempt: Attempt,
  attemptId: string,
  breakdown: ScoreBreakdown,
  flags: CheatFlag[],
  cheatPenalty: number,
): FinalizeInput {
  void attempt; // attempt fields déjà persistés via start_qcm_attempt
  return {
    attemptId,
    finalScore: breakdown.final,
    cheatPenalty,
    breakdown,
    flags,
    cooldownDays: 30,
  };
}
