"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/supabase/rpc";
import type { ActionResult } from "./auth";

const updateProfileSchema = z.object({
  display_name: z.string().min(1).max(80).optional(),
  bio: z.string().max(2000).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  country_code: z.string().length(2).optional(),
  avatar_gradient: z.string().optional(),
  avatar_initials: z.string().min(1).max(4).optional(),
});

const updateTalentSchema = z.object({
  tagline: z.string().max(140).optional().nullable(),
  // Legacy discipline (kept for backward compat).
  discipline: z
    .enum([
      "animation-3d",
      "unreal",
      "motion-design",
      "vfx",
      "storyboard",
      "character-art",
      "environment-art",
      "generalist-3d",
      "editing",
      "visual-direction",
    ])
    .optional(),
  /** New cross-sector profession slug — matches lib/professions.ts. */
  profession_id: z.string().min(1).max(60).optional(),
  years_experience: z.coerce.number().int().min(0).max(60).optional(),
  work_mode: z.enum(["remote", "hybrid", "onsite"]).optional(),
  contract_type: z.enum(["freelance", "fulltime", "studio", "any"]).optional(),
  availability: z.enum(["available", "open", "on-mission", "unavailable"]).optional(),
  availability_note: z.string().max(200).optional().nullable(),
  /** Sprint 2 vision: granular flags */
  freelance_only: z.boolean().optional(),
  remote_only: z.boolean().optional(),
  available_in_days: z.coerce.number().int().min(0).max(365).optional().nullable(),
  showreel_url: z.string().url().optional().nullable().or(z.literal("")),
  website_url: z.string().url().optional().nullable().or(z.literal("")),
  artstation_url: z.string().url().optional().nullable().or(z.literal("")),
  vimeo_url: z.string().url().optional().nullable().or(z.literal("")),
  youtube_url: z.string().url().optional().nullable().or(z.literal("")),
  linkedin_url: z.string().url().optional().nullable().or(z.literal("")),
  specialties: z.array(z.string()).max(8).optional(),
  software: z.array(z.string()).max(20).optional(),
  languages: z.array(z.string()).max(10).optional(),
});

export async function updateProfile(input: z.infer<typeof updateProfileSchema>): Promise<ActionResult> {
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { error } = await db(supabase).from("profiles").update(parsed.data).eq("id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/talent");
  revalidatePath("/talent/[slug]", "page");
  return { ok: true };
}

export async function updateTalent(input: z.infer<typeof updateTalentSchema>): Promise<ActionResult> {
  const parsed = updateTalentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid input", fieldErrors: parsed.error.flatten().fieldErrors as never };
  }
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  // Normalise empty-string URL fields to null
  const data = { ...parsed.data };
  for (const key of ["showreel_url", "website_url", "artstation_url", "vimeo_url", "youtube_url", "linkedin_url"] as const) {
    if (data[key] === "") (data as Record<string, unknown>)[key] = null;
  }

  const { error } = await db(supabase).from("talents").update(data).eq("id", user.id);
  if (error) return { ok: false, error: error.message };

  // Score recomputed by trigger
  revalidatePath("/dashboard/talent");
  revalidatePath("/talent/[slug]", "page");
  return { ok: true };
}

export async function setAvailability(
  availability: "available" | "open" | "on-mission" | "unavailable",
  note?: string,
): Promise<ActionResult> {
  return updateTalent({ availability, availability_note: note ?? null });
}

export async function toggleHidden(): Promise<ActionResult> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: t } = await supabase.from("talents").select("is_hidden").eq("id", user.id).maybeSingle();
  const isHidden = (t as { is_hidden: boolean } | null)?.is_hidden;
  if (isHidden === undefined) return { ok: false, error: "Talent not found" };

  const { error } = await db(supabase).from("talents").update({ is_hidden: !isHidden }).eq("id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/talent");
  return { ok: true };
}

// Server-side redirect after sign-out (called from a form)
export async function redirectToHome() {
  redirect("/");
}
