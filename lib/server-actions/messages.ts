"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { rpc, db } from "@/lib/supabase/rpc";
import type { ActionResult } from "./auth";

const openConversationSchema = z.object({
  studio_id: z.string().uuid(),
  talent_id: z.string().uuid(),
  subject: z.string().max(120).optional(),
});

export async function openConversation(input: z.infer<typeof openConversationSchema>): Promise<ActionResult<{ id: string }>> {
  const parsed = openConversationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const supabase = await getSupabaseServerClient();
  const { data, error } = await rpc(supabase, "open_conversation", {
    p_studio_id: parsed.data.studio_id,
    p_talent_id: parsed.data.talent_id,
    p_subject: parsed.data.subject ?? null,
  });
  if (error || !data) return { ok: false, error: error?.message ?? "Failed to open conversation" };

  revalidatePath("/messages");
  return { ok: true, data: { id: data as string } };
}

const sendMessageSchema = z.object({
  conversation_id: z.string().uuid(),
  body: z.string().min(1).max(8000),
});

export async function sendMessage(input: z.infer<typeof sendMessageSchema>): Promise<ActionResult<{ id: string }>> {
  const parsed = sendMessageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data, error } = await db(supabase)
    .from("messages")
    .insert({
      conversation_id: parsed.data.conversation_id,
      sender_id: user.id,
      body: parsed.data.body,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Send failed" };

  revalidatePath(`/messages/${parsed.data.conversation_id}`);
  revalidatePath("/messages");
  return { ok: true, data: { id: (data as { id: string }).id } };
}

export async function markConversationRead(conversationId: string): Promise<ActionResult> {
  const supabase = await getSupabaseServerClient();
  const { error } = await rpc(supabase, "mark_conversation_read", { p_conversation_id: conversationId });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/messages/${conversationId}`);
  revalidatePath("/messages");
  return { ok: true };
}
