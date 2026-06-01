"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  /** Target value to count up to. */
  value: number;
  /** Duration of the count-up in ms. Default 1400ms. */
  duration?: number;
  /** Locale used for grouping (default "fr-FR" → 12 842 with thin space). */
  locale?: string;
  /** Decimal places. Default 0. */
  decimals?: number;
  /** Optional prefix / suffix rendered inline (e.g. "+", "%"). */
  prefix?: string;
  suffix?: string;
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// AnimatedNumber — counts from 0 to `value` once visible.
// Uses IntersectionObserver so the count fires when the element scrolls in,
// not on mount (otherwise we'd see numbers that already finished counting
// before the user reaches them). SSR-safe: renders the final value on the
// server, animates on the client.
//
// Easing: ease-out cubic — feels punchy at the start, settles smoothly.
// ─────────────────────────────────────────────────────────────────────────────

export function AnimatedNumber({
  value,
  duration = 1400,
  locale = "fr-FR",
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState(value); // server-side renders the final value

  useEffect(() => {
    // On mount client-side, reset to 0 so the count-up starts fresh.
    setDisplay(0);
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let startedAt = 0;
    let observer: IntersectionObserver | null = null;
    let triggered = false;

    const tick = (now: number) => {
      if (!startedAt) startedAt = now;
      const elapsed = now - startedAt;
      const t = Math.min(1, elapsed / duration);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setDisplay(value);
    };

    const start = () => {
      if (triggered) return;
      triggered = true;
      raf = requestAnimationFrame(tick);
    };

    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              start();
              observer?.disconnect();
              break;
            }
          }
        },
        { threshold: 0.2 },
      );
      observer.observe(el);
    } else {
      // Old browsers — just animate on mount.
      start();
    }

    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
    };
  }, [value, duration]);

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(display);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
