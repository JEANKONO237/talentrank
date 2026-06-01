"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Crown, MapPin, Sparkles, X } from "lucide-react";
import { AvatarChip } from "@/components/ui/AvatarChip";
import { CrosshairOverlay } from "@/components/hunter/CrosshairOverlay";
import { getCategory, getProfession, professionLabel } from "@/lib/professions";
import { iconForCategory } from "@/lib/profession-icons";
import { findCountry } from "@/lib/countries";
import { getTalentsByProfession, type Talent } from "@/lib/mock-talents";
import { EXPERIENCE_ORDER, experienceClassForYears, type ExperienceClassId } from "@/lib/experience-class";
import { tierForPercentile, type TierId } from "@/lib/tiers";
import { cn } from "@/lib/utils";

interface Props {
  professionId: string;
}

type AvailabilityFilter = "any" | "available" | "open";

// ─────────────────────────────────────────────────────────────────────────────
// Page de classement par métier.
// Référence visuelle : World Talent Ranking — clarté absolue, hiérarchie nette,
// podium qui célèbre les 3 premiers, leaderboard avec beaucoup de respiration.
// ─────────────────────────────────────────────────────────────────────────────

export function ProfessionRankingClient({ professionId }: Props) {
  const profession = getProfession(professionId);
  const category = profession ? getCategory(profession.category) : undefined;
  const base = useMemo<Talent[]>(() => getTalentsByProfession(professionId), [professionId]);

  const [city, setCity] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [nationality, setNationality] = useState<string | null>(null);
  const [availability, setAvailability] = useState<AvailabilityFilter>("any");
  const [expClass, setExpClass] = useState<ExperienceClassId | null>(null);

  // Query params : pré-applique le filtre ville si on arrive depuis /villes
  // (ex: /ranking/motion-designer?city=Lyon). Effet one-shot au mount —
  // après, c'est l'utilisateur qui pilote via la FilterBar.
  const searchParams = useSearchParams();
  useEffect(() => {
    const qCity = searchParams.get("city");
    if (qCity) setCity(qCity);
    const qCountry = searchParams.get("country");
    if (qCountry) setCountry(qCountry);
    const qNat = searchParams.get("nationality");
    if (qNat) setNationality(qNat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allCities = useMemo(
    () =>
      Array.from(
        new Set(base.flatMap((t) => (t.city ? [t.city.split("/")[0].trim()] : []))),
      ).sort(),
    [base],
  );

  const allCountries = useMemo(() => {
    const set = new Set(base.map((t) => t.countryCode));
    return Array.from(set);
  }, [base]);

  const allNationalities = useMemo(() => {
    const set = new Set(base.map((t) => t.nationalityCode ?? t.countryCode));
    return Array.from(set);
  }, [base]);

  const filtered = useMemo(() => {
    let r = base;
    if (city) r = r.filter((t) => t.city?.toLowerCase().includes(city.toLowerCase()));
    if (country) r = r.filter((t) => t.countryCode === country);
    if (nationality) r = r.filter((t) => (t.nationalityCode ?? t.countryCode) === nationality);
    if (availability === "available") r = r.filter((t) => t.availability === "available");
    if (availability === "open")
      r = r.filter((t) => t.availability === "available" || t.availability === "open");
    if (expClass) r = r.filter((t) => experienceClassForYears(t.yearsExperience).id === expClass);
    return [...r].sort((a, b) => b.score - a.score);
  }, [base, city, country, nationality, availability, expClass]);

  const activeFilterCount = [city, country, nationality, availability !== "any", expClass].filter(
    Boolean,
  ).length;

  const clearFilters = () => {
    setCity(null);
    setCountry(null);
    setNationality(null);
    setAvailability("any");
    setExpClass(null);
  };

  // Titre dynamique — par défaut "TalentRank" (le classement global du
  // métier sur la plateforme). "Monde" était confus + pas brand.
  const titleSuffix = useMemo(() => {
    if (city) return city;
    if (country) return findCountry(country).name;
    if (nationality) return `nationalité ${findCountry(nationality).name}`;
    return "TalentRank";
  }, [city, country, nationality]);

  if (!profession || !category) return null;
  const CatIcon = iconForCategory(category.id);

  const top3 = filtered.slice(0, 3);
  const rest = filtered.slice(3, 50);

  return (
    <div className="container-page pt-24 pb-20">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-1.5 text-[12px] font-semibold text-mist-400">
        <Link href="/metiers" className="hover:text-mist-50 transition">
          Métiers
        </Link>
        <span className="text-ink-700/40">/</span>
        <Link href={`/metiers/${category.id}`} className="hover:text-mist-50 transition">
          {category.frLabel}
        </Link>
        <span className="text-ink-700/40">/</span>
        <span className="text-mist-50">{profession.frLabel}</span>
      </div>

      {/* ─── Hero — titre énorme ──────────────────────────────────────────── */}
      <header className="mt-10 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white ring-1 ring-ink-700/15 shadow-card px-3 py-1">
          <span
            className="inline-grid h-5 w-5 place-items-center rounded-md"
            style={{ background: `${category.color}25` }}
          >
            <CatIcon
              className="h-3 w-3"
              strokeWidth={2.6}
              style={{ color: category.color }}
            />
          </span>
          <span className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400">
            {category.frLabel}
          </span>
        </div>

        <h1
          className="mt-6 font-display font-black tracking-tight text-mist-50"
          style={{ fontSize: "clamp(2.4rem, 5.5vw, 4.6rem)", lineHeight: 0.96 }}
        >
          Top {professionLabel(profession, "fr")}
          <br />
          <span
            style={{
              background: "linear-gradient(180deg, #FFC800 0%, #C99A00 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            · {titleSuffix}
          </span>
        </h1>

        <p className="mt-5 text-[13.5px] text-mist-400">
          <strong className="text-mist-50">{filtered.length}</strong> talent
          {filtered.length > 1 ? "s" : ""} classé{filtered.length > 1 ? "s" : ""}
          {activeFilterCount > 0
            ? ` · ${activeFilterCount} filtre${activeFilterCount > 1 ? "s" : ""}`
            : " · classement complet"}
        </p>
      </header>

      {/* ─── Filtres simples (5 dimensions max) ───────────────────────────── */}
      <FilterBar
        availability={availability}
        setAvailability={setAvailability}
        expClass={expClass}
        setExpClass={setExpClass}
        city={city}
        setCity={setCity}
        cities={allCities}
        country={country}
        setCountry={setCountry}
        countries={allCountries}
        nationality={nationality}
        setNationality={setNationality}
        nationalities={allNationalities}
        activeCount={activeFilterCount}
        onClear={clearFilters}
      />

      {/* ─── Podium — TOP 3 spectaculaire ─────────────────────────────────── */}
      {top3.length >= 3 && (
        <div className="mt-14 max-w-4xl mx-auto">
          <p className="text-center text-[10.5px] font-bold uppercase tracking-[0.22em] text-mist-400">
            <Crown className="inline-block h-3 w-3 mr-1 -mt-0.5" strokeWidth={2.8} />
            Podium · trois meilleurs
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-5 items-end">
            <PodiumCard talent={top3[1]} place={2} />
            <PodiumCard talent={top3[0]} place={1} />
            <PodiumCard talent={top3[2]} place={3} />
          </div>
        </div>
      )}

      {/* ─── Leaderboard — propre, respirant ──────────────────────────────── */}
      {filtered.length === 0 ? (
        <EmptyState onClear={clearFilters} hasFilters={activeFilterCount > 0} professionLabel={professionLabel(profession, "fr")} />
      ) : rest.length > 0 ? (
        <section className="mt-14 max-w-3xl mx-auto">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-mist-400 mb-4 px-1">
            Classement général
          </p>
          <ol className="space-y-1.5">
            {rest.map((t, i) => (
              <LeaderboardRow key={t.id} talent={t} rank={i + 4} />
            ))}
          </ol>
        </section>
      ) : null}

      {/* Closing line */}
      <p className="mt-14 text-center text-[12px] text-mist-400 max-w-md mx-auto">
        ✦ Strictement {professionLabel(profession, "fr")}. Pas un autre métier ne peut apparaître ici.
      </p>

      <div className="mt-8 text-center">
        <Link
          href={`/metiers/${category.id}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-white hover:bg-ink-50 ring-1 ring-inset ring-ink-700/15 px-4 py-2 text-[12.5px] font-bold text-mist-100 transition shadow-card"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.6} />
          Tous les métiers de {category.frLabel}
        </Link>
      </div>
    </div>
  );
}

// ─── Podium Card ────────────────────────────────────────────────────────────
// Place 1 = plus grande, dorée. Place 2 = argent. Place 3 = bronze.
// Vraie hiérarchie visuelle, animation d'entrée discrète.

function PodiumCard({ talent, place }: { talent: Talent; place: 1 | 2 | 3 }) {
  const country = findCountry(talent.countryCode);
  const tier = tierForPercentile(talent.percentile);
  const profession = talent.professionId; // already strict-filtered upstream
  void profession;

  const styles = PODIUM_STYLES[place];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1 + (place === 1 ? 0 : place === 2 ? 0.1 : 0.2), ease: [0.2, 0.7, 0.2, 1] }}
      className={cn("relative", styles.wrap)}
    >
      {/* Place medal */}
      <div
        className="absolute -top-3 left-1/2 -translate-x-1/2 grid place-items-center rounded-full ring-4 ring-white shadow-card z-10"
        style={{
          width: styles.medalSize,
          height: styles.medalSize,
          background: `radial-gradient(circle at 30% 25%, ${styles.medalHi}, ${styles.medalColor} 60%, ${styles.medalColor}cc 100%)`,
          boxShadow: `0 6px 20px -4px ${styles.medalColor}cc, inset 0 2px 0 rgba(255,255,255,0.55)`,
        }}
      >
        <span
          className="font-display font-black tabular-nums"
          style={{ fontSize: styles.placeFont, color: place === 3 ? "#1B1208" : "#FFFFFF" }}
        >
          {place}
        </span>
      </div>

      {/* Card body */}
      <Link
        href={`/talent/${talent.slug}`}
        className={cn(
          "card-squash group block rounded-3xl bg-white ring-1 ring-ink-700/15 shadow-card hover:shadow-card-hover p-4 pt-7 text-center relative overflow-hidden",
        )}
        style={{ borderBottom: `4px solid ${styles.medalColor}55` }}
      >
        {/* Crosshair viseur — apparait au hover, studio uniquement */}
        <CrosshairOverlay accent={styles.medalColor} />

        {/* Tier dot */}
        <span
          className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.12em]"
          style={{
            background: `${tier.color}22`,
            color: tier.color,
            boxShadow: `inset 0 0 0 1px ${tier.color}55`,
          }}
        >
          {tier.label}
        </span>

        <div className="mt-2">
          <AvatarChip
            initials={talent.initials}
            gradient={`bg-gradient-to-br ${talent.avatarGradient}`}
            countryCode={country.code}
            size={place === 1 ? "lg" : "md"}
            className="mx-auto"
          />
        </div>

        <p className={cn("mt-3 font-display font-black tracking-tight text-mist-50 leading-tight", styles.nameFont)}>
          {talent.name}
        </p>
        <p className="mt-0.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-mist-400">
          {talent.city ?? country.name}
        </p>

        <div className="mt-3 inline-grid place-items-center rounded-full"
          style={{
            width: styles.scoreSize,
            height: styles.scoreSize,
            background: `radial-gradient(circle at 30% 25%, ${tier.highlight}, ${tier.color} 60%, ${tier.color}cc 100%)`,
            boxShadow: `0 8px 24px -6px ${tier.color}cc, inset 0 2px 0 rgba(255,255,255,0.55), inset 0 -10px 18px -8px rgba(0,0,0,0.4)`,
          }}
        >
          <span
            className="font-display font-black tabular-nums leading-none"
            style={{
              fontSize: styles.scoreFont,
              color: tier.id === "rising" || tier.id === "emerging" || tier.id === "new" ? "#1B1208" : "#FFFFFF",
            }}
          >
            {talent.score}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

const PODIUM_STYLES: Record<1 | 2 | 3, {
  wrap: string;
  medalSize: number; medalFont: number; placeFont: number; medalColor: string; medalHi: string;
  nameFont: string; scoreSize: number; scoreFont: number;
}> = {
  1: {
    wrap: "translate-y-0",
    medalSize: 48, medalFont: 18, placeFont: 22,
    medalColor: "#FFC800", medalHi: "#FFEAA0",
    nameFont: "text-[15px] sm:text-[17px]",
    scoreSize: 64, scoreFont: 22,
  },
  2: {
    wrap: "translate-y-6",
    medalSize: 40, medalFont: 16, placeFont: 18,
    medalColor: "#C0C8D2", medalHi: "#E8EDF4",
    nameFont: "text-[13.5px] sm:text-[15px]",
    scoreSize: 56, scoreFont: 18,
  },
  3: {
    wrap: "translate-y-10",
    medalSize: 36, medalFont: 14, placeFont: 16,
    medalColor: "#D88A4A", medalHi: "#F2C28E",
    nameFont: "text-[13.5px] sm:text-[15px]",
    scoreSize: 52, scoreFont: 17,
  },
};

// ─── Leaderboard row ───────────────────────────────────────────────────────
// Ultra propre. Hiérarchie : rank · avatar · nom + metier + lieu · score.
// Pas de bordures épaisses, pas de glow agressif. Juste de la respiration.

function LeaderboardRow({ talent, rank }: { talent: Talent; rank: number }) {
  const country = findCountry(talent.countryCode);
  const tier = tierForPercentile(talent.percentile);
  const expClass = experienceClassForYears(talent.yearsExperience);

  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min((rank - 4) * 0.02, 0.4) }}
    >
      <Link
        href={`/talent/${talent.slug}`}
        className="group relative overflow-hidden flex items-center gap-3 sm:gap-4 rounded-2xl bg-white hover:bg-ink-50/60 ring-1 ring-inset ring-ink-700/10 hover:ring-ink-700/25 px-3 sm:px-4 py-3 transition-all"
      >
        {/* Crosshair minimal (juste les 4 brackets aux coins) — studio only */}
        <CrosshairOverlay accent="#F59E0B" variant="minimal" />

        {/* Rank */}
        <span className="font-display text-[16px] sm:text-[18px] font-black text-mist-400 tabular-nums w-8 sm:w-10 text-center shrink-0">
          {rank}
        </span>

        {/* Avatar */}
        <AvatarChip
          initials={talent.initials}
          gradient={`bg-gradient-to-br ${talent.avatarGradient}`}
          countryCode={country.code}
          size="sm"
        />

        {/* Identity */}
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[14px] font-bold leading-tight text-mist-50">
            {talent.name}
          </p>
          <p className="truncate text-[11.5px] text-mist-400">
            {talent.city ?? country.name}
            <span className="text-ink-700/30 mx-1.5">·</span>
            <span style={{ color: expClass.color }} className="font-bold">
              Rang {expClass.id}
            </span>
          </p>
        </div>

        {/* Tier pill */}
        <span
          className="hidden sm:inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] shrink-0"
          style={{
            background: `${tier.color}18`,
            color: tier.color,
            boxShadow: `inset 0 0 0 1px ${tier.color}40`,
          }}
        >
          {tier.label}
        </span>

        {/* Score */}
        <ScorePill score={talent.score} tier={tier} />
      </Link>
    </motion.li>
  );
}

function ScorePill({ score, tier }: { score: number; tier: { id: TierId; color: string; highlight: string } }) {
  const lightTier = tier.id === "rising" || tier.id === "emerging" || tier.id === "new";
  return (
    <span
      className="inline-grid h-10 w-12 place-items-center rounded-xl font-display text-[14px] font-black shrink-0"
      style={{
        background: `linear-gradient(180deg, ${tier.highlight}, ${tier.color})`,
        boxShadow: `0 2px 0 0 ${tier.color}aa, inset 0 1px 0 rgba(255,255,255,0.5)`,
        color: lightTier ? "#1B1208" : "#FFFFFF",
      }}
    >
      {score}
    </span>
  );
}

// ─── Filter bar ─────────────────────────────────────────────────────────────
// Calme, peu de bruit, chips arrondies, état actif clair.

interface FilterBarProps {
  availability: AvailabilityFilter;
  setAvailability: (v: AvailabilityFilter) => void;
  expClass: ExperienceClassId | null;
  setExpClass: (v: ExperienceClassId | null) => void;
  city: string | null;
  setCity: (v: string | null) => void;
  cities: string[];
  country: string | null;
  setCountry: (v: string | null) => void;
  countries: string[];
  nationality: string | null;
  setNationality: (v: string | null) => void;
  nationalities: string[];
  activeCount: number;
  onClear: () => void;
}

function FilterBar(p: FilterBarProps) {
  return (
    <div className="mt-10 mx-auto max-w-4xl rounded-3xl bg-white ring-1 ring-ink-700/10 shadow-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-mist-400">
          Filtres
        </p>
        {p.activeCount > 0 && (
          <button
            onClick={p.onClear}
            className="inline-flex items-center gap-1 rounded-full bg-ink-50 hover:bg-ink-100 px-2.5 py-1 text-[11px] font-bold text-mist-200 transition"
          >
            <X className="h-3 w-3" strokeWidth={2.6} />
            Tout effacer
          </button>
        )}
      </div>

      <div className="space-y-3">
        {/* Disponibilité */}
        <FilterRow label="Disponibilité">
          <Chip active={p.availability === "any"} onClick={() => p.setAvailability("any")}>
            Tous
          </Chip>
          <Chip
            active={p.availability === "available"}
            onClick={() => p.setAvailability("available")}
            accent="#58CC02"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Disponibles
          </Chip>
          <Chip
            active={p.availability === "open"}
            onClick={() => p.setAvailability("open")}
            accent="#FFC800"
          >
            Ouverts aux offres
          </Chip>
        </FilterRow>

        {/* Ligue (= expérience) */}
        <FilterRow label="Ligue · expérience">
          <Chip active={p.expClass === null} onClick={() => p.setExpClass(null)}>
            Tous niveaux
          </Chip>
          {EXPERIENCE_ORDER.map((c) => (
            <Chip
              key={c.id}
              active={p.expClass === c.id}
              onClick={() => p.setExpClass(p.expClass === c.id ? null : c.id)}
              accent={c.color}
            >
              <span className="font-display font-black">{c.id}</span>
              <span className="text-[10px] opacity-80">{c.seniority}</span>
            </Chip>
          ))}
        </FilterRow>

        {/* Ville */}
        {p.cities.length > 0 && (
          <FilterRow label="Ville">
            <Chip active={p.city === null} onClick={() => p.setCity(null)}>
              Toutes
            </Chip>
            {p.cities.map((c) => (
              <Chip
                key={c}
                active={p.city === c}
                onClick={() => p.setCity(p.city === c ? null : c)}
                accent="#1CB0F6"
              >
                <MapPin className="h-3 w-3" strokeWidth={2.6} />
                {c}
              </Chip>
            ))}
          </FilterRow>
        )}

        {/* Pays */}
        {p.countries.length > 0 && (
          <FilterRow label="Pays · résidence">
            <Chip active={p.country === null} onClick={() => p.setCountry(null)}>
              Tous
            </Chip>
            {p.countries.map((cc) => {
              const co = findCountry(cc);
              return (
                <Chip
                  key={cc}
                  active={p.country === cc}
                  onClick={() => p.setCountry(p.country === cc ? null : cc)}
                  accent="#8B5CF6"
                >
                  <FlagPng code={cc} />
                  {co.name}
                </Chip>
              );
            })}
          </FilterRow>
        )}

        {/* Nationalité */}
        {p.nationalities.length > 0 && (
          <FilterRow label="Nationalité">
            <Chip active={p.nationality === null} onClick={() => p.setNationality(null)}>
              Toutes
            </Chip>
            {p.nationalities.map((cc) => {
              const co = findCountry(cc);
              return (
                <Chip
                  key={cc}
                  active={p.nationality === cc}
                  onClick={() => p.setNationality(p.nationality === cc ? null : cc)}
                  accent="#10F0A0"
                >
                  <FlagPng code={cc} />
                  {co.name}
                </Chip>
              );
            })}
          </FilterRow>
        )}
      </div>
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <p className="w-28 shrink-0 mt-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-mist-400">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5 flex-1">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-bold transition ring-1 whitespace-nowrap",
        active
          ? "text-white ring-transparent"
          : "bg-ink-50 text-mist-100 ring-ink-700/10 hover:bg-ink-100 hover:text-mist-50",
      )}
      style={
        active
          ? {
              background: `linear-gradient(180deg, ${accent ?? "#1CB0F6"}, ${accent ?? "#0E84BB"}cc)`,
              boxShadow: `0 4px 12px -4px ${accent ?? "#1CB0F6"}90, inset 0 1px 0 rgba(255,255,255,0.4)`,
            }
          : undefined
      }
    >
      {children}
    </button>
  );
}

function FlagPng({ code }: { code: string }) {
  const lower = code.toLowerCase();
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={`https://flagcdn.com/w20/${lower}.png`}
      srcSet={`https://flagcdn.com/w40/${lower}.png 2x`}
      width={14}
      height={10}
      alt={`${code} flag`}
      className="rounded-[2px] object-cover"
      loading="lazy"
    />
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────

function EmptyState({
  onClear,
  hasFilters,
  professionLabel,
}: {
  onClear: () => void;
  hasFilters: boolean;
  professionLabel: string;
}) {
  return (
    <div className="mt-14 mx-auto max-w-md rounded-3xl bg-white ring-1 ring-ink-700/10 shadow-card p-10 text-center">
      <Sparkles className="mx-auto h-7 w-7 text-mist-400" strokeWidth={2.2} />
      <p className="mt-4 font-display text-[18px] font-black text-mist-50">
        Aucun {professionLabel.toLowerCase()} ne correspond.
      </p>
      <p className="mt-2 text-[13px] text-mist-400">
        Essaie de retirer un filtre — le classement reste strictement{" "}
        <span className="font-bold text-mist-100">{professionLabel}</span>.
      </p>
      {hasFilters && (
        <button
          onClick={onClear}
          className="mt-5 inline-flex h-10 items-center gap-1.5 rounded-full bg-gradient-to-b from-duo-blue to-[#1A9DDB] text-white font-bold uppercase tracking-[0.04em] text-[12px] px-4 border-b-[3px] border-duo-blue-deep transition-all hover:brightness-105 active:translate-y-[2px] active:border-b-[1px]"
        >
          Effacer les filtres
        </button>
      )}
    </div>
  );
}
