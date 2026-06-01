"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Share2, Shield, Sparkles, TrendingUp } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { LeagueMascot } from "@/components/ui/LeagueMascot";

// ─────────────────────────────────────────────────────────────────────────────
// ScorePreview — la carte officielle TalentRank.
// Visualise le système de score sur la home : score global, ligue, 4 dimensions,
// avatar du talent demo. C'est ce qui "matérialise" le QCM sans avoir à le
// jouer. Format inspiré d'un passeport / carte de membre — pas un dashboard.
// ─────────────────────────────────────────────────────────────────────────────

interface Dim {
  label: string;
  value: number;
  color: string;
}

const DIMS: Dim[] = [
  { label: "Technique",     value: 82, color: "#1CB0F6" },
  { label: "Fiabilité",     value: 91, color: "#58CC02" },
  { label: "Communication", value: 74, color: "#A78BFA" },
  { label: "Expérience",    value: 88, color: "#FFC800" },
];

// ─── Formule TalentRank — affichée dans le drawer ─────────────────────────
// Pondération officielle. Modifie ici si la formule évolue côté backend.
const FORMULA = [
  { label: "QCM officiel",                 weight: 55, color: "#1CB0F6" },
  { label: "Expérience pro",               weight: 15, color: "#FFC800" },
  { label: "Portfolio · Showreel",         weight: 15, color: "#A78BFA" },
  { label: "Missions · Historique",        weight: 10, color: "#58CC02" },
  { label: "Signaux comportementaux",      value: 5,   weight: 5, color: "#F472B6" },
] as const;

