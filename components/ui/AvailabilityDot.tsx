import { cn } from "@/lib/utils";
import type { Availability } from "@/lib/mock-talents";

interface AvailabilityDotProps {
  status: Availability;
  showLabel?: boolean;
  className?: string;
}

const config: Record<Availability, { label: string; color: string; ring: string; text: string }> = {
  available: { label: "Available now", color: "bg-signal-green", ring: "ring-signal-green/30", text: "text-signal-green" },
  open: { label: "Open to offers", color: "bg-cyan-400", ring: "ring-cyan-400/30", text: "text-cyan-300" },
  "on-mission": { label: "On mission", color: "bg-amber-400", ring: "ring-amber-400/30", text: "text-amber-300" },
  unavailable: { label: "Unavailable", color: "bg-mist-500", ring: "ring-mist-500/30", text: "text-mist-400" },
  hired: { label: "Hired", color: "bg-mist-400", ring: "ring-mist-400/30", text: "text-mist-300" },
};

export function AvailabilityDot({ status, showLabel = true, className }: AvailabilityDotProps) {
  const c = config[status];
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="relative inline-flex h-2 w-2">
        {status === "available" && (
          <span className={cn("absolute inset-0 rounded-full opacity-70 animate-ping", c.color)} />
        )}
        <span className={cn("relative inline-block h-2 w-2 rounded-full ring-2", c.color, c.ring)} />
      </span>
      {showLabel && <span className={cn("text-[11px] font-medium tracking-tight", c.text)}>{c.label}</span>}
    </span>
  );
}
