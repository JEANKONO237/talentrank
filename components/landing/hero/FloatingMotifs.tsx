"use client";

import { motion } from "framer-motion";

// ─────────────────────────────────────────────────────────────────────────────
// FloatingMotifs — 2 particules d'ambiance pour casser le blanc.
// Audit motion-designer P0-3 : réduit 5 → 2.
// Gardé : cyan top-right (brand primaire) + amber bottom-left (brand 2nd).
// ─────────────────────────────────────────────────────────────────────────────

const MOTIFS = [
  { x: "92%", y: "20%", color: "#1CB0F6", size: 8, delay: 0.6 },
  { x: "8%", y: "78%", color: "#FFC800", size: 7, delay: 1.4 },
] as const;

export function FloatingMotifs() {
  return (
    <>
      {MOTIFS.map((m, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="pointer-events-none absolute rounded-full"
          style={{
            left: m.x,
            top: m.y,
            width: m.size,
            height: m.size,
            background: m.color,
            boxShadow: `0 0 16px ${m.color}99`,
            opacity: 0.55,
          }}
          animate={{
            y: [0, -10, 0],
            opacity: [0.35, 0.7, 0.35],
          }}
          transition={{
            duration: 4 + i * 0.4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: m.delay,
          }}
        />
      ))}
    </>
  );
}
