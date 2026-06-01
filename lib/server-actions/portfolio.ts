"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/supabase/rpc";
import type { ActionResult } from "./auth";

const portfolioItemSchema = z.object({
  kind: z.enum(["image", "video"]),
  title: z.string().min(1).max(120),
  subtitle: z.string().max(200).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  storage_path: z.string().optional().nullable(),
  external_url: z.string().url().optional().nullable().or(z.literal("")),
  ratio: z.enum(["16/9", "4/5", "1/1", "9/16", "21/9"]).default("16/9"),
  gradient: z.string().optional().nullable(),
  is_featured: z.boolean().optional(),
  is_cover: z.boolean().optional(),
});

export async function addPortfolioItem(input: z.infer<typeof portfolioItemSchema>): Promise<ActionResult<{ id: string }>> {
  const parsed = portfolioItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  // Determine the next position
  const { data: existing } = await supabase
    .from("portfolio_items")
    .select("position")
    .eq("talent_id", user.id)
    .order("position", { ascending: false })
    .limit(1);
  const existingArr = existing as { position: number }[] | null;
  const nextPosition = (existingArr?.[0]?.position ?? -1) + 1;

  // Ensure exactly one cover. If this one is_cover=true, unset the old one.
  if (parsed.data.is_cover) {
    await db(supabase).from("portfolio_items").update({ is_cover: false }).eq("talent_id", user.id).eq("is_cover", true);
  }

  const { data, error } = await db(supabase)
    .from("portfolio_items")
    .insert({ ...parsed.data, talent_id: user.id, position: nextPosition })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Insert failed" };

  revalidatePath("/dashboard/talent");
  revalidatePath("/talent/[slug]", "page");
  return { ok: true, data: { id: (data as { id: string }).id } };
}

export async function updatePortfolioItem(
  id: string,
  input: Partial<z.infer<typeof portfolioItemSchema>>,
): Promise<ActionResult> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  if (input.is_cover) {
    await db(supabase).from("portfolio_items").update({ is_cover: false }).eq("talent_id", user.id).eq("is_cover", true);
  }

  const { error } = await db(supabase).from("portfolio_items").update(input).eq("id", id).eq("talent_id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/talent");
  revalidatePath("/talent/[slug]", "page");
  return { ok: true };
}

export async function deletePortfolioItem(id: string): Promise<ActionResult> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  // Look up storage path first so we can clean up the bucket too.
  const { data: itemData } = await supabase
    .from("portfolio_items")
    .select("storage_path")
    .eq("id", id)
    .eq("talent_id", user.id)
    .maybeSingle();
  const item = itemData as { storage_path: string | null } | null;

  const { error } = await db(supabase).from("portfolio_items").delete().eq("id", id).eq("talent_id", user.id);
  if (error) return { ok: false, error: error.message };

  if (item?.storage_path) {
    await supabase.storage.from("portfolios").remove([item.storage_path]);
  }

  revalidatePath("/dashboard/talent");
  revalidatePath("/talent/[slug]", "page");
  return { ok: true };
}

export async function reorderPortfolio(orderedIds: string[]): Promise<ActionResult> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  // Update positions in a single transaction
  for (let i = 0; i < orderedIds.length; i++) {
    await db(supabase).from("portfolio_items").update({ position: i }).eq("id", orderedIds[i]).eq("talent_id", user.id);
  }
  revalidatePath("/dashboard/talent");
  revalidatePath("/talent/[slug]", "page");
  return { ok: true };
}

// ─── Signed upload URL for direct-from-browser upload ───────────────────
export async function createPortfolioUploadUrl(filename: string): Promise<ActionResult<{ path: string; signedUrl: string; token: string }>> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  // Sanitize filename and prefix with talent UUID (matches storage RLS).
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${user.id}/${Date.now()}-${safe}`;
  const { data, error } = await supabase.storage.from("portfolios").createSignedUploadUrl(path);
  if (error || !data) return { ok: false, error: error?.message ?? "Failed to create upload URL" };

  return { ok: true, data: { path, signedUrl: data.signedUrl, token: data.token } };
}
