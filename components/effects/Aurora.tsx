import { cn } from "@/lib/utils";

interface AuroraProps {
  className?: string;
  intensity?: "subtle" | "normal" | "strong";
}

export function Aurora({ className, intensity = "normal" }: AuroraProps) {
  const opacities = {
    subtle: { a: 0.18, b: 0.1, c: 0.08 },
    normal: { a: 0.32, b: 0.18, c: 0.12 },
    strong: { a: 0.5, b: 0.28, c: 0.18 },
  }[intensity];

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      {/* Cyan blob */}
      <div
        className="absolute -left-[10%] top-[-30%] h-[60vh] w-[60vw] rounded-full blur-[120px]"
        style={{ background: `radial-gradient(circle, rgb(34 211 238 / ${opacities.a}), transparent 60%)` }}
      />
      {/* Amber blob */}
      <div
        className="absolute right-[-10%] top-[10%] h-[55vh] w-[55vw] rounded-full blur-[120px]"
        style={{ background: `radial-gradient(circle, rgb(245 158 11 / ${opacities.b}), transparent 60%)` }}
      />
      {/* Violet blob */}
      <div
        className="absolute bottom-[-20%] left-[20%] h-[50vh] w-[50vw] rounded-full blur-[140px]"
        style={{ background: `radial-gradient(circle, rgb(167 139 250 / ${opacities.c}), transparent 60%)` }}
      />
    </div>
  );
}
