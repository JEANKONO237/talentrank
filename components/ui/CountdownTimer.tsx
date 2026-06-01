"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  /** Epoch ms at which the countdown ends. */
  expiresAt: number;
  /** Called once when the countdown crosses zero. */
  onExpire?: () => void;
  /** Render style: `xl` (hero lock), `md` (inline pill), `sm` (tiny tag). */
  size?: "sm" | "md" | "xl";
  /** Show ms-level seconds (true) or stop at minutes (false). */
  showSeconds?: boolean;
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CountdownTimer — re-renders every second to display the remaining time
// before `expiresAt`. SSR-safe: starts as `null` on the server and hydrates
// the moment the client mounts.
//
// Format: "Xj Yh Zm Ws" — drops leading zero segments when not relevant
// (e.g. "2h 14m 03s" once we're under a day).
// ─────────────────────────────────────────────────────────────────────────────

export function CountdownTimer({
  expiresAt,
  onExpire,
  size = "md",
  showSeconds = true,
  className,
}: CountdownTimerProps) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (now === null) return;
    if (now >= expiresAt && onExpire) onExpire();
  }, [now, expiresAt, onExpire]);

  if (now === null) {
    return <span className={cn(SIZE[size].wrap, className)}>—</span>;
  }

  const remaining = Math.max(0, expiresAt - now);
  if (remaining === 0) {
    return (
      <span
        className={cn(SIZE[size].wrap, "text-emerald-600", className)}
        role="status"
        aria-live="polite"
      >
        Disponible
      </span>
    );
  }

  const seconds = Math.floor(remaining / 1000) % 60;
  const minutes = Math.floor(remaining / 1000 / 60) % 60;
  const hours = Math.floor(remaining / 1000 / 60 / 60) % 24;
  const days = Math.floor(remaining / 1000 / 60 / 60 / 24);

  // Screen-reader friendly announcement — fires once per minute (not every
  // second, which would be deafening). The visible segments below are
  // marked aria-hidden since the announcement covers them.
  const srLabel = `Temps restant : ${days > 0 ? `${days} jour${days > 1 ? "s" : ""} ` : ""}${
    hours > 0 || days > 0 ? `${hours} heure${hours > 1 ? "s" : ""} ` : ""
  }${minutes} minute${minutes > 1 ? "s" : ""}`;

  return (
    <span className={cn("inline-flex items-baseline gap-1 tabular-nums", SIZE[size].wrap, className)}>
      <span className="sr-only" role="timer" aria-live="off">
        {srLabel}
      </span>
      <span aria-hidden className="inline-flex items-baseline gap-1">
        {days > 0 && <Segment label="j" value={days} size={size} />}
        {(days > 0 || hours > 0) && <Segment label="h" value={hours} pad size={size} />}
        <Segment label="m" value={minutes} pad size={size} />
        {showSeconds && <Segment label="s" value={seconds} pad size={size} />}
      </span>
    </span>
  );
}

const SIZE: Record<NonNullable<CountdownTimerProps["size"]>, { wrap: string; value: string; label: string }> = {
  sm: { wrap: "text-[12px]", value: "font-display font-black text-[13px]", label: "text-[10px] uppercase tracking-[0.12em] text-mist-400" },
  md: { wrap: "text-[14px]", value: "font-display font-black text-[16px]", label: "text-[10.5px] uppercase tracking-[0.14em] text-mist-400" },
  xl: { wrap: "text-[18px]", value: "font-display font-black text-[42px] sm:text-[52px]", label: "text-[11px] uppercase tracking-[0.2em] text-mist-400" },
};

function Segment({
  value,
  label,
  pad,
  size,
}: {
  value: number;
  label: string;
  pad?: boolean;
  size: NonNullable<CountdownTimerProps["size"]>;
}) {
  const s = SIZE[size];
  const display = pad ? String(value).padStart(2, "0") : String(value);
  return (
    <span className="inline-flex items-baseline gap-0.5">
      <span className={s.value}>{display}</span>
      <span className={s.label}>{label}</span>
    </span>
  );
}
