"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { rpc, db } from "@/lib/supabase/rpc";
import type { ActionResult } from "./auth";

const createHiringSchema = z.object({
  studio_id: z.string().uuid(),
  talent_id: z.string().uuid(),
  project_title: z.string().max(200).optional(),
  description: z.string().max(4000).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  rate: z.string().max(80).optional(),
});

export async function createHiring(input: z.infer<typeof createHiringSchema>): Promise<ActionResult<{ id: string }>> {
  const parsed = createHiringSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data, error } = await db(supabase)
    .from("hirings")
    .insert({ ...parsed.data, created_by: user.id })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Insert failed" };

  revalidatePath("/dashboard/talent");
  revalidatePath("/dashboard/recruiter");
  return { ok: true, data: { id: (data as { id: string }).id } };
}

export async function confirmHiring(hiringId: string): Promise<ActionResult> {
  const supabase = await getSupabaseServerClient();
  const { error } = await rpc(supabase, "confirm_hiring", { p_hiring_id: hiringId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/talent");
  revalidatePath("/dashboard/recruiter");
  revalidatePath("/ranking");
  revalidatePath("/explore");
  return { ok: true };
}

export async function endHiring(hiringId: string): Promise<ActionResult> {
  const supabase = await getSupabaseServerClient();
  const { error } = await rpc(supabase, "end_hiring", { p_hiring_id: hiringId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/talent");
  revalidatePath("/dashboard/recruiter");
  revalidatePath("/ranking");
  revalidatePath("/explore");
  return { ok: true };
}
