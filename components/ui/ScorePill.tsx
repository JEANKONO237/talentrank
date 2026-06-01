import { cn } from "@/lib/utils";
import { tierForPercentile } from "@/lib/tiers";

interface ScorePillProps {
  score: number;
  percentile?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function ScorePill({ score, percentile, size = "md", showLabel = true, className }: ScorePillProps) {
  const tier = percentile != null ? tierForPercentile(percentile) : null;

  const sizes = {
    sm: { wrap: "h-7 px-2 gap-1.5", num: "text-[13px]", label: "text-[10px]" },
    md: { wrap: "h-9 px-2.5 gap-2", num: "text-[15px]", label: "text-[11px]" },
    lg: { wrap: "h-11 px-3 gap-2.5", num: "text-[18px]", label: "text-[12px]" },
  };
  const s = sizes[size];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-ink-900/80 ring-1 ring-inset ring-ink-700/40 backdrop-blur",
        s.wrap,
        className,
      )}
    >
      <span
        className="grid place-items-center rounded-full px-1 font-display font-semibold text-white"
        style={{ background: tier?.color ?? "#22D3EE", boxShadow: `0 0 12px -2px ${tier?.color ?? "#22D3EE"}80` }}
      >
        <span className={cn("tracking-tight", s.num)}>{score}</span>
      </span>
      {showLabel && (
        <span className={cn("uppercase tracking-[0.14em] font-medium text-mist-300", s.label)}>
          {tier ? tier.range : "Score"}
        </span>
      )}
    </span>
  );
}
