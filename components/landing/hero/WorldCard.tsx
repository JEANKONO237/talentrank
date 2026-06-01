"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { LeagueMascot } from "@/components/ui/LeagueMascot";
import { cn } from "@/lib/utils";
import type { World } from "./worlds";

// ─────────────────────────────────────────────────────────────────────────────
// WorldCard — une catégorie sur la grille Hero. Mascot wiggle au hover/focus,
// halo accent, badge hot si défini. Le glyph emoji a été retiré (audit mascot-
// designer : doublon visuel avec la mascotte SVG bottom-right).
// ─────────────────────────────────────────────────────────────────────────────

export function WorldCard({ world, delay }: { world: World; delay: number }) {
  const isFeatured = world.span?.includes("row-span-2");
  const [isHover, setIsHover] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.94 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay, ease: [0.2, 0.7, 0.2, 1] }}
      className={world.span}
    >
      <Link
        href={world.href}
        className="group relative block h-full w-full overflow-hidden rounded-[28px] ring-1 ring-inset ring-ink-700/8 shadow-card transition-all duration-300 hover:-translate-y-[5px] hover:scale-[1.02] text-left"
        style={{ background: world.bg }}
        onMouseEnter={(e) => {
          setIsHover(true);
          e.currentTarget.style.boxShadow = `0 22px 50px -16px ${world.accent}55, 0 6px 0 0 rgba(0,0,0,0.06), 0 16px 36px -14px rgba(0,0,0,0.10)`;
        }}
        onMouseLeave={(e) => {
          setIsHover(false);
          e.currentTarget.style.boxShadow = "";
        }}
        onFocus={() => setIsHover(true)}
        onBlur={() => setIsHover(false)}
      >
        {/* Halo accent */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full opacity-40 blur-3xl transition-opacity duration-300 group-hover:opacity-70"
          style={{ background: world.accent }}
        />

        {/* Hot badge */}
        {world.badge && (
          <motion.span
            initial={{ scale: 0, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: delay + 0.4, type: "spring", stiffness: 360, damping: 20 }}
            className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.14em] text-mist-100 shadow-card"
          >
            {world.badge}
          </motion.span>
        )}

        {/* Mascot wiggle au hover/focus, float idle si featured */}
        <motion.span
          animate={
            isHover
              ? {
                  rotate: [0, -10, 8, -6, 4, 0],
                  y: [0, -10, -6, -10, -4, 0],
                  scale: [1, 1.12, 1.08, 1.12, 1.06, 1.1],
                }
              : isFeatured
                ? { y: [0, -4, 0], rotate: 0, scale: 1 }
                : { y: 0, rotate: 0, scale: 1 }
          }
          transition={
            isHover
              ? { duration: 0.85, ease: [0.2, 0.7, 0.2, 1], times: [0, 0.2, 0.4, 0.6, 0.8, 1] }
              : isFeatured
                ? { duration: 3.4, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.3 }
          }
          className={cn(
            "absolute pointer-events-none",
            isFeatured ? "bottom-3 right-3" : "bottom-2 right-2",
          )}
          style={{ transformOrigin: "50% 80%" }}
        >
          <LeagueMascot
            tier={world.mascot}
            size={isFeatured ? 110 : 64}
            className="drop-shadow-[0_8px_14px_rgba(0,0,0,0.22)]"
          />
        </motion.span>

        {/* Text block */}
        <div className={cn("relative p-5", isFeatured ? "sm:p-7" : "")}>
          <h3
            className={cn(
              "font-display font-black tracking-tight text-mist-50 leading-tight",
              isFeatured ? "text-[22px] sm:text-[28px]" : "text-[15px] sm:text-[16px]",
            )}
          >
            {world.name}
          </h3>
          <p
            className={cn(
              "mt-1.5 text-mist-300 leading-relaxed",
              isFeatured
                ? "text-[13px] sm:text-[13.5px] max-w-[220px]"
                : "text-[11.5px] max-w-[160px]",
            )}
          >
            {world.roles}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
