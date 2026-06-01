import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Briefcase,
  Clock,
  Globe2,
  Languages,
  MapPin,
  Sparkles,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, Pill } from "@/components/ui/Badge";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { ButtonLink } from "@/components/ui/Button";
import { AvailabilityDot } from "@/components/ui/AvailabilityDot";
import { PortfolioGallery } from "@/components/talent/PortfolioGallery";
import { ScoreBreakdown } from "@/components/talent/ScoreBreakdown";
import { TalentCard } from "@/components/talent/TalentCard";
import { TalentHeroActions } from "@/components/talent/TalentHeroActions";
import { TalentScrollHero } from "@/components/talent/TalentScrollHero";
import { TalentStudioActionsBar } from "@/components/talent/TalentStudioActionsBar";
import { PrivateContactCard } from "@/components/talent/PrivateContactCard";
import { PROFESSIONS } from "@/lib/professions";
import { TALENTS } from "@/lib/mock-talents";
import { findCountry } from "@/lib/countries";
import { getDiscipline } from "@/lib/disciplines";
import { tierForPercentile } from "@/lib/tiers";
import { getTalentByUsername, listTalentUsernames } from "@/lib/data/talents";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function generateStaticParams() {
  // When Supabase isn't configured we still want the 30 mock pages
  // to be pre-rendered for the demo build.
  if (!isSupabaseConfigured) {
    return TALENTS.map((t) => ({ slug: t.slug }));
  }
  const usernames = await listTalentUsernames();
  return usernames.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const talent = await getTalentByUsername(slug);
  if (!talent) return {};
  const discipline = getDiscipline(talent.discipline).short;
  const tier = tierForPercentile(talent.percentile);
  // OG dynamique : génère une carte branded avec name + score + tier + métier
  const ogUrl = `/api/og/score?name=${encodeURIComponent(talent.name)}&score=${talent.score}&tier=${tier.id}&profession=${encodeURIComponent(discipline)}${talent.city ? `&city=${encodeURIComponent(talent.city)}` : ""}`;
  return {
    title: `${talent.name} — ${discipline} · TalentRank`,
    description: talent.tagline,
    openGraph: {
      title: `${talent.name} · Score ${talent.score} · ${tier.label}`,
      description: `${discipline}${talent.city ? ` à ${talent.city}` : ""} — ${talent.tagline}`,
      images: [{ url: ogUrl, width: 1200, height: 630, alt: `${talent.name} · TalentRank` }],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: `${talent.name} · ${tier.label} · ${talent.score}/100`,
      description: discipline,
      images: [ogUrl],
    },
  };
}

