"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { rpc } from "@/lib/supabase/rpc";

// ───── Shared validation ────────────────────────────────────────────────
const usernameSchema = z
  .string()
  .min(3)
  .max(32)
  .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, "Lowercase letters, numbers and dashes only")
  .refine((v) => !v.includes("--"), "No consecutive dashes");

const passwordSchema = z.string().min(8, "8 characters minimum");

const signUpTalentSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  username: usernameSchema,
  display_name: z.string().min(1).max(80),
  discipline: z.enum([
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
  ]),
  country_code: z.string().length(2).default("XX"),
});

const signUpStudioSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  username: usernameSchema,
  display_name: z.string().min(1).max(80),
  studio_name: z.string().min(1).max(120),
  country_code: z.string().length(2).default("XX"),
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type ActionResult<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

// ───── Sign-up: Talent ──────────────────────────────────────────────────
export async function signUpTalent(input: z.infer<typeof signUpTalentSchema>): Promise<ActionResult> {
  const parsed = signUpTalentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid input", fieldErrors: parsed.error.flatten().fieldErrors as never };
  }
  const supabase = await getSupabaseServerClient();

  // Username pre-check (RPC to avoid race vs unique-constraint error from auth.users trigger)
  {
    const { data: available } = await rpc(supabase, "is_username_available", {
      p_username: parsed.data.username,
    });
    if (available === false) {
      return { ok: false, error: "Username already taken", fieldErrors: { username: ["Already taken"] } };
    }
  }

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
      data: {
        role: "talent",
        username: parsed.data.username,
        display_name: parsed.data.display_name,
        discipline: parsed.data.discipline,
        country_code: parsed.data.country_code,
      },
    },
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  return { ok: true };
}

// ───── Sign-up: Studio ──────────────────────────────────────────────────
export async function signUpStudio(input: z.infer<typeof signUpStudioSchema>): Promise<ActionResult> {
  const parsed = signUpStudioSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid input", fieldErrors: parsed.error.flatten().fieldErrors as never };
  }
  const supabase = await getSupabaseServerClient();

  {
    const { data: available } = await rpc(supabase, "is_username_available", {
      p_username: parsed.data.username,
    });
    if (available === false) {
      return { ok: false, error: "Username already taken", fieldErrors: { username: ["Already taken"] } };
    }
  }

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
      data: {
        role: "studio",
        username: parsed.data.username,
        display_name: parsed.data.display_name,
        studio_name: parsed.data.studio_name,
        country_code: parsed.data.country_code,
      },
    },
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  return { ok: true };
}

// ───── Sign-in ──────────────────────────────────────────────────────────
export async function signIn(input: z.infer<typeof signInSchema>): Promise<ActionResult<{ role: string }>> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { ok: false, error: error.message };

  // Fetch role to direct redirect
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign-in failed" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const role = (profile as { role: string } | null)?.role ?? "talent";

  // Touch last_seen
  await rpc(supabase, "touch_last_seen");

  revalidatePath("/", "layout");
  return { ok: true, data: { role } };
}

// ───── Sign-out ─────────────────────────────────────────────────────────
export async function signOut() {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

// ───── Username check (used live in the sign-up form) ───────────────────
export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const parsed = usernameSchema.safeParse(username);
  if (!parsed.success) return false;
  const supabase = await getSupabaseServerClient();
  const { data } = await rpc(supabase, "is_username_available", { p_username: parsed.data });
  return data === true;
}
