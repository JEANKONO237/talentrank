import { ArrowRight, CheckCircle2 } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Aurora } from "@/components/effects/Aurora";
import { GridBackground } from "@/components/effects/GridBackground";

const perks = [
  "Filter ranked talents by discipline, country, software, availability",
  "Build private shortlists, share with your team",
  "Contact verified profiles in one click",
  "See live availability — only reach out to talents who can take the brief",
];

export function StudioCTA() {
  return (
    <section className="relative py-24">
      <div className="container-page">
        <div className="relative isolate overflow-hidden rounded-3xl border border-ink-700/40 bg-ink-875/60 backdrop-blur-xl shadow-card">
          <Aurora intensity="subtle" className="opacity-90" />
          <GridBackground />
          <div className="relative grid items-center gap-12 p-10 md:grid-cols-[1.2fr_1fr] md:p-14">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300">
                For studios &amp; recruiters
              </p>
              <h2 className="mt-4 font-display text-display-md font-semibold text-mist-50">
                Hire the best ranked creative talents.{" "}
                <span className="text-gradient-amber">Source faster.</span>
              </h2>
              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-mist-300">
                Skip portfolio archeology. TalentRank surfaces the top creatives for
                your brief in seconds — ranked, verified, and available now.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <ButtonLink href="/dashboard/recruiter" size="lg" variant="amber">
                  Open recruiter dashboard
                  <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                </ButtonLink>
                <ButtonLink href="/pricing" size="lg" variant="glass">
                  See pricing
                </ButtonLink>
              </div>
            </div>

            <ul className="grid gap-3">
              {perks.map((p) => (
                <li
                  key={p}
                  className="flex items-start gap-3 rounded-xl bg-ink-850 ring-1 ring-inset ring-ink-700/30 p-4"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" strokeWidth={2.4} />
                  <span className="text-[13.5px] leading-relaxed text-mist-200">{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
