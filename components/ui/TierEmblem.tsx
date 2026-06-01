import { cn } from "@/lib/utils";
import { TIERS, type TierId } from "@/lib/tiers";
import { LeagueMascot } from "./LeagueMascot";

interface TierEmblemProps {
  tier: TierId;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  withLabel?: boolean;
  className?: string;
}

// Pixel sizes for the wrap and the mascot inside. Mascot is ~58% of the wrap
// so the colored ring is visible around it (the "podium" / "league ring").
const SIZES: Record<NonNullable<TierEmblemProps["size"]>, { wrap: number; mascot: number }> = {
  xs: { wrap: 28, mascot: 18 },
  sm: { wrap: 40, mascot: 26 },
  md: { wrap: 56, mascot: 38 },
  lg: { wrap: 80, mascot: 56 },
  xl: { wrap: 112, mascot: 80 },
};

export function TierEmblem({ tier, size = "md", withLabel = false, className }: TierEmblemProps) {
  const t = TIERS[tier];
  const s = SIZES[size];

  return (
    <div className={cn("inline-flex flex-col items-center", className)}>
      <span
        className="relative grid place-items-center rounded-full transition-transform hover:scale-[1.05]"
        style={{
          width: s.wrap,
          height: s.wrap,
          background: `radial-gradient(circle at 30% 25%, ${t.highlight}, ${t.color} 65%, ${t.color}cc 100%)`,
          boxShadow: `0 8px 20px -6px ${t.color}80, inset 0 2px 0 rgba(255,255,255,0.55), inset 0 -10px 18px -8px rgba(0,0,0,0.35)`,
        }}
        aria-label={`${t.label} — ${t.animal}`}
      >
        {/* Aura ring */}
        <span
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            boxShadow: `inset 0 0 0 2px rgba(255,255,255,0.55), 0 0 16px -2px ${t.color}aa`,
          }}
          aria-hidden
        />
        {/* Hand-built SVG mascot — no emoji */}
        <span
          className="relative z-[1] drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]"
          aria-hidden
        >
          <LeagueMascot tier={tier} size={s.mascot} />
        </span>
      </span>
      {withLabel && (
        <div
          className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-2.5 py-1 ring-1 ring-inset"
          style={{ borderColor: t.color }}
        >
          <span
            className="text-[11px] font-bold uppercase tracking-[0.14em]"
            style={{ color: t.color }}
          >
            {t.label}
          </span>
        </div>
      )}
    </div>
  );
}
