"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// SearchBar — pilule de recherche métier. Placeholder rotatif pour donner vie
// sans bouger le layout. Bouton primary night gradient avec cyan glow au hover.
// ─────────────────────────────────────────────────────────────────────────────

const PLACEHOLDER_EXAMPLES = [
  "Animateur 3D",
  "Boulanger",
  "Character Artist",
  "Développeur Frontend",
  "Motion Designer",
  "Médecin",
  "Chef cuisinier",
  "Storyboarder",
];

export function SearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  useEffect(() => {
    if (search.length > 0) return;
    const t = setInterval(
      () => setPlaceholderIdx((i) => (i + 1) % PLACEHOLDER_EXAMPLES.length),
      2400,
    );
    return () => clearInterval(t);
  }, [search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    router.push(q ? `/metiers?q=${encodeURIComponent(q)}` : "/metiers");
  };

  return (
    <motion.form
      onSubmit={handleSearch}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.28 }}
      className={cn("mx-auto max-w-xl", className)}
    >
      <div
        className="group relative flex items-center gap-2 rounded-full bg-white ring-2 ring-ink-700/10 focus-within:ring-amber-300/60 transition-all duration-200 pl-5 pr-2 py-2"
        style={{
          boxShadow:
            "0 1px 0 rgba(255,255,255,0.85) inset, 0 12px 32px -16px rgba(0,0,0,0.18), 0 2px 6px -2px rgba(0,0,0,0.06)",
        }}
      >
        <Search className="h-[18px] w-[18px] text-mist-400 shrink-0" strokeWidth={2.4} />
        <div className="relative h-11 flex-1 flex items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            placeholder="Quel métier ?"
            className="absolute inset-0 bg-transparent text-[15px] text-mist-50 placeholder:text-mist-400 outline-none"
            aria-label="Recherche par métier"
          />
          {search.length === 0 && (
            <span
              aria-hidden
              className="pointer-events-none absolute left-[88px] sm:left-[100px] flex items-center text-[15px] text-mist-400/70"
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={PLACEHOLDER_EXAMPLES[placeholderIdx]}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
                  className="font-medium"
                >
                  {PLACEHOLDER_EXAMPLES[placeholderIdx]}
                </motion.span>
              </AnimatePresence>
            </span>
          )}
        </div>
        <motion.button
          type="submit"
          aria-label="Chercher"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: "spring", stiffness: 420, damping: 18 }}
          className="group/btn inline-flex h-11 w-11 items-center justify-center rounded-full text-white transition-shadow duration-200"
          style={{
            background: "linear-gradient(180deg, #2C3E55, #1A2535)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.15), 0 6px 16px -4px rgba(10,20,30,0.45), 0 0 0 0 rgba(28,176,246,0)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow =
              "inset 0 1px 0 rgba(255,255,255,0.2), 0 10px 24px -6px rgba(10,20,30,0.6), 0 0 0 4px rgba(28,176,246,0.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow =
              "inset 0 1px 0 rgba(255,255,255,0.15), 0 6px 16px -4px rgba(10,20,30,0.45), 0 0 0 0 rgba(28,176,246,0)";
          }}
        >
          <ArrowRight
            className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-0.5"
            strokeWidth={2.6}
          />
        </motion.button>
      </div>
    </motion.form>
  );
}
