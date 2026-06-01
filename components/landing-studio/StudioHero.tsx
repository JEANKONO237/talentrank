"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Filter, Search, Sparkles } from "lucide-react";
import { StudioMascot } from "@/components/ui/StudioMascot";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// StudioHero — l'accroche recruteur.
//
// Ton brand : bleu nuit dominant (autorité, sérieux), accent cyan/amber
// modéré. Pas de mascotte. Pas de cream. Le studio n'est pas là pour
// "jouer" — il est là pour TROUVER.
//
// Layout :
//   - Eyebrow "Pour les entreprises"
//   - Titre gros "Chasse les meilleurs. / Sans bruit."
//   - Sub-titre "Recherche par métier · ville · disponibilité · score"
//   - Search bar "Animateur 3D Senior, Paris, disponible"
//   - Chips suggested searches
//   - 3 cards "métier + n°1 + score" (preview live)
// ─────────────────────────────────────────────────────────────────────────────

const SUGGESTED_SEARCHES = [
  "Animateur 3D Senior · Paris",
  "Frontend React · Lyon",
  "Motion Designer · Marseille",
  "Boulanger MOF · Lille",
  "Data Scientist · Bordeaux",
];

export function StudioHero() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/chasse?q=${encodeURIComponent(q)}` : "/chasse");
  };

  return (
    <section
      className="relative isolate overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #FFFFFF 0%, #F4F6F9 100%), radial-gradient(ellipse 80% 60% at 50% -10%, rgba(26,37,53,0.06), transparent 60%)",
      }}
    >
      <div className="container-page relative pt-16 sm:pt-20 pb-24">
        {/* Studio mascot — peeking discret en haut. Audit Yuki G1-Yuki-3 :
            l'univers studio avait 0 mascotte vs 6 côté talent. L'Aigle Sheriff
            incarne la perception et l'autorité chasseur, sobre sans être
            froid. Petite taille (vs PeekingMascot talent gros et coloré) pour
            rester dans la tonale "efficacité pro". */}
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1], delay: 0.1 }}
          className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ zIndex: 5 }}
          aria-hidden
        >
          <div
            className="grid place-items-center rounded-full overflow-hidden"
            style={{
              width: 92,
              height: 92,
              background:
                "radial-gradient(circle at 30% 25%, #4D5A6B, #1A2535 60%, #0A1018 100%)",
              boxShadow:
                "0 12px 24px -6px rgba(10,16,24,0.55), inset 0 3px 0 rgba(255,255,255,0.18), inset 0 -14px 22px -8px rgba(0,0,0,0.45)",
            }}
          >
            <StudioMascot size={68} className="-mt-1 drop-shadow-[0_3px_6px_rgba(0,0,0,0.4)]" />
          </div>
        </motion.div>

        <div className="max-w-4xl mx-auto text-center pt-16 sm:pt-20">
          {/* Eyebrow */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-[11px] font-bold uppercase tracking-[0.24em] text-night-500"
          >
            Pour les entreprises · Beta privée
          </motion.p>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="mt-6 font-display font-black tracking-tight text-mist-50"
            style={{
              fontSize: "clamp(2.4rem, 6.2vw, 5rem)",
              lineHeight: 0.98,
              letterSpacing: "-0.025em",
            }}
          >
            Chasse les meilleurs.
            <br />
            <span className="relative inline-block">
              Sans bruit.
              <motion.span
                aria-hidden
                initial={{ scaleX: 0, transformOrigin: "0% 50%" }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
                className="absolute left-0 right-0 -bottom-1 sm:-bottom-1.5 h-[5px] sm:h-[6px] rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(26,37,53,0.30) 0%, rgba(26,37,53,0.70) 50%, rgba(26,37,53,0.30) 100%)",
                }}
              />
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-7 text-[16px] sm:text-[17px] text-mist-300 max-w-2xl mx-auto"
          >
            Recherche par <span className="font-bold text-mist-100">métier précis</span>,{" "}
            <span className="font-bold text-mist-100">ville</span>,{" "}
            <span className="font-bold text-mist-100">disponibilité</span> et{" "}
            <span className="font-bold text-mist-100">score officiel</span>.
            Aucune candidature à lire.
          </motion.p>

          {/* Search bar — night style */}
          <motion.form
            onSubmit={onSearch}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.28 }}
            className="mt-10 mx-auto max-w-2xl"
          >
            <div
              className="group relative flex items-center gap-2 rounded-full bg-white ring-2 ring-night-700/15 focus-within:ring-night-700/50 transition-all duration-200 pl-5 pr-2 py-2"
              style={{
                boxShadow:
                  "0 1px 0 rgba(255,255,255,0.85) inset, 0 16px 40px -20px rgba(10,16,24,0.25), 0 2px 6px -2px rgba(0,0,0,0.06)",
              }}
            >
              <Search className="h-[18px] w-[18px] text-mist-400 shrink-0" strokeWidth={2.4} />
              <input
                value={query}
                onChange={(e) => setQuery(e.currentTarget.value)}
                placeholder="Animateur 3D Senior, Paris, disponible…"
                className="flex-1 h-11 bg-transparent text-[15px] text-mist-50 placeholder:text-mist-400 outline-none"
                aria-label="Rechercher un talent"
              />
              <motion.button
                type="submit"
                aria-label="Chercher"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: "spring", stiffness: 420, damping: 18 }}
                className="inline-flex h-11 items-center gap-1.5 rounded-full px-5 text-[12px] font-bold uppercase tracking-[0.06em] text-white"
                style={{
                  background: "linear-gradient(180deg, #2C3E55, #1A2535)",
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,0.15), 0 6px 16px -4px rgba(10,20,30,0.45)",
                }}
              >
                Chasser
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.8} />
              </motion.button>
            </div>

            {/* Filter button discret */}
            <p className="mt-3 text-[11.5px] text-mist-400 flex items-center justify-center gap-1.5">
              <Filter className="h-3 w-3" strokeWidth={2.6} />
              17 filtres avancés disponibles · ville, disponibilité, score min,
              ligue, années d&apos;exp, software, langue…
            </p>
          </motion.form>

          {/* Suggested searches */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-2"
          >
            <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-mist-400 mr-1">
              <Sparkles className="inline-block h-3 w-3 -mt-0.5 mr-1" strokeWidth={2.6} />
              Suggestions
            </span>
            {SUGGESTED_SEARCHES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setQuery(s);
                  router.push(`/chasse?q=${encodeURIComponent(s)}`);
                }}
                className={cn(
                  "inline-flex h-7 items-center rounded-full bg-white ring-1 ring-inset ring-ink-700/10",
                  "px-2.5 text-[11.5px] font-bold text-mist-100",
                  "hover:bg-night-700 hover:text-white hover:ring-night-700 transition",
                )}
              >
                {s}
              </button>
            ))}
          </motion.div>

          {/* Trust strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.55 }}
            className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[11.5px] text-mist-400"
          >
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              QCM officiel anti-cheat
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
              Re-passage verrouillé 1 mois
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Classement par métier · pas d&apos;amalgame
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
