import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { AvatarChip } from "@/components/ui/AvatarChip";
import { findCountry } from "@/lib/countries";
import { getDiscipline } from "@/lib/disciplines";
import { PROFESSIONS } from "@/lib/professions";
import { tierForPercentile } from "@/lib/tiers";
import type { Talent } from "@/lib/mock-talents";
import { cn } from "@/lib/utils";

export function RankingRow({ talent, index }: { talent: Talent; index: number }) {
  const country = findCountry(talent.countryCode);
  const discipline = getDiscipline(talent.discipline);
  const profession = talent.professionId
    ? PROFESSIONS.find((p) => p.id === talent.professionId)
    : undefined;
  const roleLabel = profession?.short ?? discipline.short;
  const tier = tierForPercentile(talent.percentile);
  const tierColor =
    tier.id === "elite" ? "#F59E0B" : tier.id === "senior" ? "#22D3EE" : "#A78BFA";

  return (
    <Link
      href={`/talent/${talent.slug}`}
      className={cn(
        "group flex items-center gap-4 rounded-2xl px-3 py-2.5 transition-all",
        "border border-ink-700/40 bg-ink-875/40 hover:bg-ink-800/70 hover:border-white/[0.10]",
        "hover:translate-x-0.5",
      )}
    >
      {/* Rank — big & friendly */}
      <div className="grid w-9 shrink-0 place-items-center">
        <span className="font-display text-[18px] font-semibold tabular-nums text-mist-500 group-hover:text-mist-300">
          {index + 1}
        </span>
      </div>

      <AvatarChip
        initials={talent.initials}
        gradient={`bg-gradient-to-br ${talent.avatarGradient}`}
        countryCode={country.code}
        size="md"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-display text-[15px] font-semibold tracking-tight text-mist-50">
            {talent.name}
          </p>
          {talent.trending && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-300">
              <TrendingUp className="h-3 w-3" /> Rising
            </span>
          )}
        </div>
        <p className="truncate text-[12px] text-mist-400">
          {roleLabel} · {talent.city ?? country.name}
        </p>
      </div>

      <span
        className="hidden sm:inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset"
        style={{
          background: `${tierColor}15`,
          color: tierColor,
          borderColor: `${tierColor}50`,
        }}
      >
        {tier.range}
      </span>

      {/* Score orb */}
      <span
        className="inline-grid h-10 w-10 place-items-center rounded-full font-display font-semibold text-white text-[14px]"
        style={{
          background: `radial-gradient(circle at 30% 25%, ${tierColor}, ${tierColor}cc 65%, ${tierColor}55 100%)`,
          boxShadow: `0 6px 18px -6px ${tierColor}80, inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -8px 14px -8px rgba(0,0,0,0.4)`,
        }}
      >
        {talent.score}
      </span>
    </Link>
  );
}
