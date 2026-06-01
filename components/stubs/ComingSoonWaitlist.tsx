"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Mail } from "lucide-react";
import { triggerHaptic } from "@/lib/haptic";
import { playWiggle } from "@/lib/audio/sounds";

// ─────────────────────────────────────────────────────────────────────────────
// ComingSoonWaitlist — mini-form embed dans une page ComingSoon.
//
// Audit Erin G3-Erin-2 : "QCM Builder vendu comme flagship mais c'est un
// stub → promesse trahie". Solution : afficher honnêtement "en construction"
// + capture l'email pour notifier au launch.
//
// Stockage : localStorage key spécifique à la feature (pour grouper les
// intéressés par feature). Quand un endpoint /api/feature-waitlist sera
// dispo, on POST en parallèle.
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  /** Identifier unique de la feature (ex: 'qcm-builder'). */
  featureId: string;
  /** Phrase d'incentive courte. */
  pitch: string;
  /** Couleur d'accent du bouton submit. */
  accent: string;
}

export function ComingSoonWaitlist({ featureId, pitch, accent }: Props) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const storageKey = `tr:feature-waitlist:${featureId}:v1`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Email invalide.");
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey);
      const list: { email: string; ts: number }[] = raw ? JSON.parse(raw) : [];
      if (!list.some((e) => e.email === trimmed)) {
        list.push({ email: trimmed, ts: Date.now() });
        localStorage.setItem(storageKey, JSON.stringify(list));
      }
      triggerHaptic("medium");
      playWiggle();
      setSubmitted(true);
    } catch {
      setError("Impossible d'enregistrer. Réessaie.");
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card-white p-5 max-w-md mx-auto text-center"
      >
        <span
          className="mx-auto mb-3 inline-grid h-12 w-12 place-items-center rounded-full"
          style={{ background: `${accent}1A`, color: accent }}
        >
          <Check className="h-6 w-6" strokeWidth={3} />
        </span>
        <p className="font-display text-[15px] font-black text-mist-50">
          Tu seras prévenu au lancement.
        </p>
        <p className="mt-1 text-[12px] text-mist-400">Un seul email, promis.</p>
      </motion.div>
    );
  }

  return (
    <div className="card-white p-5 max-w-md mx-auto">
      <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400 mb-2">
        <Mail className="inline-block h-3 w-3 -mt-0.5 mr-1" strokeWidth={2.6} />
        Prévenir au lancement
      </p>
      <p className="text-[12.5px] text-mist-200 mb-4 leading-relaxed">{pitch}</p>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          placeholder="ton@email.com"
          required
          autoComplete="email"
          className="flex-1 h-10 rounded-xl bg-ink-850 ring-1 ring-inset ring-ink-700/15 focus:ring-2 focus:ring-night-700/50 px-3 text-[13px] text-mist-50 placeholder:text-mist-400 outline-none transition"
        />
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-4 text-[11.5px] font-bold uppercase tracking-[0.06em] text-white transition hover:brightness-110"
          style={{
            background: accent,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 12px -4px ${accent}66`,
          }}
        >
          M&apos;inscrire
        </button>
      </form>
      {error && (
        <p className="mt-2 text-[11.5px] text-rose-700 font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
