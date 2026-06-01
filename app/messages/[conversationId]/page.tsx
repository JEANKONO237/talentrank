import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ConversationThread } from "@/components/messages/ConversationThread";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = { title: "Conversation — TalentRank" };

interface MsgRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

interface ConvRow {
  id: string;
  studio_id: string;
  talent_id: string;
  subject: string | null;
  last_message_at: string;
}

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;

  if (!isSupabaseConfigured) return notFound();

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/messages/" + conversationId);

  const convQ = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();
  const conv = convQ.data as ConvRow | null;
  if (!conv) return notFound();

  const messagesQ = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  const messages = (messagesQ.data ?? []) as MsgRow[];

  return (
    <div className="container-page pt-12 pb-20 max-w-3xl">
      <Link
        href="/messages"
        className="inline-flex items-center gap-1.5 text-[12px] font-bold text-mist-400 hover:text-mist-50 transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.6} />
        Retour à la boîte
      </Link>
      <h1 className="mt-4 font-display text-[22px] font-black tracking-tight text-mist-50">
        {conv.subject ?? "Conversation"}
      </h1>
      <div className="mt-8">
        <ConversationThread
          conversationId={conversationId}
          initialMessages={messages}
          currentUserId={user.id}
        />
      </div>
    </div>
  );
}
