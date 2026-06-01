import { cn } from "@/lib/utils";

interface GridBackgroundProps {
  className?: string;
  fade?: boolean;
}

export function GridBackground({ className, fade = true }: GridBackgroundProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 bg-grid-faint bg-grid",
        fade && "[mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black_30%,transparent_85%)]",
        className,
      )}
      aria-hidden
    />
  );
}

export function NoiseOverlay({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 bg-noise opacity-[0.05] mix-blend-overlay",
        className,
      )}
      aria-hidden
    />
  );
}
