import { cn } from "@/lib/utils";

interface FlagProps {
  /** ISO 3166-1 alpha-2 (e.g. "FR", "CM", "JP"). Case-insensitive. */
  code: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** When true, the country code is shown in monospace next to the flag. */
  showCode?: boolean;
  /** Round the corners. Default true. */
  rounded?: boolean;
  /** Title attribute for the flag image. */
  title?: string;
  className?: string;
}

const sizes = {
  xs: { w: 14, h: 10, label: "text-[9px]",   gap: "gap-1" },
  sm: { w: 18, h: 13, label: "text-[10.5px]", gap: "gap-1.5" },
  md: { w: 24, h: 18, label: "text-[11.5px]", gap: "gap-1.5" },
  lg: { w: 32, h: 24, label: "text-[12.5px]", gap: "gap-2" },
  xl: { w: 44, h: 33, label: "text-[14px]",   gap: "gap-2.5" },
};

// Real country flags via flagcdn.com — a free CDN that serves clean PNG / SVG
// flags by ISO code. We use the `w40` and `w80` PNG variants for crisp 1x/2x.
// Emoji flags are unreliable (Windows doesn't ship a flag emoji font), so we
// replace them with real images everywhere we want a flag to actually render.

export function Flag({
  code,
  size = "md",
  showCode = false,
  rounded = true,
  title,
  className,
}: FlagProps) {
  const s = sizes[size];
  const lower = code.toLowerCase();

  return (
    <span className={cn("inline-flex items-center", s.gap, className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://flagcdn.com/w40/${lower}.png`}
        srcSet={`https://flagcdn.com/w80/${lower}.png 2x`}
        width={s.w}
        height={s.h}
        alt={title ?? `${code.toUpperCase()} flag`}
        title={title ?? code.toUpperCase()}
        className={cn(
          "block shrink-0 object-cover ring-1 ring-black/10 shadow-[0_1px_2px_rgba(0,0,0,0.08)]",
          rounded ? "rounded-[3px]" : "",
        )}
        loading="lazy"
        decoding="async"
      />
      {showCode && (
        <span className={cn("font-mono font-bold tracking-[0.06em] text-mist-400", s.label)}>
          {code.toUpperCase()}
        </span>
      )}
    </span>
  );
}
