import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TalentCard } from "@/components/talent/TalentCard";
import { getTopTalents } from "@/lib/mock-talents";

export function FeaturedTalents() {
  const talents = getTopTalents(6);
  return (
    <section className="relative py-24">
      <div className="container-page">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-mist-500">
              Featured this week
            </p>
            <h2 className="mt-3 font-display text-display-md font-semibold text-mist-50">
              Top-ranked creatives, hand-curated.
            </h2>
          </div>
          <Link
            href="/explore"
            className="hidden sm:inline-flex items-center gap-1.5 text-[13px] font-medium text-cyan-300 hover:text-cyan-200"
          >
            See all talents <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {talents.map((t) => (
            <TalentCard key={t.id} talent={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
