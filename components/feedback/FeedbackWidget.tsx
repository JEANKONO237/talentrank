"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, MessageCircle, Send, X } from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import { playWiggle } from "@/lib/audio/sounds";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// FeedbackWidget — bouton flottant "💬 Feedback" + drawer textarea.
//
// Audit Mira G3-Mira-2 : aucun canal feedback in-product → tu loupes la
// voix utilisateur. Widget bottom-right discret pour qu'un user puisse
// signaler bug/idée/critique sans quitter la page.
//
// Stockage v1 : localStorage (key tr:feedback:v1, append). Quand un endpoint
// /api/feedback existera, on POST en parallèle. Aussi possible : forward
// vers PostHog via trackEvent('feedback_submitted', { text }).
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "tr:feedback:v1";

interface FeedbackEntry {
  text: string;
  context: string; // pathname au moment du submit
  ts: number;
}

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [type, setType] = useState<"bug" | "idea" | "praise">("idea");

  const submit = () => {
    const trimmed = text.trim();
    if (trimmed.length < 5) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const list: FeedbackEntry[] = raw ? JSON.parse(raw) : [];
      list.push({
        text: `[${type}] ${trimmed}`,
        context: typeof window !== "undefined" ? window.location.pathname : "",
        ts: Date.now(),
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(-100))); // cap 100
      // Best-effort fire-and-forget to /api/feedback (no-op si pas implémenté)
      try {
        fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: trimmed,
            type,
            context: typeof window !== "undefined" ? window.location.pathname : "",
          }),
        }).catch(() => {});
      } catch {
        /* ignore */
      }
      triggerHaptic("medium");
      playWiggle();
      setSubmitted(true);
      setText("");
      setTimeout(() => {
        setSubmitted(false);
        setOpen(false);
      }, 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      {/* Floating trigger button — bottom-right */}
      <motion.button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          triggerHaptic("light");
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className={cn(
          "fixed bottom-5 right-5 z-50 inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.06em] text-white transition-all",
          "shadow-lg",
        )}
        style={{
          background: open
            ? "linear-gradient(180deg, #6E7B8A, #4D5A6B)"
            : "linear-gradient(180deg, #2C3E55, #1A2535)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.15), 0 12px 28px -8px rgba(10,20,30,0.5)",
        }}
        aria-label={open ? "Fermer feedback" : "Donner mon feedback"}
        aria-expanded={open}
      >
        {open ? (
          <>
            <X className="h-3.5 w-3.5" strokeWidth={2.6} />
            Fermer
          </>
        ) : (
          <>
            <MessageCircle className="h-3.5 w-3.5" strokeWidth={2.6} />
            Feedback
          </>
        )}
      </motion.button>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
            className="fixed bottom-20 right-5 z-50 w-[320px] sm:w-[380px] max-w-[calc(100vw-40px)]"
          >
            <div className="card-white p-5">
              {submitted ? (
                <div className="text-center py-3">
                  <span className="mx-auto mb-2 inline-grid h-10 w-10 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check className="h-5 w-5" strokeWidth={3} />
                  </span>
                  <p className="font-display text-[14px] font-black text-mist-50">
                    Reçu. Merci.
                  </p>
                  <p className="mt-1 text-[11.5px] text-mist-400">
                    Chaque feedback est lu. Promis.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400">
                    Feedback
                  </p>
                  <h3 className="mt-1 font-display text-[15px] font-black text-mist-50 leading-tight">
                    Qu&apos;est-ce qui te plaît / déplaît ?
                  </h3>

                  {/* Type segmented */}
                  <div className="mt-3 grid grid-cols-3 gap-1 rounded-full bg-ink-850 p-0.5">
                    {(["bug", "idea", "praise"] as const).map((t) => {
                      const label = t === "bug" ? "🐛 Bug" : t === "idea" ? "💡 Idée" : "❤️ J'aime";
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setType(t)}
                          className={cn(
                            "rounded-full px-2 py-1.5 text-[10.5px] font-bold transition",
                            type === t
                              ? "bg-white text-mist-50 shadow-sm"
                              : "text-mist-400 hover:text-mist-200",
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  <textarea
                    value={text}
                    onChange={(e) => setText(e.currentTarget.value)}
                    rows={4}
                    maxLength={500}
                    placeholder={
                      type === "bug"
                        ? "Décris ce qui ne marche pas. URL, action attendue, action obtenue…"
                        : type === "idea"
                          ? "Une fonctionnalité, un détail qui te ferait revenir ?"
                          : "Ce qui te plaît dans TalentRank…"
                    }
                    className="mt-3 w-full rounded-xl bg-ink-850 ring-1 ring-inset ring-ink-700/15 focus:ring-2 focus:ring-night-700/50 p-3 text-[12.5px] text-mist-50 placeholder:text-mist-400 outline-none transition resize-none"
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-mist-400 tabular-nums">
                      {text.length} / 500
                    </span>
                    <button
                      type="button"
                      onClick={submit}
                      disabled={text.trim().length < 5}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-night-700 hover:bg-night-600 text-white px-4 text-[11.5px] font-bold uppercase tracking-[0.06em] transition disabled:opacity-50"
                    >
                      <Send className="h-3 w-3" strokeWidth={2.6} />
                      Envoyer
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
