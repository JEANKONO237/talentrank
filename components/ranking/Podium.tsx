import Link from "next/link";
import { AvatarChip } from "@/components/ui/AvatarChip";
import { TierEmblem } from "@/components/ui/TierEmblem";
import { Flag } from "@/components/ui/Flag";
import { findCountry } from "@/lib/countries";
import { tierForPercentile } from "@/lib/tiers";
import type { Talent } from "@/lib/mock-talents";
import { cn } from "@/lib/utils";

interface PodiumProps {
  first: Talent;
  second: Talent;
  third: Talent;
}

export function Podium({ first, second, third }: PodiumProps) {
  return (
    <div className="grid items-end gap-4 sm:grid-cols-3 max-w-3xl mx-auto">
      <Spot talent={second} place={2} className="sm:translate-y-10" />
      <Spot talent={first} place={1} />
      <Spot talent={third} place={3} className="sm:translate-y-16" />
    </div>
  );
}

const placeColors = {
  1: { color: "#F59E0B", highlight: "#FCD34D" },
  2: { color: "#94A3B8", highlight: "#E2E8F0" },
  3: { color: "#C97A3B", highlight: "#F4B26A" },
} as const;

function Spot({ talent, place, className }: { talent: Talent; place: 1 | 2 | 3; className?: string }) {
  const country = findCountry(talent.countryCode);
  const tier = tierForPercentile(talent.percentile);
  const c = placeColors[place];
  const big = place === 1;

  return (
    <Link
      href={`/talent/${talent.slug}`}
      className={cn(
        "group relative flex flex-col items-center overflow-hidden rounded-3xl text-center",
        "bg-ink-900 px-6 pt-14 pb-6 transition-all hover:-translate-y-1.5",
        big ? "ring-2" : "ring-1",
        className,
      )}
      style={{
        // @ts-expect-error -- inline ring color
        "--tw-ring-color": `${c.color}80`,
        boxShadow: `0 12px 32px -16px ${c.color}66`,
      }}
    >
      {/* Place medal */}
      <span
        className="absolute -top-1 left-1/2 -translate-x-1/2 grid h-12 w-12 place-items-center rounded-full font-display font-black text-white text-[18px]"
        style={{
          background: `radial-gradient(circle at 30% 25%, ${c.highlight}, ${c.color} 65%, ${c.color}cc 100%)`,
          boxShadow: `0 6px 14px -2px ${c.color}cc, inset 0 2px 0 rgba(255,255,255,0.55), inset 0 -8px 16px -8px rgba(0,0,0,0.45)`,
        }}
      >
        {place}
      </span>

      {/* Avatar + tier emblem */}
      <div className="relative">
        <AvatarChip
          initials={talent.initials}
          gradient={`bg-gradient-to-br ${talent.avatarGradient}`}
          countryCode={country.code}
          size={big ? "xl" : "lg"}
        />
        <span className="absolute -bottom-2 -right-2">
          <TierEmblem tier={tier.id} size={big ? "sm" : "xs"} />
        </span>
      </div>

      <h3 className={cn("mt-5 font-display font-bold tracking-tight text-mist-50 truncate max-w-full", big ? "text-[20px]" : "text-[16px]")}>
        {talent.name}
      </h3>
      <p className="mt-1 inline-flex items-center gap-1.5 text-[12px] text-mist-400">
        <Flag code={country.code} size="xs" />
        {talent.city ?? country.name}
      </p>

      {/* Score orb */}
      <div
        className="mt-4 inline-flex h-12 min-w-[60px] items-center justify-center rounded-full px-4 font-display font-bold text-[18px]"
        style={{
          background: `linear-gradient(180deg, ${tier.highlight}, ${tier.color})`,
          boxShadow: `0 4px 0 0 ${tier.color}99, inset 0 1px 0 rgba(255,255,255,0.4)`,
          color: tier.id === "rising" || tier.id === "emerging" || tier.id === "new" ? "#1B1208" : "#FFFFFF",
        }}
      >
        {talent.score}
      </div>

      <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: tier.color }}>
        {tier.label} · {tier.range}
      </p>
    </Link>
  );
}