export default async function TalentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const talent = await getTalentByUsername(slug);
  if (!talent) notFound();

  const country = findCountry(talent.countryCode);
  const discipline = getDiscipline(talent.discipline);
  const profession = talent.professionId
    ? PROFESSIONS.find((p) => p.id === talent.professionId)
    : undefined;
  const roleLabel = profession?.label ?? discipline.label;
  const roleShort = profession?.short ?? discipline.short;
  const tier = tierForPercentile(talent.percentile);
  const related = TALENTS.filter((t) => {
    if (t.id === talent.id) return false;
    if (talent.professionId && t.professionId) return t.professionId === talent.professionId;
    return t.discipline === talent.discipline;
  }).slice(0, 3);

  return (
    <div className="relative">
      {/* Scroll-expand intro: card grows as user scrolls */}
      <TalentScrollHero talent={talent} />

      {/* Hero section (action buttons + score panel) — cream refactor #38 */}
      <section className="relative pt-12 pb-12">
        <div className="container-page">
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 text-[12px] font-bold text-mist-400 hover:text-mist-50 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.6} />
            Retour à l&apos;exploration
          </Link>

          <div className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-start">
            <div>
              <div className="flex items-start gap-5">
                <Avatar
                  initials={talent.initials}
                  gradient={`bg-gradient-to-br ${talent.avatarGradient}`}
                  countryCode={country.code}
                  size="xl"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={tier.id === "elite" ? "amber" : tier.id === "senior" ? "cyan" : "violet"}>
                      <Sparkles className="h-3 w-3" />
                      <span className="font-semibold">{tier.label}</span>
                      <span className="opacity-70">·</span>
                      <span>{tier.range}</span>
                    </Pill>
                    <AvailabilityDot status={talent.availability} />
                  </div>
                  <h1 className="mt-3 font-display text-[28px] sm:text-[34px] font-black tracking-tight text-mist-50 leading-tight">
                    {talent.name}
                  </h1>
                  <p className="mt-1 text-[14px] text-amber-800 font-bold">{roleLabel}</p>
                  <p className="mt-2 text-[14.5px] text-mist-300">{talent.tagline}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-mist-400">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" strokeWidth={2.4} />
                      {talent.city ? `${talent.city} · ` : ""}{country.name}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5" strokeWidth={2.4} />
                      {talent.yearsExperience} an{talent.yearsExperience > 1 ? "s" : ""} d&apos;expérience
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" strokeWidth={2.4} />
                      Répond en ~{talent.responseHours}h
                    </span>
                  </div>
                </div>
              </div>

              {talent.availabilityNote && (
                <div className="mt-6 rounded-xl bg-amber-50 ring-1 ring-inset ring-amber-300/40 px-4 py-3 text-[13px] text-amber-900">
                  <span className="font-bold">Dispo :</span> {talent.availabilityNote}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-1.5">
                {talent.freelanceOnly && <Pill tone="violet">Freelance uniquement</Pill>}
                {talent.remoteOnly && <Pill tone="cyan">Remote uniquement</Pill>}
                {talent.availableInDays != null && talent.availableInDays > 0 && (
                  <Pill tone="amber">Dispo dans {talent.availableInDays}j</Pill>
                )}
              </div>

              <TalentHeroActions
                talent={{
                  id: talent.id,
                  slug: talent.slug,
                  name: talent.name,
                  roleLabel: roleShort,
                  initials: talent.initials,
                  gradient: talent.avatarGradient,
                  flag: country.flag,
                  countryCode: country.code,
                  // Share props — utilisés par le bouton "Partager" pour
                  // ouvrir la modal OG-preview. Si l'un manque, le bouton
                  // se cache (logique défensive).
                  score: talent.score,
                  percentile: talent.percentile,
                  professionId: profession?.id,
                  professionLabelFr: profession?.frLabel ?? discipline.label,
                  city: talent.city ?? undefined,
                }}
              />

              {/* Studio actions — visibles uniquement audience studio :
                  Ajouter à ma file (queue/shortlist) + Suivre (veille).
                  Persistence localStorage en attendant Supabase. */}
              <TalentStudioActionsBar talentSlug={talent.slug} talentName={talent.name} />

              <div className="mt-7 flex flex-wrap gap-1.5">
                {talent.badges.map((b) => (
                  <Badge key={b} id={b} size="md" />
                ))}
              </div>
            </div>

            {/* Score panel */}
            <div className="card-white p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400">
                    Score TalentRank
                  </p>
                  <p className="mt-2 font-display text-[16px] font-black tracking-tight text-mist-50">
                    {tier.label}
                  </p>
                </div>
                <ScoreRing score={talent.score} percentile={talent.percentile} size={130} thickness={9} />
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                <RankStat label="Global" value={tier.range} />
                <RankStat label={discipline.short} value={`Top ${Math.max(1, Math.round(talent.percentile))}%`} />
                <RankStat label={country.code} value={`#${talent.countryRank}`} />
              </div>

              <hr className="mt-6 border-ink-700/10" />

              <p className="mt-6 text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400">
                Détail du score
              </p>
              <div className="mt-4">
                <ScoreBreakdown talent={talent} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio */}
      <section className="relative py-12">
        <div className="container-page">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-mist-400">
                Portfolio
              </p>
              <h2 className="mt-3 font-display text-[22px] sm:text-[26px] font-black tracking-tight text-mist-50">
                Travaux récents
              </h2>
            </div>
            {talent.showreelUrl && (
              <a
                href={talent.showreelUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-amber-800 hover:text-amber-900 transition"
              >
                Voir le showreel complet
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.6} />
              </a>
            )}
          </div>

          <div className="mt-10">
            <PortfolioGallery items={talent.portfolio} />
          </div>
        </div>
      </section>

      {/* About + Stack */}
      <section className="relative py-12">
        <div className="container-page grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="card-white p-7">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-mist-400">
              À propos
            </p>
            <p className="mt-4 text-[14.5px] leading-relaxed text-mist-100">{talent.bio}</p>

            <hr className="my-7 border-ink-700/10" />

            <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-mist-400">
              Expérience
            </p>
            <div className="mt-4 space-y-3">
              {talent.experiences.map((e, i) => (
                <div key={i} className="flex items-start gap-4 rounded-xl bg-ink-50 ring-1 ring-inset ring-ink-700/10 p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-100 ring-1 ring-inset ring-amber-300/40">
                    <Briefcase className="h-4 w-4 text-amber-700" strokeWidth={2.4} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[14.5px] font-black tracking-tight text-mist-50">
                      {e.role}
                    </p>
                    <p className="text-[12px] text-mist-400">{e.studio} · {e.period}</p>
                    {e.detail && <p className="mt-1 text-[13px] text-mist-300">{e.detail}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {/* Private contact / CV — gated to verified studios */}
            <PrivateContactCard talentName={talent.name} viewerKind="anonymous" />

            <div className="card-white p-6">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-mist-400">
                Spécialités
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {talent.specialties.map((s) => (
                  <Pill key={s} tone="cyan">
                    {s}
                  </Pill>
                ))}
              </div>
            </div>

            <div className="card-white p-6">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-mist-400">
                Outils
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {talent.software.map((s) => (
                  <Pill key={s} tone="neutral">
                    {s}
                  </Pill>
                ))}
              </div>
            </div>

            <div className="card-white p-6">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-mist-400">
                Langues
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Languages className="h-4 w-4 text-mist-400" strokeWidth={2.4} />
                {talent.languages.map((l) => (
                  <Pill key={l} tone="neutral">
                    {l}
                  </Pill>
                ))}
              </div>
            </div>

            <div className="card-white p-6">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-mist-400">
                Mode de travail
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Pill tone="violet">
                  <Globe2 className="h-3 w-3" />
                  {talent.workMode === "remote"
                    ? "Remote"
                    : talent.workMode === "hybrid"
                      ? "Hybride"
                      : "Sur site"}
                </Pill>
                <Pill tone="neutral">
                  {talent.contractType === "any"
                    ? "Freelance / CDI"
                    : talent.contractType}
                </Pill>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="relative py-12 pb-24">
          <div className="container-page">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-mist-400">
              Aussi en {discipline.label}
            </p>
            <h2 className="mt-3 font-display text-[22px] sm:text-[26px] font-black tracking-tight text-mist-50">
              D&apos;autres talents à briefer.
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((t) => (
                <TalentCard key={t.id} talent={t} />
              ))}
            </div>
          </div>
        </section>
      )}

    </div>
  );
}

function RankStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-ink-50 ring-1 ring-inset ring-ink-700/10 p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-mist-400">{label}</p>
      <p className="mt-1.5 font-display text-[13.5px] font-black tracking-tight text-mist-50">{value}</p>
    </div>
  );
}
