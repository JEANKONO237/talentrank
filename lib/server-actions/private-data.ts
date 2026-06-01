"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/supabase/rpc";
import type { ActionResult } from "./auth";

// Update private contact + CV pointer. Recruiter visibility is enforced by RLS
// in supabase/migrations/0016_visibility_tiers.sql — only verified studios
// with a relationship (shortlist / proposal / hiring) can read these rows.

const privateSchema = z.object({
  phone: z.string().max(40).optional().nullable(),
  full_address: z.string().max(200).optional().nullable(),
  notice_period_days: z.coerce.number().int().min(0).max(365).optional().nullable(),
  expected_salary_min: z.coerce.number().int().min(0).optional().nullable(),
  expected_salary_max: z.coerce.number().int().min(0).optional().nullable(),
  expected_currency: z.string().length(3).optional().nullable(),
  cv_storage_path: z.string().optional().nullable(),
  cover_letter_path: z.string().optional().nullable(),
  private_note: z.string().max(2000).optional().nullable(),
});

export async function updateTalentPrivate(input: z.infer<typeof privateSchema>): Promise<ActionResult> {
  const parsed = privateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  // Upsert: create the row if it doesn't exist.
  const { error } = await db(supabase)
    .from("talent_private")
    .upsert({ talent_id: user.id, email: user.email, ...parsed.data });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/talent");
  return { ok: true };
}

// Create a signed upload URL for a CV. Bucket is private; only the talent
// and verified-with-relationship studios can read.
export async function createCvUploadUrl(filename: string): Promise<ActionResult<{ path: string; signedUrl: string; token: string }>> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${user.id}/${Date.now()}-${safe}`;
  const { data, error } = await supabase.storage.from("cvs").createSignedUploadUrl(path);
  if (error || !data) return { ok: false, error: error?.message ?? "Failed to create upload URL" };

  return { ok: true, data: { path, signedUrl: data.signedUrl, token: data.token } };
}
