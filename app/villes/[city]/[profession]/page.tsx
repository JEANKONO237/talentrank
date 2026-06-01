import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Crown, MapPin, Sparkles, Trophy } from "lucide-react";
import {
  citySlug,
  findCityBySlug,
  getTalentsInCityForProfession,
  listCityProfessionPairs,
} from "@/lib/cities";
import { getProfession, getCategory } from "@/lib/professions";
import { findCountry } from "@/lib/countries";
import { tierForPercentile } from "@/lib/tiers";

// ─────────────────────────────────────────────────────────────────────────────
// /villes/[city]/[profession] — page SEO landing.
//
// Stratégie M-2 (Léna #1) : générer des centaines de landing pages long-tail
// indexables par Google du type "Top Motion Designers à Lyon · TalentRank".
//
// Chaque page est :
//   - Server-rendered (rapide, indexable)
//   - Statiquement pré-générée pour les combos qui ont ≥ 3 talents
//   - OG image dynamique (réutilise notre /api/og/score avec variant city)
//
// Plus un combo a de talents, plus la page est intéressante pour le SEO. On
// ne génère pas les combos avec 0 talent (Google déteste les pages vides).
// ─────────────────────────────────────────────────────────────────────────────

// Pré-génération statique des combos significatifs (≥ 3 talents)
export async function generateStaticParams() {
  const pairs = listCityProfessionPairs(3);
  return pairs.map((p) => ({
    city: p.citySlug,
    profession: p.professionId,
  }));
}

export const dynamicParams = true; // permet aussi les combos avec < 3 talents en SSR

