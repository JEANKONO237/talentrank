"use client";

import { motion } from "framer-motion";
import type { Talent } from "@/lib/mock-talents";

interface ScoreBreakdownProps {
  talent: Talent;
}

export function ScoreBreakdown({ talent }: ScoreBreakdownProps) {
  const rows = [
    { label: "Experience", value: Math.min(25, Math.round((talent.yearsExperience / 12) * 25)), max: 25 },
    { label: "Portfolio depth", value: Math.min(20, talent.portfolio.length * 4), max: 20 },
    { label: "Showreel", value: talent.showreelUrl ? 15 : 6, max: 15 },
    { label: "Software mastery", value: Math.min(15, talent.software.length * 2), max: 15 },
    { label: "Endorsements", value: Math.min(10, Math.round(talent.endorsements / 5)), max: 10 },
    { label: "Activity & response", value: Math.max(2, 10 - Math.round(talent.responseHours / 5)), max: 10 },
    { label: "Profile completion", value: 5, max: 5 },
  ];

  return (
    <div className="space-y-3.5">
      {rows.map((r, i) => {
        const pct = (r.value / r.max) * 100;
        return (
          <div key={r.label}>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-mist-300">{r.label}</span>
              <span className="font-mono text-mist-400">
                {r.value}
                <span className="text-mist-600"> / {r.max}</span>
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-850">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${pct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: i * 0.06, ease: [0.2, 0.7, 0.2, 1] }}
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-amber-400"
                style={{ boxShadow: "0 0 12px -2px rgb(34 211 238 / 0.5)" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
