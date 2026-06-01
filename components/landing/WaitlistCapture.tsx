"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Mail } from "lucide-react";
import { track } from "@/lib/analytics/events";

// ─────────────────────────────────────────────────────────────────────────────
// WaitlistCapture — discrete email capture posée sous le hero.
//
// Pourquoi : le launch-strategist a flagué qu'on n'a pas de pre-launch list.
// Sans waitlist, le launch day = silence. Stockage localStorage pour l'instant,
// migrer vers Supabase `waitlist` table dès que l'auth est branchée.
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "talentrank:waitlist:v1";

interface WaitlistEntry {
  email: string;
  role: "talent" | "studio" | "curious";
  joinedAt: number;
}

export function WaitlistCapture() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WaitlistEntry["role"]>("talent");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Email invalide.");
      return;
    }
    // 1. Mirror local (offline-safe + dedup)
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      const list: WaitlistEntry[] = raw ? JSON.parse(raw) : [];
      if (!list.some((e) => e.email === trimmed)) {
        list.push({ email: trimmed, role, joinedAt: Date.now() });
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        }
      }
    } catch {
      /* local mirror best-effort */
    }
    // 2. POST vers /api/waitlist (audit Sasha G3-Sasha-1) — capture server-side.
    //    Si Supabase live → insert DB. Sinon → log server. Dans les 2 cas,
    //    le user voit le success state instantanément (optimistic UX).
    try {
      await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, role }),
      });
    } catch {
      /* network may fail offline — local mirror sauve quand même */
    }
    // Track : signal d'intention le plus fort pré-onboarding.
    track("waitlist_signup", { feature_id: `beta_${role}` });
    setSubmitted(true);
  };

  return (
    <section className="container-page py-12 sm:py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}
        className="mx-auto max-w-xl"
      >
        <div className="rounded-[24px] bg-white ring-1 ring-inset ring-ink-700/10 shadow-card p-6 sm:p-7">
          {submitted ? (
            <SuccessState />
          ) : (
            <>
              <div className="flex items-center gap-2.5">
                <span className="inline-grid h-9 w-9 place-items-center rounded-xl bg-cyan-100 ring-1 ring-inset ring-cyan-300/40">
                  <Mail className="h-4 w-4 text-cyan-700" strokeWidth={2.6} />
                </span>
                <div>
                  <h3 className="font-display text-[16px] font-black text-mist-50 leading-tight">
                    Rejoins la beta privée
                  </h3>
                  <p className="text-[11.5px] text-mist-400 leading-tight">
                    Accès limité
                  </p>
                </div>
              </div>

              <p className="mt-3 text-[12.5px] text-mist-300 leading-relaxed">
                Sois prévenu(e) au lancement. Pas de spam — un seul email quand TalentRank ouvre.
              </p>

              <form onSubmit={handleSubmit} className="mt-5 space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.currentTarget.value)}
                    placeholder="ton@email.com"
                    required
                    aria-label="Adresse email"
                    className="flex-1 h-11 rounded-xl bg-ink-50 ring-1 ring-inset ring-ink-700/15 focus:ring-cyan-400/40 px-4 text-[14px] text-mist-50 placeholder:text-mist-400 outline-none transition"
                  />
                  <button
                    type="submit"
                    className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl px-5 text-[12.5px] font-bold uppercase tracking-[0.04em] text-white transition-all hover:brightness-110 active:translate-y-[1px]"
                    style={{
                      background: "linear-gradient(180deg, #1CB0F6, #0E84BB)",
                      boxShadow:
                        "inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 0 #076A9D, 0 8px 16px -4px rgba(28,176,246,0.4)",
                    }}
                  >
                    Rejoindre
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.8} />
                  </button>
                </div>

                {/* Role picker — segmented control */}
                <fieldset className="flex flex-wrap items-center gap-2">
                  <legend className="sr-only">Je suis</legend>
                  <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-mist-400">
                    Je suis
                  </span>
                  {(
                    [
                      { id: "talent", label: "Talent" },
                      { id: "studio", label: "Entreprise" },
                      { id: "curious", label: "Curieux" },
                    ] as const
                  ).map((r) => (
                    <label key={r.id} className="cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value={r.id}
                        checked={role === r.id}
                        onChange={() => setRole(r.id)}
                        className="sr-only peer"
                      />
                      <span
                        className="inline-flex h-7 items-center rounded-full px-2.5 text-[11px] font-bold text-mist-200 ring-1 ring-inset ring-ink-700/10 transition peer-checked:bg-cyan-100 peer-checked:text-cyan-700 peer-checked:ring-cyan-400/40"
                      >
                        {r.label}
                      </span>
                    </label>
                  ))}
                </fieldset>

                {error && (
                  <p className="text-[12px] text-rose-700" role="alert">
                    {error}
                  </p>
                )}
              </form>
            </>
          )}
        </div>
      </motion.div>
    </section>
  );
}

function SuccessState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="text-center py-2"
    >
      <motion.span
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 360, damping: 18, delay: 0.1 }}
        className="inline-grid h-12 w-12 place-items-center rounded-full bg-emerald-100 ring-1 ring-inset ring-emerald-400/40"
      >
        <Check className="h-6 w-6 text-emerald-700" strokeWidth={3} />
      </motion.span>
      <p className="mt-4 font-display text-[18px] font-black text-mist-50">
        Tu es sur la liste.
      </p>
      <p className="mt-1.5 text-[12.5px] text-mist-400">
        On te prévient dès qu'on ouvre. Un seul email, promis.
      </p>
    </motion.div>
  );
}