// SEO meta dynamique — c'est ICI que Google va piocher pour décider d'indexer
export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string; profession: string }>;
}): Promise<Metadata> {
  const { city, profession } = await params;
  const cityInfo = findCityBySlug(city);
  const prof = getProfession(profession);
  if (!cityInfo || !prof) return { title: "Introuvable · TalentRank" };

  const talents = getTalentsInCityForProfession(city, profession);
  const topScore = talents[0]?.score ?? 0;

  const title = `Top ${prof.frLabel} à ${cityInfo.name} · TalentRank`;
  const description = `Les ${talents.length} meilleurs ${prof.frLabel.toLowerCase()} classés à ${cityInfo.name}. Score officiel TalentRank, anti-cheat verrouillé 1 mois.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/villes/${city}/${profession}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `/villes/${city}/${profession}`,
    },
    // Indication explicite à Google : si pas assez de talents, on noindex
    robots: talents.length >= 3 ? "index, follow" : "noindex, follow",
  };
}

export default async function CityProfessionPage({
  params,
}: {
  params: Promise<{ city: string; profession: string }>;
}) {
  const { city, profession } = await params;
  const cityInfo = findCityBySlug(city);
  const prof = getProfession(profession);
  if (!cityInfo || !prof) notFound();

  const category = getCategory(prof.category);
  const country = findCountry(cityInfo.countryCode);
  const talents = getTalentsInCityForProfession(city, profession);

  const top3 = talents.slice(0, 3);
  const rest = talents.slice(3);

  return (
    <div className="container-page pt-12 pb-20">
      {/* Breadcrumb */}
      <nav
        aria-label="Fil d'Ariane"
        className="flex flex-wrap items-center gap-1.5 text-[12px] font-semibold text-mist-400"
      >
        <Link href="/villes" className="hover:text-mist-50 transition">
          Villes
        </Link>
        <span className="text-ink-700/40">/</span>
        <Link
          href={`/villes#${city}`}
          className="hover:text-mist-50 transition"
        >
          {cityInfo.name}
        </Link>
        <span className="text-ink-700/40">/</span>
        <span className="text-mist-50">{prof.frLabel}</span>
      </nav>

      {/* Hero */}
      <header className="mt-10 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white ring-1 ring-ink-700/15 shadow-card px-3 py-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://flagcdn.com/w40/${cityInfo.countryCode.toLowerCase()}.png`}
            srcSet={`https://flagcdn.com/w80/${cityInfo.countryCode.toLowerCase()}.png 2x`}
            width={18}
            height={13}
            alt={`Drapeau ${cityInfo.countryCode}`}
            className="rounded-[2px] object-cover"
            loading="lazy"
          />
          <span className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400">
            {cityInfo.name} · {country.name}
          </span>
        </div>

        <h1
          className="mt-6 font-display font-black tracking-tight text-mist-50"
          style={{
            fontSize: "clamp(2.2rem, 5vw, 4.2rem)",
            lineHeight: 0.98,
          }}
        >
          Top {prof.frLabel}
          <br />
          <span
            style={{
              background: "linear-gradient(180deg, #FFC800 0%, #C99A00 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            · à {cityInfo.name}
          </span>
        </h1>

        <p className="mt-5 text-[13.5px] text-mist-400 max-w-md mx-auto">
          <strong className="text-mist-50">{talents.length}</strong> talent
          {talents.length > 1 ? "s" : ""} classé
          {talents.length > 1 ? "s" : ""} · scores officiels TalentRank
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <Link
            href={`/ranking/${prof.id}`}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-night-700 hover:bg-night-600 text-white px-4 text-[11.5px] font-bold uppercase tracking-[0.04em] transition shadow-card"
          >
            Voir tous les {prof.frLabel}
          </Link>
          <Link
            href="/villes"
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white hover:bg-ink-50 ring-1 ring-inset ring-ink-700/10 text-mist-100 px-4 text-[11.5px] font-bold uppercase tracking-[0.04em] transition"
          >
            <MapPin className="h-3.5 w-3.5 text-amber-700" strokeWidth={2.6} />
            Autres villes
          </Link>
        </div>
      </header>

      {/* Empty state */}
      {talents.length === 0 && (
        <div className="mt-14 max-w-md mx-auto card-white p-10 text-center">
          <p className="font-display text-[16px] font-bold text-mist-50">
            Aucun {prof.frLabel} classé à {cityInfo.name} pour l&apos;instant.
          </p>
          <p className="mt-2 text-[13px] text-mist-400">
            Cette ville n&apos;a pas encore de talent dans ce métier. Sois le
            premier — passe le QCM.
          </p>
          <Link
            href={`/qcm/${prof.id}`}
            className="mt-5 inline-flex h-11 items-center gap-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white px-5 text-[12.5px] font-bold uppercase tracking-[0.04em] transition shadow-card"
          >
            Passer le QCM {prof.frLabel}
          </Link>
        </div>
      )}

      {/* Podium */}
      {top3.length > 0 && (
        <section className="mt-14 max-w-3xl mx-auto">
          <p className="text-center text-[10.5px] font-bold uppercase tracking-[0.22em] text-mist-400">
            <Crown className="inline-block h-3 w-3 mr-1 -mt-0.5" strokeWidth={2.8} />
            Podium · {cityInfo.name}
          </p>
          <ol className="mt-6 space-y-3">
            {top3.map((t, i) => {
              const tier = tierForPercentile(t.percentile);
              const place = i + 1;
              const medal =
                place === 1 ? "#FFC800" : place === 2 ? "#94A3B8" : "#C97A3B";
              return (
                <li key={t.id}>
                  <Link
                    href={`/talent/${t.slug}`}
                    className="card-white block p-4 transition hover:-translate-y-0.5 relative overflow-hidden"
                    style={{
                      boxShadow: `0 8px 20px -10px ${medal}55, inset 0 1px 0 rgba(255,255,255,0.5), 0 0 0 1.5px ${medal}40`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="grid h-10 w-10 place-items-center rounded-full font-display text-[16px] font-black tabular-nums shrink-0"
                        style={{
                          background: `radial-gradient(circle at 30% 25%, ${medal}, ${medal}cc 60%, ${medal}88 100%)`,
                          color: "#1B1208",
                          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 4px ${medal}55`,
                        }}
                      >
                        {place}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-[16px] font-black tracking-tight text-mist-50 truncate">
                          {t.name}
                        </p>
                        <p className="text-[11.5px] text-mist-400 truncate">
                          {tier.label} · {t.yearsExperience} an
                          {t.yearsExperience > 1 ? "s" : ""}
                        </p>
                      </div>
                      <span
                        className="inline-flex h-8 items-center gap-0.5 rounded-full px-3 text-[13px] font-black tabular-nums shrink-0"
                        style={{
                          background: "linear-gradient(180deg, #FFEAA0, #FFC800)",
                          color: "#1B1208",
                          boxShadow: "0 2px 0 0 rgba(201,154,0,0.6)",
                        }}
                      >
                        {t.score}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {/* Reste du classement */}
      {rest.length > 0 && (
        <section className="mt-12 max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-3.5 w-3.5 text-mist-400" strokeWidth={2.6} />
            <h2 className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400">
              Classement général · {rest.length} talent{rest.length > 1 ? "s" : ""}
            </h2>
            <span className="h-px flex-1 bg-ink-700/10" />
          </div>
          <ul className="card-white divide-y divide-ink-700/10 overflow-hidden">
            {rest.map((t, i) => (
              <li key={t.id}>
                <Link
                  href={`/talent/${t.slug}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-ink-50 transition"
                >
                  <span className="font-mono text-[11px] font-bold text-mist-400 tabular-nums shrink-0 w-6 text-right">
                    {i + 4}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-[13.5px] font-bold text-mist-50">
                      {t.name}
                    </p>
                    <p className="truncate text-[11px] text-mist-400">
                      {tierForPercentile(t.percentile).label} · {t.yearsExperience} an
                      {t.yearsExperience > 1 ? "s" : ""}
                    </p>
                  </div>
                  <span
                    className="inline-flex h-7 items-center rounded-full px-2.5 text-[11px] font-black tabular-nums shrink-0"
                    style={{
                      background: "linear-gradient(180deg, #FFEAA0, #FFC800)",
                      color: "#1B1208",
                      boxShadow: "0 1px 0 0 rgba(201,154,0,0.5)",
                    }}
                  >
                    {t.score}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* JSON-LD ItemList — Schema.org pour Google Rich Results */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: `Top ${prof.frLabel} à ${cityInfo.name}`,
            description: `Classement officiel TalentRank des ${prof.frLabel.toLowerCase()} à ${cityInfo.name}.`,
            numberOfItems: talents.length,
            itemListElement: talents.slice(0, 10).map((t, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "Person",
                name: t.name,
                jobTitle: prof.frLabel,
                address: {
                  "@type": "PostalAddress",
                  addressLocality: cityInfo.name,
                  addressCountry: cityInfo.countryCode,
                },
                url: `/talent/${t.slug}`,
              },
            })),
          }),
        }}
      />

      {/* Back link */}
      <div className="mt-12 text-center">
        <Link
          href="/villes"
          className="inline-flex items-center gap-1.5 text-[12px] font-bold text-mist-400 hover:text-mist-50 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.6} />
          Toutes les villes
        </Link>
      </div>

      {/* SEO footer mention */}
      <p className="mt-8 text-center text-[11px] text-mist-400 max-w-md mx-auto">
        <Sparkles className="inline-block h-3 w-3 -mt-0.5 mr-1 text-amber-600" strokeWidth={2.6} />
        Page automatiquement mise à jour à chaque nouveau talent classé en{" "}
        {category?.frLabel ?? prof.frLabel}.
      </p>
    </div>
  );
}
