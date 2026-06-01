"use client";

import { motion } from "framer-motion";
import { tierForPercentile } from "@/lib/tiers";
import { cn } from "@/lib/utils";

interface ScoreRingProps {
  score: number;
  percentile: number;
  size?: number;
  thickness?: number;
  className?: string;
}

export function ScoreRing({ score, percentile, size = 160, thickness = 10, className }: ScoreRingProps) {
  const tier = tierForPercentile(percentile);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * (score / 100);

  return (
    <div className={cn("relative grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`grad-${score}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={tier.color} />
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgb(255 255 255 / 0.06)"
          strokeWidth={thickness}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#grad-${score})`}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: c - dash }}
          transition={{ duration: 1.4, ease: [0.2, 0.7, 0.2, 1] }}
          viewport={{ once: true }}
          style={{ filter: `drop-shadow(0 0 8px ${tier.color}80)` }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="flex flex-col items-center">
          <span className="font-display text-[44px] leading-none font-semibold tracking-tight text-mist-50">
            {score}
          </span>
          <span className="mt-1 text-[10px] uppercase tracking-[0.18em] text-mist-400">Talent Score</span>
        </div>
      </div>
    </div>
  );
}