export function ScorePreview() {
  const [showFormula, setShowFormula] = useState(false);
  const handleShare = async () => {
    if (typeof navigator === "undefined") return;
    const text = "Je suis Or sur TalentRank (Top 5% mondial · 3D Generalist).";
    const url = window.location.origin;
    const nav = navigator as Navigator & {
      share?: (data: { title: string; text: string; url: string }) => Promise<void>;
    };
    if (typeof nav.share === "function") {
      try {
        await nav.share({ title: "Mon score TalentRank", text, url });
      } catch {
        /* user dismissed share */
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(`${text} — ${url}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
      className="mx-auto max-w-2xl"
    >
      {/* Eyebrow retiré — le badge "Aperçu" sur la card top-right suffit */}

      {/* Card */}
      <div
        className="relative overflow-hidden rounded-[28px] p-6 sm:p-7"
        style={{
          background: "linear-gradient(135deg, #FFF8E1 0%, #FFE8B0 100%)",
          boxShadow:
            "0 24px 60px -16px rgba(245,158,11,0.35), inset 0 1px 0 rgba(255,255,255,0.55), 0 0 0 1px rgba(0,0,0,0.04)",
        }}
      >
        {/* Top right: DEMO badge */}
        <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/90 ring-1 ring-inset ring-black/8 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">
          <Sparkles className="h-3 w-3" strokeWidth={2.8} />
          Aperçu
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 items-center">
          {/* Left: avatar + mascot + score */}
          <div className="text-center sm:text-left">
            {/* Avatar */}
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <span
                className="inline-grid h-12 w-12 place-items-center rounded-full font-display text-[16px] font-black text-white"
                style={{
                  background: "linear-gradient(160deg, #4D7EA8, #1F3A57)",
                  boxShadow:
                    "inset 0 2px 0 rgba(255,255,255,0.3), 0 6px 14px -4px rgba(0,0,0,0.25)",
                }}
              >
                JM
              </span>
              <div className="text-left">
                <p className="font-display text-[13px] font-black tracking-tight text-mist-50 leading-tight">
                  Jean Marie O.
                </p>
                <p className="text-[10.5px] font-semibold text-mist-300 leading-tight">
                  3D Generalist · Paris
                </p>
              </div>
            </div>

            {/* Score orb + mascot */}
            <div className="mt-5 flex items-end justify-center sm:justify-start gap-3">
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
                className="relative grid place-items-center rounded-full"
                style={{
                  width: 96,
                  height: 96,
                  background:
                    "radial-gradient(circle at 30% 25%, #FFE082, #F59E0B 60%, #B45309 100%)",
                  boxShadow:
                    "0 16px 32px -8px rgba(245,158,11,0.55), inset 0 3px 0 rgba(255,255,255,0.55), inset 0 -14px 22px -8px rgba(0,0,0,0.35)",
                }}
              >
                <span className="text-center">
                  <span className="block font-display text-[36px] font-black leading-none text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
                    <AnimatedNumber value={88} duration={1500} />
                  </span>
                  <span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-white/85 mt-0.5">
                    %
                  </span>
                </span>
              </motion.div>

              {/* Tier mascot peek (idle bobbing supprimé — doublon avec FinalCTA Lion) */}
              <div className="-mb-1">
                <LeagueMascot tier="senior" size={56} className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]" />
              </div>
            </div>

            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 ring-1 ring-inset ring-amber-300/40 px-3 py-1">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "#F59E0B", boxShadow: "0 0 6px #F59E0B" }}
              />
              <span className="font-display text-[12px] font-black text-amber-800">Or</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-700">
                · Top 5% mondial
              </span>
            </div>
          </div>

          {/* Right: 4 dimensions */}
          <div className="space-y-2.5">
            {DIMS.map((dim, i) => (
              <DimRow key={dim.label} dim={dim} delay={0.2 + i * 0.1} />
            ))}
          </div>
        </div>

        {/* Bottom: actions row */}
        <div className="mt-6 pt-4 border-t border-amber-700/15 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowFormula((v) => !v)}
            className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-mist-100 hover:text-mist-50 transition"
            aria-expanded={showFormula}
          >
            <Shield className="h-3.5 w-3.5 text-amber-700" strokeWidth={2.6} />
            Comment ce score est calculé ?
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${showFormula ? "rotate-180" : ""}`}
              strokeWidth={2.6}
            />
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[11.5px] font-bold uppercase tracking-[0.04em] bg-white/80 hover:bg-white ring-1 ring-inset ring-amber-700/20 text-amber-900 transition"
              aria-label="Partager mon score"
            >
              <Share2 className="h-3.5 w-3.5" strokeWidth={2.6} />
              Partager
            </button>
            <Link
              href="/qcm"
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[12px] font-bold uppercase tracking-[0.04em] text-white transition-all hover:brightness-110 active:translate-y-[1px]"
              style={{
                background: "linear-gradient(180deg, #2C3E55, #1A2535)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 10px -4px rgba(0,0,0,0.35)",
              }}
            >
              Commencer →
            </Link>
          </div>
        </div>

        {/* Formula drawer */}
        <AnimatePresence initial={false}>
          {showFormula && (
            <motion.div
              key="formula"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-4 rounded-2xl bg-white/70 ring-1 ring-inset ring-amber-700/15 p-4">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400 mb-3">
                  Formule officielle TalentRank
                </p>
                <ul className="space-y-2">
                  {FORMULA.map((f) => (
                    <li key={f.label} className="flex items-center gap-3">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ background: f.color, boxShadow: `0 0 6px ${f.color}` }}
                      />
                      <span className="flex-1 text-[12px] font-medium text-mist-100">
                        {f.label}
                      </span>
                      <span
                        className="font-display text-[13px] font-black tabular-nums"
                        style={{ color: f.color }}
                      >
                        {f.weight} %
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[10.5px] text-mist-400 leading-relaxed">
                  Score final = somme pondérée des 5 axes − pénalité anti-cheat (cap −60). Clamp 0-100.
                  Chaque évaluation se reverrouille 1 mois pour préserver la crédibilité.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function DimRow({ dim, delay }: { dim: Dim; delay: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[12px]">
        <span className="font-bold text-mist-100">{dim.label}</span>
        <span
          className="font-display font-black tabular-nums"
          style={{ color: dim.color }}
        >
          <AnimatedNumber value={dim.value} duration={1200} />
        </span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/60">
        <motion.div
          className="h-full rounded-full"
          style={{ background: dim.color }}
          initial={{ width: 0 }}
          whileInView={{ width: `${dim.value}%` }}
          viewport={{ once: true }}
          transition={{ delay, duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
