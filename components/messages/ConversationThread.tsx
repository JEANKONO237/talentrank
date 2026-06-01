"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { sendMessage } from "@/lib/server-actions/messages";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

interface Props {
  conversationId: string;
  initialMessages: Message[];
  currentUserId: string;
}

export function ConversationThread({ conversationId, initialMessages, currentUserId }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Realtime subscription to new messages
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`conv-${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => (prev.some((p) => p.id === m.id) ? prev : [...prev, m]));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // Auto-scroll on new
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    startTransition(async () => {
      const res = await sendMessage({ conversation_id: conversationId, body });
      if (!res.ok) {
        setDraft(body); // restore on error
      }
    });
  };

  return (
    <div className="rounded-2xl border border-ink-700/40 bg-ink-875/40 flex flex-col h-[calc(100vh-260px)] min-h-[420px]">
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-[13px] text-mist-400">
            No messages yet. Start the conversation.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === currentUserId;
          return (
            <div
              key={m.id}
              className={cn("flex", mine ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[78%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed",
                  mine
                    ? "bg-cyan-400/15 text-cyan-50 ring-1 ring-inset ring-cyan-400/30"
                    : "bg-ink-850 text-mist-100 ring-1 ring-inset ring-ink-700/30",
                )}
              >
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p className={cn("mt-1 text-[10px]", mine ? "text-cyan-200/60" : "text-mist-500")}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={submit} className="border-t border-ink-700/40 p-3 flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.currentTarget.value)}
          placeholder="Type a message…"
          className="h-11 flex-1 bg-transparent text-[14px] text-mist-50 placeholder:text-mist-500 outline-none px-2"
        />
        <Button type="submit" size="sm" disabled={isPending || !draft.trim()}>
          <Send className="h-4 w-4" strokeWidth={2.4} />
          Send
        </Button>
      </form>
    </div>
  );
}
