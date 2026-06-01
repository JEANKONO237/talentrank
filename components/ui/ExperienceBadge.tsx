import { cn } from "@/lib/utils";
import { experienceClassForYears } from "@/lib/experience-class";

interface ExperienceBadgeProps {
  /** Years of experience — drives the rank letter. */
  years: number;
  size?: "sm" | "md" | "lg";
  withYears?: boolean;
  className?: string;
}

const sizes = {
  sm: { wrap: "h-7 min-w-[36px] px-2", letter: "text-[13px]", years: "text-[9px]" },
  md: { wrap: "h-9 min-w-[44px] px-2.5", letter: "text-[16px]", years: "text-[10px]" },
  lg: { wrap: "h-12 min-w-[56px] px-3", letter: "text-[22px]", years: "text-[11px]" },
};

export function ExperienceBadge({ years, size = "md", withYears = false, className }: ExperienceBadgeProps) {
  const c = experienceClassForYears(years);
  const s = sizes[size];

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-xl font-display font-black text-white tabular-nums",
        s.wrap,
        className,
      )}
      style={{
        background: `linear-gradient(180deg, ${c.highlight}, ${c.color} 55%, ${c.color}cc 100%)`,
        boxShadow: `0 4px 0 0 ${c.color}99, inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -6px 12px -4px rgba(0,0,0,0.25)`,
        textShadow: "0 1px 0 rgba(0,0,0,0.25)",
      }}
      title={`${c.label} — ${c.description}`}
    >
      <span className={cn("leading-none", s.letter)}>{c.id}</span>
      {withYears && (
        <span className={cn("opacity-90 leading-none font-bold", s.years)}>
          {years}y
        </span>
      )}
    </span>
  );
}
