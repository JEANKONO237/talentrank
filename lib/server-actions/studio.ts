"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/supabase/rpc";
import type { ActionResult } from "./auth";

const updateStudioSchema = z.object({
  legal_name: z.string().max(120).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  industry: z.string().max(80).optional().nullable(),
  size_range: z.enum(["1-10", "11-50", "51-200", "201-1000", "1000+"]).optional(),
  website_url: z.string().url().optional().nullable().or(z.literal("")),
  founded_year: z.coerce.number().int().min(1900).max(2100).optional().nullable(),
  hq_country_code: z.string().length(2).optional().nullable(),
});

export async function updateStudio(
  studioId: string,
  input: z.infer<typeof updateStudioSchema>,
): Promise<ActionResult> {
  const parsed = updateStudioSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const data = { ...parsed.data };
  if (data.website_url === "") data.website_url = null;

  const { error } = await db(supabase).from("studios").update(data).eq("id", studioId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/recruiter");
  return { ok: true };
}

const verificationRequestSchema = z.object({
  studio_id: z.string().uuid(),
  evidence_url: z.string().url(),
  notes: z.string().max(2000).optional(),
});

export async function requestStudioVerification(
  input: z.infer<typeof verificationRequestSchema>,
): Promise<ActionResult> {
  const parsed = verificationRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { error } = await db(supabase).from("studio_verification_requests").insert({
    studio_id: parsed.data.studio_id,
    submitted_by: user.id,
    evidence_url: parsed.data.evidence_url,
    notes: parsed.data.notes,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/recruiter");
  return { ok: true };
}
