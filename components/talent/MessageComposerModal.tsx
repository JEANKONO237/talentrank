"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Check, Lock, Send, Sparkles, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Pill } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { sendMessage } from "@/lib/messages";
import { cn } from "@/lib/utils";

interface TalentLite {
  id: string;
  slug: string;
  name: string;
  roleLabel: string;
  initials: string;
  gradient: string;
  countryCode?: string;
}

interface Props {
  talent: TalentLite;
  onClose: () => void;
}

// Free-form direct message — the lightweight alternative to "Propose Interview".
// No salary, no contract type, no dates. Just a private message to start a
// conversation. The recruiter writes; the talent receives a notification and
// can accept the thread, ignore, or convert it to an interview proposal later.

const BODY_MAX = 2000;
const SUBJECT_MAX = 80;

const QUICK_OPENERS = [
  "Bonjour, j'ai vu ton profil et j'aimerais en savoir plus sur ton parcours.",
  "On a un projet qui pourrait t'intéresser — disponible pour un échange rapide ?",
  "Hello ! Ton portfolio m'a tapé dans l'œil. Quelques minutes pour discuter ?",
];

export function MessageComposerModal({ talent, onClose }: Props) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !submitting && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, submitting]);

  const canSend = body.trim().length > 0 && body.length <= BODY_MAX && !submitting;

  const submit = async () => {
    if (!canSend) return;
    setError(null);
    setSubmitting(true);
    try {
      // Tiny artificial delay so the "Envoi…" feedback is visible. Replace
      // with a real RPC call when the backend lands.
      await new Promise((r) => setTimeout(r, 500));
      sendMessage({
        talentId: talent.id,
        talentSlug: talent.slug,
        talentName: talent.name,
        talentInitials: talent.initials,
        talentGradient: talent.gradient,
        talentCountryCode: talent.countryCode,
        subject,
        body,
      });
      setDone(true);
      setTimeout(() => onClose(), 1600);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  };

  const insertOpener = (text: string) => {
    setBody((prev) => (prev ? `${prev}\n\n${text}` : text));
    // Focus the textarea + put caret at the end on the next tick.
    setTimeout(() => {
      const el = bodyRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }, 0);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] grid place-items-center bg-mist-50/40 backdrop-blur-md p-4"
        onClick={() => !submitting && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.2, 0.7, 0.2, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-xl glass-panel p-7"
        >
          {/* Close */}
          <button
            onClick={() => !submitting && onClose()}
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-mist-300 hover:bg-ink-850 hover:text-mist-50"
            aria-label="Fermer"
            disabled={submitting}
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3">
            <Avatar
              initials={talent.initials}
              gradient={`bg-gradient-to-br ${talent.gradient}`}
              countryCode={talent.countryCode}
              size="md"
            />
            <div className="min-w-0">
              <Pill tone="green">
                <Sparkles className="h-3 w-3" />
                Message direct · sans engagement
              </Pill>
              <h2 className="mt-2 font-display text-[20px] font-bold tracking-tight text-mist-50 truncate">
                Écrire à {talent.name}
              </h2>
              <p className="text-[12.5px] text-mist-400">{talent.roleLabel}</p>
            </div>
          </div>

          {done ? (
            <SuccessState talent={talent} />
          ) : (
            <>
              {/* Quick openers */}
              <div className="mt-6">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-500">
                  Démarrages rapides
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {QUICK_OPENERS.map((opener, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => insertOpener(opener)}
                      className="rounded-full bg-ink-850 hover:bg-ink-800 ring-1 ring-inset ring-ink-700/40 px-3 py-1 text-[11.5px] font-medium text-mist-200 transition text-left max-w-full"
                    >
                      <span className="block truncate max-w-[260px]">{opener}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div className="mt-5">
                <label className="block">
                  <span className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-500">
                    Sujet <span className="text-mist-500/70 font-medium normal-case tracking-normal">— optionnel</span>
                  </span>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.currentTarget.value.slice(0, SUBJECT_MAX))}
                    placeholder="Ex. Mission VFX 3 mois · télétravail"
                    maxLength={SUBJECT_MAX}
                    disabled={submitting}
                    className="mt-2 h-11 w-full rounded-xl border border-ink-700/40 bg-ink-900/60 px-3.5 text-[14px] text-mist-50 placeholder:text-mist-500 outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                  />
                </label>
              </div>

              {/* Body */}
              <div className="mt-4">
                <label className="block">
                  <span className="flex items-center justify-between">
                    <span className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-500">
                      Message
                    </span>
                    <span
                      className={cn(
                        "text-[10.5px] font-mono tabular-nums",
                        body.length > BODY_MAX - 100
                          ? "text-amber-400"
                          : "text-mist-500",
                      )}
                    >
                      {body.length} / {BODY_MAX}
                    </span>
                  </span>
                  <textarea
                    ref={bodyRef}
                    autoFocus
                    value={body}
                    onChange={(e) => setBody(e.currentTarget.value.slice(0, BODY_MAX))}
                    rows={6}
                    placeholder={`Bonjour ${talent.name.split(" ")[0]}, …`}
                    disabled={submitting}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
                    }}
                    className="mt-2 w-full resize-y rounded-xl border border-ink-700/40 bg-ink-900/60 p-3.5 text-[14px] leading-relaxed text-mist-50 placeholder:text-mist-500 outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                  />
                </label>
                <p className="mt-1.5 text-[11px] text-mist-500">
                  Astuce : <kbd className="rounded bg-ink-850 px-1 py-0.5 font-mono text-[10px]">⌘</kbd>
                  /<kbd className="rounded bg-ink-850 px-1 py-0.5 font-mono text-[10px]">Ctrl</kbd>
                  {" "}+ <kbd className="rounded bg-ink-850 px-1 py-0.5 font-mono text-[10px]">Entrée</kbd> pour envoyer
                </p>
              </div>

              {error && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[13px] text-rose-200">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Actions */}
              <div className="mt-6 flex items-center justify-between gap-2">
                <Button variant="ghost" size="md" onClick={onClose} disabled={submitting}>
                  Annuler
                </Button>
                <Button onClick={submit} disabled={!canSend} size="md">
                  <Send className="h-4 w-4" strokeWidth={2.4} />
                  {submitting ? "Envoi…" : "Envoyer le message"}
                </Button>
              </div>

              {/* Privacy footnote */}
              <p className="mt-4 flex items-start gap-1.5 text-[11px] text-mist-500">
                <Lock className="mt-0.5 h-3 w-3 shrink-0" strokeWidth={2.4} />
                <span>
                  Message envoyé en privé à {talent.name.split(" ")[0]}. Il / elle peut répondre,
                  ignorer ou convertir l&apos;échange en proposition d&apos;entretien. Rien de public.
                </span>
              </p>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function SuccessState({ talent }: { talent: TalentLite }) {
  return (
    <div className="mt-8 grid place-items-center pb-2 text-center">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
        className="grid h-14 w-14 place-items-center rounded-full bg-signal-green/15 ring-1 ring-inset ring-signal-green/40"
      >
        <Check className="h-6 w-6 text-signal-green" strokeWidth={2.6} />
      </motion.div>
      <p className="mt-5 font-display text-[20px] font-bold text-mist-50">
        Message envoyé.
      </p>
      <p className="mt-1.5 max-w-md text-[13.5px] text-mist-300">
        {talent.name.split(" ")[0]} reçoit ta notification. Tu retrouveras le fil
        dans ton tableau de bord recruteur.
      </p>
    </div>
  );
}
