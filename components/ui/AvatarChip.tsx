import { cn } from "@/lib/utils";
import type { ProfessionCategoryId } from "@/lib/professions";
import { iconForCategory } from "@/lib/profession-icons";

interface AvatarChipProps {
  initials: string;
  gradient: string;
  /** Profession-category icon overlay (bottom-right corner). */
  category?: ProfessionCategoryId;
  /** ISO country code — renders a real flag PNG via flagcdn.com.
   *  When set, the flag REPLACES the category chip at the bottom-right. */
  countryCode?: string;
  /** Legacy emoji flag (kept for backwards compat — not used when countryCode set). */
  flag?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  /** Subtle pulsing ring (for "active" / "available" state). */
  pulse?: boolean;
}

const sizeMap = {
  sm: {
    wrap: "h-10 w-10",
    text: "text-[13px]",
    chip: "h-4 w-4 -bottom-0.5 -right-0.5",
    chipIcon: "h-2.5 w-2.5",
    flagW: 16, flagH: 12, flagPos: "-bottom-0.5 -right-1",
  },
  md: {
    wrap: "h-14 w-14",
    text: "text-[17px]",
    chip: "h-5 w-5 -bottom-0.5 -right-0.5",
    chipIcon: "h-3 w-3",
    flagW: 22, flagH: 16, flagPos: "-bottom-1 -right-1.5",
  },
  lg: {
    wrap: "h-20 w-20",
    text: "text-[22px]",
    chip: "h-6 w-6 -bottom-1 -right-1",
    chipIcon: "h-3.5 w-3.5",
    flagW: 28, flagH: 21, flagPos: "-bottom-1 -right-2",
  },
  xl: {
    wrap: "h-28 w-28",
    text: "text-[30px]",
    chip: "h-8 w-8 -bottom-1.5 -right-1.5",
    chipIcon: "h-4 w-4",
    flagW: 36, flagH: 27, flagPos: "-bottom-2 -right-2",
  },
  "2xl": {
    wrap: "h-36 w-36",
    text: "text-[38px]",
    chip: "h-10 w-10 -bottom-2 -right-2",
    chipIcon: "h-5 w-5",
    flagW: 44, flagH: 33, flagPos: "-bottom-2.5 -right-2.5",
  },
};

export function AvatarChip({
  initials,
  gradient,
  category,
  countryCode,
  flag,
  size = "md",
  className,
  pulse,
}: AvatarChipProps) {
  const s = sizeMap[size];
  const Icon = category ? iconForCategory(category) : null;
  const lowerCode = countryCode?.toLowerCase();

  return (
    <span className={cn("relative inline-block shrink-0", className)}>
      {pulse && (
        <span className="absolute inset-0 rounded-full bg-cyan-400/30 animate-pulse-glow" aria-hidden />
      )}
      <span
        className={cn(
          "relative grid place-items-center rounded-full font-display font-semibold text-white",
          "bg-gradient-to-br shadow-[inset_0_2px_0_0_rgb(255_255_255_/_0.25),inset_0_-12px_28px_-12px_rgb(0_0_0_/_0.5)]",
          "ring-[3px] ring-ink-950",
          s.wrap,
          s.text,
          gradient,
        )}
        style={{ letterSpacing: "-0.02em" }}
      >
        <span className="relative z-[1] mix-blend-screen drop-shadow-[0_1px_0_rgba(0,0,0,0.4)]">
          {initials}
        </span>
        <span className="pointer-events-none absolute inset-0 rounded-full bg-noise opacity-[0.08] mix-blend-overlay" />
      </span>

      {/* Bottom-right badge: country flag (priority) → profession icon (fallback) */}
      {lowerCode ? (
        <span
          className={cn(
            "absolute grid place-items-center rounded-[5px] bg-ink-900 p-[2px] ring-[2.5px] ring-ink-950 shadow-md",
            s.flagPos,
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://flagcdn.com/w40/${lowerCode}.png`}
            srcSet={`https://flagcdn.com/w80/${lowerCode}.png 2x`}
            width={s.flagW}
            height={s.flagH}
            alt={`${countryCode?.toUpperCase()} flag`}
            className="block rounded-[3px] object-cover"
            loading="lazy"
            decoding="async"
          />
        </span>
      ) : flag ? (
        <span
          className={cn(
            "absolute grid place-items-center rounded-full bg-ink-950 ring-2 ring-ink-950 leading-none",
            "-bottom-1 -right-1 text-[14px]",
          )}
          style={{ padding: 2 }}
        >
          {flag}
        </span>
      ) : Icon ? (
        <span
          className={cn(
            "absolute grid place-items-center rounded-full bg-ink-900 ring-[2.5px] ring-ink-950 shadow-md",
            s.chip,
          )}
        >
          <Icon className={cn("text-cyan-300", s.chipIcon)} strokeWidth={2.6} />
        </span>
      ) : null}
    </span>
  );
}
