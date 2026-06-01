"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Search, Sparkles, Trophy } from "lucide-react";
import { findCountry } from "@/lib/countries";
import { PROFESSION_CATEGORIES } from "@/lib/professions";
import { citySlug } from "@/lib/cities";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// CitiesDirectoryClient — overview des villes où il y a des talents.
//
// Règle fondatrice rappelée en intro : pas de classement global cross-métier.
// La page expose la dimension géo comme COMPLÉMENT au ranking par métier.
//
// Chaque card ville → top 3 métiers représentés + score moyen. Click sur un
// métier → ranking pré-filtré sur la ville via `/ranking/[profession]?city=X`.
// ─────────────────────────────────────────────────────────────────────────────

interface CityProf {
  id: string;
  frLabel: string;
  category: string;
  count: number;
}

interface SlimCity {
  name: string;
  countryCode: string;
  totalTalents: number;
  averageScore: number;
  topProfessions: CityProf[];
  topTalent: {
    slug: string;
    name: string;
    score: number;
    initials: string;
    gradient: string;
  } | null;
}

interface Props {
  cities: SlimCity[];
}

export function CitiesDirectoryClient({ cities }: Props) {
  const [query, setQuery] = useState("");

  const categoryColor = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of PROFESSION_CATEGORIES) m.set(c.id, c.color);
    return m;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        findCountry(c.countryCode).name.toLowerCase().includes(q),
    );
  }, [cities, query]);

  return (
    <div className="container-page pt-12 pb-20">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-mist-400">
          <MapPin className="inline-block h-3 w-3 -mt-0.5 mr-1" strokeWidth={2.6} />
          Villes
        </p>
        <h1
          className="mt-3 font-display font-black tracking-tight text-mist-50"
          style={{
            fontSize: "clamp(2rem, 4.5vw, 3.2rem)",
            lineHeight: 1.02,
            letterSpacing: "-0.02em",
          }}
        >
          Les meilleurs,{" "}
          <span className="relative inline-block">
            ville par ville.
            <span
              aria-hidden
              className="absolute left-0 right-0 -bottom-1 sm:-bottom-1.5 h-[5px] sm:h-[6px] rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, rgba(255,200,0,0.30) 0%, rgba(255,200,0,0.60) 50%, rgba(255,200,0,0.30) 100%)",
              }}
            />
          </span>
        </h1>
        <p className="mt-5 text-[14.5px] text-mist-300 leading-relaxed">
          Pas de classement global qui mélange tout. Chaque ville révèle{" "}
          <span className="font-bold text-mist-100">ses meilleurs par métier</span> —
          parce qu&apos;un Character Animator à Tokyo, c&apos;est pas le même marché
          qu&apos;un Motion Designer à Lyon.
        </p>
      </div>

      {/* Search */}
      <div className="mt-10 mx-auto max-w-xl">
        <div
          className="relative flex items-center gap-2 rounded-full bg-white ring-2 ring-ink-700/10 focus-within:ring-amber-300/60 transition-all duration-200 pl-5 pr-2 py-2"
          style={{
            boxShadow:
              "0 1px 0 rgba(255,255,255,0.85) inset, 0 12px 32px -16px rgba(0,0,0,0.18), 0 2px 6px -2px rgba(0,0,0,0.06)",
          }}
        >
          <Search className="h-[18px] w-[18px] text-mist-400 shrink-0" strokeWidth={2.4} />
          <input
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            placeholder="Filtrer une ville ou un pays…"
            className="h-11 flex-1 bg-transparent text-[15px] text-mist-50 placeholder:text-mist-400 outline-none"
            aria-label="Filtrer les villes"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-[11px] font-bold text-mist-400 hover:text-mist-100 px-2"
            >
              Effacer
            </button>
          )}
        </div>
      </div>

      {/* Stats global */}
      <div className="mt-8 flex justify-center gap-6 text-[11.5px] text-mist-400">
        <span>
          <strong className="text-mist-50 tabular-nums">{cities.length}</strong> ville
          {cities.length > 1 ? "s" : ""}
        </span>
        <span aria-hidden>·</span>
        <span>
          <strong className="text-mist-50 tabular-nums">
            {cities.reduce((sum, c) => sum + c.totalTalents, 0)}
          </strong>{" "}
          talents recensés
        </span>
      </div>

      {/* Cities grid */}
      <section className="mt-12 mx-auto max-w-5xl">
        {filtered.length === 0 ? (
          <div className="card-white p-12 text-center">
            <p className="text-[14px] text-mist-300">
              Aucune ville ne correspond à ta recherche.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((city, i) => (
              <CityCard
                key={`${city.name}-${city.countryCode}`}
                city={city}
                index={i}
                categoryColor={categoryColor}
              />
            ))}
          </div>
        )}
      </section>

      {/* Bottom hint */}
      <p className="mt-12 text-center text-[12px] text-mist-400 max-w-md mx-auto">
        <Sparkles className="inline-block h-3 w-3 -mt-0.5 mr-1 text-amber-600" strokeWidth={2.6} />
        Ta ville n&apos;est pas listée ? Crée ton profil — elle apparaîtra dès
        qu&apos;un talent s&apos;y inscrit.
      </p>
    </div>
  );
}

