"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BadgeCheck, FileText, Lock, Mail, Phone, ShieldCheck } from "lucide-react";
import { Pill } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface Props {
  talentName: string;
  // In production, these come from `talent_private` row (RLS-gated). For the
  // demo we pass in a flag describing the viewer's permission level.
  viewerKind?: "anonymous" | "talent" | "verified-studio";
}

export function PrivateContactCard({ talentName, viewerKind = "anonymous" }: Props) {
  const unlocked = viewerKind === "verified-studio" || viewerKind === "talent";
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="glass-panel p-6 relative overflow-hidden">
      {/* Decorative lock pattern */}
      {!unlocked && (
        <div className="pointer-events-none absolute inset-0 opacity-[0.05] bg-grid-faint bg-grid" aria-hidden />
      )}

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-mist-500">
            Private contact &amp; CV
          </p>
          <p className="mt-1 text-[12.5px] text-mist-400">
            Visible to <span className="text-mist-50 font-medium">verified companies only</span>.
          </p>
        </div>
        <Pill tone={unlocked ? "green" : "amber"}>
          {unlocked ? <ShieldCheck className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
          {unlocked ? "Unlocked" : "Gated"}
        </Pill>
      </div>

      <div className="mt-5 space-y-3">
        <PrivateRow icon={Mail} label="Email">
          {unlocked && revealed ? (
            <span className="font-mono text-[13px] text-cyan-200">
              {talentName.toLowerCase().replace(/[^a-z]/g, ".")}@protonmail.com
            </span>
          ) : (
            <BlurredLine />
          )}
        </PrivateRow>
        <PrivateRow icon={Phone} label="Phone">
          {unlocked && revealed ? (
            <span className="font-mono text-[13px] text-cyan-200">+33 6 ●● ●● ●● ●● (verified)</span>
          ) : (
            <BlurredLine />
          )}
        </PrivateRow>
        <PrivateRow icon={FileText} label="CV">
          {unlocked && revealed ? (
            <a href="#" className="inline-flex items-center gap-1.5 text-[13px] text-cyan-300 hover:text-cyan-200">
              Download CV (PDF)
            </a>
          ) : (
            <BlurredLine />
          )}
        </PrivateRow>
      </div>

      <div className="hairline my-5" />

      {unlocked ? (
        <div className="space-y-3">
          {!revealed && (
            <button
              onClick={() => setRevealed(true)}
              className="w-full rounded-xl bg-cyan-400/10 ring-1 ring-inset ring-cyan-400/30 text-cyan-200 hover:bg-cyan-400/15 px-3 py-2.5 text-[13px] font-medium transition"
            >
              Reveal contact details
            </button>
          )}
          <p className="text-[11.5px] text-mist-500 leading-relaxed">
            Your studio is verified and has an active relationship with this talent (shortlist or
            sent proposal). All views are logged.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-[12.5px] text-mist-300 leading-relaxed">
            Contact, phone and CV stay private until your company is{" "}
            <span className="text-mist-50 font-medium">verified</span> and you&apos;ve sent a private
            interview proposal — no exception, no bulk scraping.
          </p>
          <ButtonLink href="/sign-up?role=studio" size="sm" variant="amber" className="w-full">
            <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2.4} />
            Verify your company
          </ButtonLink>
        </div>
      )}
    </div>
  );
}

function PrivateRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-ink-850 ring-1 ring-inset ring-ink-700/30 px-3 py-2.5">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-ink-850 ring-1 ring-inset ring-ink-700/30">
        <Icon className="h-3.5 w-3.5 text-mist-300" strokeWidth={2.2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-[0.18em] text-mist-500">{label}</p>
        <div className="mt-0.5">{children}</div>
      </div>
    </div>
  );
}

function BlurredLine() {
  return (
    <motion.span
      initial={{ opacity: 0.6 }}
      animate={{ opacity: [0.6, 0.85, 0.6] }}
      transition={{ duration: 2.4, repeat: Infinity }}
      className={cn(
        "inline-block h-3.5 w-32 rounded",
        "bg-gradient-to-r from-white/15 via-white/25 to-white/15",
        "blur-[3px] select-none",
      )}
      aria-hidden
    />
  );
}
