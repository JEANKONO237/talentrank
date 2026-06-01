import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Aurora } from "@/components/effects/Aurora";
import { GridBackground } from "@/components/effects/GridBackground";

interface AuthShellProps {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function AuthShell({ eyebrow, title, subtitle, footer, children }: AuthShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <Aurora intensity="normal" />
      <GridBackground />

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col px-5 pt-28 pb-12">
        <Link href="/" className="mx-auto inline-flex items-center gap-2">
          <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-cyan-400 to-amber-400 shadow-glow-sm">
            <Sparkles className="h-4 w-4 text-white" strokeWidth={2.6} />
          </span>
          <span className="font-display text-[17px] font-semibold tracking-tight">TalentRank</span>
        </Link>

        <div className="mt-12 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-mist-500">{eyebrow}</p>
          <h1 className="mt-3 font-display text-[28px] font-semibold tracking-tight text-mist-50">{title}</h1>
          {subtitle && <p className="mt-3 text-[14px] text-mist-400">{subtitle}</p>}
        </div>

        <div className="mt-10 glass-panel p-7">{children}</div>

        {footer && <div className="mt-6 text-center text-[13px] text-mist-400">{footer}</div>}
      </div>
    </div>
  );
}
