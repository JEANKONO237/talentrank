import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { ScorePill } from "@/components/ui/ScorePill";
import { AvailabilityDot } from "@/components/ui/AvailabilityDot";
import { TALENTS, getTalentProfession } from "@/lib/mock-talents";
import { findCountry } from "@/lib/countries";
import { professionLabel } from "@/lib/professions";

// IMPORTANT: This marquee is a DISCOVERY band, not a ranking. Each card shows
// its talent's profession label explicitly so it's never mistaken for a
// cross-discipline leaderboard. The actual rankings live at
// /ranking/[profession-id] (strictly mono-profession).

export function TalentMarquee() {
  const row1 = TALENTS.slice(0, 12);
  const row2 = TALENTS.slice(12, 24);

  return (
    <section className="relative py-16">
      <div className="container-page">
        <div className="flex flex-col items-center text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-mist-500">
            Découverte · tous métiers confondus
          </p>
          <h2 className="mt-3 font-display text-display-md font-semibold text-mist-50">
            Le vivier mondial,{" "}
            <span className="text-gradient-cyan">en mouvement.</span>
          </h2>
          <p className="mt-3 max-w-xl text-[13.5px] text-mist-400">
            Une vitrine cross-métiers. Le classement réel se fait toujours{" "}
            <Link href="/metiers" className="text-cyan-300 hover:text-cyan-200 underline-offset-2 hover:underline">
              métier par métier
            </Link>
            .
          </p>
        </div>
      </div>

      <div className="mt-10 space-y-3 mask-fade-x">
        <Row talents={row1} reverse={false} />
        <Row talents={row2} reverse />
      </div>
    </section>
  );
}

function Row({ talents, reverse }: { talents: typeof TALENTS; reverse: boolean }) {
  const doubled = [...talents, ...talents];
  return (
    <div className="overflow-hidden">
      <div
        className={
          "flex w-max gap-3 " + (reverse ? "animate-marquee-reverse" : "animate-marquee")
        }
      >
        {doubled.map((t, i) => {
          const country = findCountry(t.countryCode);
          const profession = getTalentProfession(t);
          return (
            <Link
              key={`${t.id}-${i}`}
              href={`/ranking/${profession.id}`}
              className="group flex items-center gap-3 rounded-full bg-ink-875/70 hover:bg-ink-875 ring-1 ring-inset ring-ink-700/30 hover:ring-cyan-400/30 backdrop-blur px-3 py-2 min-w-[320px] transition"
            >
              <Avatar
                initials={t.initials}
                gradient={`bg-gradient-to-br ${t.avatarGradient}`}
                countryCode={country.code}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-mist-50">{t.name}</p>
                <p className="truncate text-[11px] text-mist-400 group-hover:text-cyan-300 transition">
                  {professionLabel(profession, "fr")}
                </p>
              </div>
              <AvailabilityDot status={t.availability} showLabel={false} />
              <ScorePill score={t.score} percentile={t.percentile} size="sm" showLabel={false} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
