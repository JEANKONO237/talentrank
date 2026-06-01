"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { rpc } from "@/lib/supabase/rpc";
import type { ActionResult } from "./auth";

const sendSchema = z.object({
  studio_id: z.string().uuid(),
  talent_id: z.string().uuid(),
  role_title: z.string().min(2).max(120),
  message: z.string().max(2000).optional().nullable(),
  contract_type: z
    .enum(["fulltime", "freelance", "studio", "internship", "apprenticeship", "any"])
    .default("fulltime"),
  work_mode: z.enum(["remote", "hybrid", "onsite"]).default("hybrid"),
  location: z.string().max(120).optional().nullable(),
  start_date_earliest: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  start_date_latest: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  salary_min: z.coerce.number().int().min(0).optional().nullable(),
  salary_max: z.coerce.number().int().min(0).optional().nullable(),
  salary_currency: z.string().length(3).default("EUR"),
  expires_at: z.string().optional().nullable(),
});

export async function sendInterviewProposal(input: z.infer<typeof sendSchema>): Promise<ActionResult<{ id: string }>> {
  const parsed = sendSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const supabase = await getSupabaseServerClient();
  const { data, error } = await rpc(supabase, "send_interview_proposal", {
    p_studio_id: parsed.data.studio_id,
    p_talent_id: parsed.data.talent_id,
    p_role_title: parsed.data.role_title,
    p_message: parsed.data.message ?? null,
    p_contract_type: parsed.data.contract_type,
    p_work_mode: parsed.data.work_mode,
    p_location: parsed.data.location ?? null,
    p_start_earliest: parsed.data.start_date_earliest ?? null,
    p_start_latest: parsed.data.start_date_latest ?? null,
    p_salary_min: parsed.data.salary_min ?? null,
    p_salary_max: parsed.data.salary_max ?? null,
    p_currency: parsed.data.salary_currency,
    p_expires_at: parsed.data.expires_at ?? null,
  });
  if (error || !data) return { ok: false, error: error?.message ?? "Failed to send" };

  revalidatePath("/messages");
  revalidatePath("/dashboard/talent");
  revalidatePath("/dashboard/recruiter");
  return { ok: true, data: { id: data as string } };
}

export async function acceptProposal(proposalId: string): Promise<ActionResult<{ conversation_id: string }>> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await rpc(supabase, "accept_interview_proposal", { p_proposal_id: proposalId });
  if (error || !data) return { ok: false, error: error?.message ?? "Failed to accept" };
  revalidatePath("/messages");
  return { ok: true, data: { conversation_id: data as string } };
}

export async function declineProposal(proposalId: string, reason?: string): Promise<ActionResult> {
  const supabase = await getSupabaseServerClient();
  const { error } = await rpc(supabase, "decline_interview_proposal", {
    p_proposal_id: proposalId,
    p_reason: reason ?? null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/messages");
  return { ok: true };
}

export async function holdProposal(proposalId: string): Promise<ActionResult> {
  const supabase = await getSupabaseServerClient();
  const { error } = await rpc(supabase, "hold_interview_proposal", { p_proposal_id: proposalId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/messages");
  return { ok: true };
}

export async function withdrawProposal(proposalId: string): Promise<ActionResult> {
  const supabase = await getSupabaseServerClient();
  const { error } = await rpc(supabase, "withdraw_interview_proposal", { p_proposal_id: proposalId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/messages");
  return { ok: true };
}
