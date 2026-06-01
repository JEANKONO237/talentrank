"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminOrNull } from "./auth";

// ─────────────────────────────────────────────────────────────────────────────
// Admin server actions — review queue, voiding scores, manual lockouts.
//
// Toutes les actions :
//   1. Vérifient is_admin (defense-in-depth en plus de la RLS DB).
//   2. Insèrent un audit trail dans qcm_flags.reviewed_by + reviewed_at.
//   3. Revalidate /admin/flags pour rafraîchir la liste après l'action.
//
// Retour : { ok: boolean, error?: string } pour permettre un toast côté client.
// ─────────────────────────────────────────────────────────────────────────────

export interface ActionResult {
  ok: boolean;
  error?: string;
}

// ─── 1. Review a flag (mark as confirmed / dismissed / reviewed) ──────────

export async function reviewFlag(
  flagId: string,
  status: "reviewed" | "confirmed" | "dismissed",
  note?: string,
): Promise<ActionResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Forbidden" };

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("qcm_flags")
    .update({
      review_status: status,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
      review_note: note ?? null,
    })
    .eq("id", flagId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/flags");
  return { ok: true };
}

// ─── 2. Bulk : approve plusieurs flags d'un coup ──────────────────────────

export async function bulkReviewFlags(
  flagIds: string[],
  status: "reviewed" | "confirmed" | "dismissed",
): Promise<ActionResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Forbidden" };
  if (flagIds.length === 0) return { ok: true };

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("qcm_flags")
    .update({
      review_status: status,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    })
    .in("id", flagIds);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/flags");
  return { ok: true };
}

// ─── 3. Void a QCM attempt (annule le score, retire du classement) ────────
// Cas typique : flag confirmed = triche → on annule l'attempt qui a généré
// le qcm_results. La cooldown reste (le user ne peut pas re-tenter immédia-
// tement, sinon ce serait abusé).

export async function voidQcmAttempt(
  attemptId: string,
  reason: string,
): Promise<ActionResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Forbidden" };

  const supabase = await getSupabaseServerClient();

  // Marque l'attempt comme abandonné (pas completed) → ne compte plus dans
  // les rankings via les vues qui filtrent sur status='completed'.
  const { error: e1 } = await supabase
    .from("qcm_attempts")
    .update({
      status: "abandoned",
      final_score: null,
      breakdown: { voided: true, voided_by: admin.id, reason },
    })
    .eq("id", attemptId);
  if (e1) return { ok: false, error: e1.message };

  // Retire la ligne qcm_results si elle pointe vers cet attempt
  const { error: e2 } = await supabase
    .from("qcm_results")
    .delete()
    .eq("attempt_id", attemptId);
  if (e2) return { ok: false, error: e2.message };

  // Trace l'événement dans score_events (audit trail global)
  const { data: attempt } = await supabase
    .from("qcm_attempts")
    .select("talent_id")
    .eq("id", attemptId)
    .maybeSingle();
  if (attempt) {
    await supabase.from("score_events").insert({
      talent_id: attempt.talent_id,
      factor: "qcm_voided",
      reason: `Admin ${admin.id}: ${reason}`,
    });
  }

  revalidatePath("/admin/flags");
  return { ok: true };
}

// ─── 4. Manual lockout — admin pose un blocage manuel ─────────────────────

export async function lockoutUser(args: {
  talentId?: string;
  fingerprintHash?: string;
  ipHash?: string;
  professionId?: string;
  durationDays: number;
  reason: string;
}): Promise<ActionResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Forbidden" };

  // Au moins une clé requise (matche la contrainte SQL)
  if (!args.talentId && !args.fingerprintHash && !args.ipHash) {
    return { ok: false, error: "Au moins une clé (user/fp/ip) requise." };
  }

  const supabase = await getSupabaseServerClient();
  const expiresAt = new Date(
    Date.now() + args.durationDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { error } = await supabase.from("qcm_lockouts").insert({
    talent_id: args.talentId ?? null,
    fingerprint_hash: args.fingerprintHash ?? null,
    ip_hash: args.ipHash ?? null,
    profession_id: args.professionId ?? null,
    expires_at: expiresAt,
    reason: args.reason,
    created_by: admin.id,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/flags");
  return { ok: true };
}

// ─── 5. Lift un lockout ───────────────────────────────────────────────────

export async function liftLockout(lockoutId: string): Promise<ActionResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Forbidden" };

  const supabase = await getSupabaseServerClient();
  // On ne delete pas — on raccourcit expires_at à now() pour préserver l'audit
  const { error } = await supabase
    .from("qcm_lockouts")
    .update({ expires_at: new Date().toISOString() })
    .eq("id", lockoutId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/flags");
  return { ok: true };
}

// ─── 6. Mark question as compromised ──────────────────────────────────────
// Quand un admin voit qu'une question a fuité (Reddit, Twitter, etc.), il
// la marque compromised → le selector l'exclut automatiquement.

export async function markQuestionCompromised(
  questionId: string,
  reason: string,
): Promise<ActionResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, error: "Forbidden" };

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("qcm_answer_keys")
    .update({
      is_compromised: true,
      compromised_at: new Date().toISOString(),
      compromised_reason: reason,
    })
    .eq("question_id", questionId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/flags");
  return { ok: true };
}
