import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BADGES, TONE_STYLES, type BadgeId } from "@/lib/badges";

interface BadgeProps {
  id: BadgeId;
  size?: "sm" | "md";
  withDot?: boolean;
  className?: string;
}

export function Badge({ id, size = "sm", withDot = false, className }: BadgeProps) {
  const def = BADGES[id];
  const Icon = def.icon;
  const tone = TONE_STYLES[def.tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full ring-1 font-medium",
        tone.bg,
        tone.text,
        tone.ring,
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-[12px]",
        className,
      )}
    >
      {withDot ? (
        <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse-glow", tone.dot)} />
      ) : (
        <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} strokeWidth={2.4} />
      )}
      <span className="tracking-[-0.005em]">{def.label}</span>
    </span>
  );
}

interface PillProps {
  children: ReactNode;
  tone?: "neutral" | "cyan" | "amber" | "green" | "violet";
  className?: string;
}

export function Pill({ children, tone = "neutral", className }: PillProps) {
  const tones = {
    neutral: "bg-ink-850 text-mist-200 ring-ink-700/40",
    cyan: "bg-cyan-400/10 text-cyan-300 ring-cyan-400/20",
    amber: "bg-amber-400/10 text-amber-300 ring-amber-400/20",
    green: "bg-signal-green/10 text-signal-green ring-signal-green/20",
    violet: "bg-violet-400/10 text-violet-300 ring-violet-400/20",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
