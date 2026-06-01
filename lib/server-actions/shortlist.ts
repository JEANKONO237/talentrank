"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/supabase/rpc";
import type { ActionResult } from "./auth";

const createShortlistSchema = z.object({
  studio_id: z.string().uuid(),
  name: z.string().min(1).max(80),
  brief: z.string().max(2000).optional(),
  description: z.string().max(2000).optional(),
});

export async function createShortlist(input: z.infer<typeof createShortlistSchema>): Promise<ActionResult<{ id: string }>> {
  const parsed = createShortlistSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data, error } = await db(supabase)
    .from("shortlists")
    .insert({ ...parsed.data, created_by: user.id })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Insert failed" };

  revalidatePath("/dashboard/recruiter");
  return { ok: true, data: { id: (data as { id: string }).id } };
}

export async function addToShortlist(shortlistId: string, talentId: string, note?: string): Promise<ActionResult> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { error } = await db(supabase).from("shortlist_items").insert({
    shortlist_id: shortlistId,
    talent_id: talentId,
    added_by: user.id,
    note,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/recruiter");
  return { ok: true };
}

export async function removeFromShortlist(shortlistId: string, talentId: string): Promise<ActionResult> {
  const supabase = await getSupabaseServerClient();
  const { error } = await db(supabase)
    .from("shortlist_items")
    .delete()
    .eq("shortlist_id", shortlistId)
    .eq("talent_id", talentId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/recruiter");
  return { ok: true };
}