// ─── City card ──────────────────────────────────────────────────────────────

function CityCard({
  city,
  index,
  categoryColor,
}: {
  city: SlimCity;
  index: number;
  categoryColor: Map<string, string>;
}) {
  const country = findCountry(city.countryCode);
  // Couleur d'accent dérivée du métier dominant (top 1).
  const accent = city.topProfessions[0]
    ? categoryColor.get(city.topProfessions[0].category) ?? "#94A3B8"
    : "#94A3B8";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1], delay: Math.min(0.04 * index, 0.4) }}
      className="card-white relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-0.5"
      style={{
        boxShadow: `0 6px 18px -8px ${accent}33, inset 0 1px 0 rgba(255,255,255,0.5)`,
      }}
    >
      {/* Halo */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-25 blur-2xl"
        style={{ background: accent }}
      />

      <div className="relative">
        {/* Header : flag + ville + pays */}
        <div className="flex items-center gap-2.5">
          <FlagPng code={city.countryCode} />
          <div className="min-w-0 flex-1">
            <p className="font-display text-[16px] font-black tracking-tight text-mist-50 truncate">
              {city.name}
            </p>
            <p className="text-[11px] text-mist-400 truncate">{country.name}</p>
          </div>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-black tabular-nums"
            style={{
              background: `${accent}1a`,
              color: accent,
              boxShadow: `inset 0 0 0 1px ${accent}33`,
            }}
            title="Nombre de talents recensés"
          >
            {city.totalTalents}
            <span className="opacity-70 font-bold">tal.</span>
          </span>
        </div>

        {/* Top talent preview — si présent */}
        {city.topTalent && (
          <Link
            href={`/talent/${city.topTalent.slug}`}
            className="mt-4 flex items-center gap-2.5 rounded-xl bg-ink-50 ring-1 ring-inset ring-ink-700/10 p-2.5 hover:bg-ink-100 transition group"
          >
            <span
              className={cn(
                "grid h-9 w-9 place-items-center rounded-xl font-display text-[12px] font-black text-white shrink-0",
                "bg-gradient-to-br",
                city.topTalent.gradient,
              )}
            >
              {city.topTalent.initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-amber-700">
                <Trophy className="inline-block h-2.5 w-2.5 -mt-0.5 mr-0.5" strokeWidth={3} />
                Top de la ville
              </p>
              <p className="font-display text-[12.5px] font-bold text-mist-50 truncate">
                {city.topTalent.name}
              </p>
            </div>
            <span
              className="inline-flex h-6 items-center rounded-full px-2 text-[10.5px] font-black tabular-nums shrink-0"
              style={{
                background: "linear-gradient(180deg, #FFEAA0, #FFC800)",
                color: "#1B1208",
                boxShadow: "0 1px 0 0 rgba(201,154,0,0.5)",
              }}
            >
              {city.topTalent.score}
            </span>
          </Link>
        )}

        {/* Top métiers — chacun cliquable vers le ranking pré-filtré */}
        <div className="mt-4">
          <p className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-mist-400 mb-1.5">
            Métiers représentés
          </p>
          <ul className="space-y-1">
            {city.topProfessions.length === 0 ? (
              <li className="text-[12px] text-mist-400">Aucun métier renseigné.</li>
            ) : (
              city.topProfessions.map((tp) => {
                const c = categoryColor.get(tp.category) ?? "#94A3B8";
                return (
                  <li key={tp.id}>
                    <Link
                      href={`/villes/${citySlug(city.name)}/${tp.id}`}
                      className="group flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-ink-50 transition"
                    >
                      <span
                        className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
                        style={{ background: c }}
                      />
                      <span className="text-[12.5px] text-mist-50 font-medium truncate flex-1">
                        {tp.frLabel}
                      </span>
                      <span className="text-[10.5px] font-bold tabular-nums text-mist-400 shrink-0">
                        {tp.count}
                      </span>
                      <ArrowRight className="h-3 w-3 text-mist-400 opacity-0 group-hover:opacity-100 transition shrink-0" strokeWidth={2.6} />
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        {/* Footer : score moyen */}
        <div className="mt-4 pt-3 border-t border-ink-700/10 flex items-center justify-between text-[11px]">
          <span className="text-mist-400">Score moyen</span>
          <span className="font-display font-black text-mist-50 tabular-nums">
            {city.averageScore}
            <span className="text-mist-400 font-bold">/100</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function FlagPng({ code }: { code: string }) {
  const lower = code.toLowerCase();
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={`https://flagcdn.com/w40/${lower}.png`}
      srcSet={`https://flagcdn.com/w80/${lower}.png 2x`}
      width={22}
      height={16}
      alt={`Drapeau ${code}`}
      className="rounded-[3px] object-cover ring-1 ring-ink-700/10 shrink-0"
      loading="lazy"
    />
  );
}
