"use client";

import { useMemo, useState } from "react";
import { Building2, Flag, Globe2, MapPin, Sparkles } from "lucide-react";
import { Podium } from "./Podium";
import { RankingRow } from "./RankingRow";
import { PROFESSION_CATEGORIES, PROFESSIONS, type ProfessionCategoryId } from "@/lib/professions";
import { iconForCategory } from "@/lib/profession-icons";
import { findCountry } from "@/lib/countries";
import { TALENTS } from "@/lib/mock-talents";
import { cn } from "@/lib/utils";

type Scope = "profession" | "city" | "country" | "nationality" | "global";

type IconCmp = React.ComponentType<{ className?: string; strokeWidth?: number; style?: React.CSSProperties }>;

const SCOPES: {
  id: Scope;
  label: string;
  icon: IconCmp;
  color: string;
}[] = [
  { id: "profession", label: "Profession", icon: Sparkles, color: "#22D3EE" },
  { id: "city", label: "City", icon: MapPin, color: "#F472B6" },
  { id: "country", label: "Country", icon: Building2, color: "#A78BFA" },
  { id: "nationality", label: "Nationality", icon: Flag, color: "#10F0A0" },
  { id: "global", label: "Global", icon: Globe2, color: "#F59E0B" },
];

export function RankingClient() {
  const [scope, setScope] = useState<Scope>("profession");
  const [category, setCategory] = useState<ProfessionCategoryId>("creative");
  const [profession, setProfession] = useState<string | "all">("all");
  const [city, setCity] = useState<string>("Paris");
  const [country, setCountry] = useState<string>("FR");
  const [nationality, setNationality] = useState<string>("CM");

  const cities = useMemo(
    () =>
      Array.from(
        new Set(TALENTS.flatMap((t) => (t.city ? [t.city.split("/")[0].trim()] : []))),
      ).sort(),
    [],
  );

  const topCountries = useMemo(() => {
    const c = new Map<string, number>();
    TALENTS.forEach((t) => c.set(t.countryCode, (c.get(t.countryCode) ?? 0) + 1));
    return [...c.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);
  }, []);

  const filtered = useMemo(() => {
    let r = [...TALENTS];
    if (scope === "profession") {
      const profsInCat = PROFESSIONS.filter((p) => p.category === category).map((p) => p.id);
      r = r.filter((t) => {
        if (profession !== "all") {
          return t.professionId === profession || t.discipline === profession;
        }
        if (t.professionId) return profsInCat.includes(t.professionId);
        return category === "creative";
      });
    }
    if (scope === "city") r = r.filter((t) => t.city?.toLowerCase().includes(city.toLowerCase()));
    if (scope === "country") r = r.filter((t) => t.countryCode === country);
    if (scope === "nationality") r = r.filter((t) => t.countryCode === nationality);
    return r.sort((a, b) => b.score - a.score);
  }, [scope, category, profession, city, country, nationality]);

  let emblemIcon: IconCmp = Sparkles;
  let emblemColor = "#22D3EE";
  let emblemLabel = "League";
  let title: React.ReactNode = "Global ranking";
  let subtitle = `${filtered.length} talents · refreshed live`;

  if (scope === "profession") {
    const cat = PROFESSION_CATEGORIES.find((c) => c.id === category)!;
    const prof = profession !== "all" ? PROFESSIONS.find((p) => p.id === profession) : null;
    emblemIcon = iconForCategory(category);
    emblemColor = cat.color;
    emblemLabel = prof?.short ?? cat.label;
    title = prof?.label ?? cat.label;
    subtitle = `${filtered.length} ranked talents in ${cat.label.toLowerCase()}`;
  } else if (scope === "city") {
    emblemIcon = MapPin;
    emblemColor = "#F472B6";
    emblemLabel = city;
    title = `Top of ${city}`;
    subtitle = `${filtered.length} talents based here`;
  } else if (scope === "country") {
    const co = findCountry(country);
    emblemIcon = Building2;
    emblemColor = "#A78BFA";
    emblemLabel = co.name;
    title = (
      <>
        {co.flag} Top of {co.name}
      </>
    );
    subtitle = `${filtered.length} talents working in ${co.name}`;
  } else if (scope === "nationality") {
    const co = findCountry(nationality);
    emblemIcon = Flag;
    emblemColor = "#10F0A0";
    emblemLabel = co.name;
    title = (
      <>
        {co.flag} {co.name} nationals
      </>
    );
    subtitle = `Anywhere in the world · ${filtered.length} talents`;
  } else if (scope === "global") {
    emblemIcon = Globe2;
    emblemColor = "#F59E0B";
    emblemLabel = "Global";
    title = "Global ranking";
    subtitle = `${filtered.length} ranked talents · live`;
  }

  const EmblemIcon = emblemIcon;

  return (
    <div className="container-page pt-28 pb-20">
      {/* Hero — eyebrow + scope tabs */}
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-mist-500">
          Leaderboards
        </p>
        <h1 className="mt-3 font-display text-display-md font-semibold text-mist-50">
          Climb. <span className="text-gradient-cyan">Get found.</span>
        </h1>
        <p className="mt-3 max-w-xl mx-auto text-[14.5px] text-mist-300">
          Every talent, ranked across <span className="text-mist-50">5 dimensions</span>. Tap a board to see who&apos;s on top.
        </p>
      </div>

      {/* Scope tabs */}
      <div className="mt-10 flex flex-wrap justify-center gap-2">
        {SCOPES.map((s) => (
          <ScopeButton key={s.id} {...s} active={scope === s.id} onClick={() => setScope(s.id)} />
        ))}
      </div>

      {/* League emblem + title */}
      <div className="mt-10 flex flex-col items-center text-center">
        <LeagueEmblem icon={EmblemIcon} color={emblemColor} label={emblemLabel} />
        <h2 className="mt-7 font-display text-[26px] sm:text-[30px] font-semibold tracking-tight text-mist-50">
          {title}
        </h2>
        <p className="mt-2 text-[13px] text-mist-400">{subtitle}</p>
      </div>

      {/* Scope-specific filter strip */}
      <div className="mt-8">
        {scope === "profession" && (
          <ProfessionScopeFilter
            category={category}
            setCategory={(id) => {
              setCategory(id);
              setProfession("all");
            }}
            profession={profession}
            setProfession={setProfession}
          />
        )}
        {scope === "city" && (
          <ChipStrip>
            {cities.map((c) => (
              <FilterChip key={c} active={city === c} onClick={() => setCity(c)}>
                <MapPin className="h-3 w-3" /> {c}
              </FilterChip>
            ))}
          </ChipStrip>
        )}
        {scope === "country" && (
          <ChipStrip>
            {topCountries.map((cc) => {
              const co = findCountry(cc);
              return (
                <FilterChip key={cc} active={country === cc} onClick={() => setCountry(cc)}>
                  <span>{co.flag}</span> {co.name}
                </FilterChip>
              );
            })}
          </ChipStrip>
        )}
        {scope === "nationality" && (
          <ChipStrip>
            {topCountries.map((cc) => {
              const co = findCountry(cc);
              return (
                <FilterChip
                  key={cc}
                  active={nationality === cc}
                  onClick={() => setNationality(cc)}
                >
                  <span>{co.flag}</span> {co.name}
                </FilterChip>
              );
            })}
          </ChipStrip>
        )}
      </div>

      {/* Podium */}
      {filtered.length >= 3 && (
        <div className="mt-12">
          <Podium first={filtered[0]} second={filtered[1]} third={filtered[2]} />
        </div>
      )}

      {/* Leaderboard list */}
      <div className="mt-12 mx-auto max-w-2xl">
        {filtered.length === 0 && (
          <div className="rounded-3xl border border-ink-700/40 bg-ink-875/60 p-10 text-center">
            <p className="font-display text-[18px] font-semibold text-mist-50">No talents here yet.</p>
            <p className="mt-1.5 text-[13px] text-mist-400">Try another board or widen your scope.</p>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="rounded-3xl border border-ink-700/40 bg-ink-875/40 backdrop-blur p-2">
            <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-mist-500">
              Live ranking · top {Math.min(filtered.length, 50)}
            </p>
            <div className="space-y-1.5 p-1">
              {filtered.slice(0, 50).map((t, i) => (
                <RankingRow key={t.id} talent={t} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="mt-8 text-center text-[12.5px] text-mist-400">
        ✦ Hired talents auto-disappear from boards · scores refresh in real time
      </p>
    </div>
  );
}

function ScopeButton({
  label,
  icon: Icon,
  color,
  active,
  onClick,
}: {
  id: Scope;
  label: string;
  icon: IconCmp;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-full px-4 text-[13.5px] font-semibold tracking-tight transition-all ring-1 ring-inset",
        active
          ? "text-white"
          : "bg-ink-875/70 text-mist-200 ring-ink-700/40 hover:ring-ink-700/50 hover:text-mist-50",
      )}
      style={
        active
          ? {
              background: `linear-gradient(180deg, ${color}, ${color}cc)`,
              borderColor: `${color}80`,
              boxShadow: `0 8px 24px -8px ${color}90, inset 0 1px 0 rgba(255,255,255,0.5)`,
            }
          : undefined
      }
    >
      <Icon className="h-4 w-4" strokeWidth={2.5} style={!active ? { color } : undefined} />
      {label}
    </button>
  );
}

function LeagueEmblem({
  icon: Icon,
  color,
  label,
}: {
  icon: IconCmp;
  color: string;
  label: string;
}) {
  return (
    <div className="relative">
      <div
        className="grid h-28 w-28 place-items-center rounded-full"
        style={{
          background: `radial-gradient(circle at 30% 25%, ${color}, ${color}cc 60%, ${color}55 100%)`,
          boxShadow: `0 16px 40px -8px ${color}80, inset 0 2px 0 rgba(255,255,255,0.55), inset 0 -16px 32px -8px rgba(0,0,0,0.45)`,
        }}
      >
        <Icon className="h-12 w-12 text-white" strokeWidth={2.4} />
      </div>
      <div
        className="absolute -bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-ink-950 ring-2 ring-ink-900 px-3 py-1 font-display text-[11px] font-semibold tracking-tight whitespace-nowrap"
        style={{ color }}
      >
        {label}
      </div>
    </div>
  );
}

function ChipStrip({ children }: { children: React.ReactNode }) {
  return (
    <div className="mask-fade-x">
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none px-1 pb-1 justify-start sm:justify-center">
        {children}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium ring-1 ring-inset transition",
        active
          ? "bg-cyan-400/15 text-cyan-200 ring-cyan-400/40"
          : "bg-ink-850 text-mist-300 ring-ink-700/40 hover:text-mist-50",
      )}
    >
      {children}
    </button>
  );
}

function ProfessionScopeFilter({
  category,
  setCategory,
  profession,
  setProfession,
}: {
  category: ProfessionCategoryId;
  setCategory: (id: ProfessionCategoryId) => void;
  profession: string | "all";
  setProfession: (id: string | "all") => void;
}) {
  return (
    <div className="space-y-2">
      <ChipStrip>
        {PROFESSION_CATEGORIES.map((c) => {
          const Icon = iconForCategory(c.id);
          const active = category === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={cn(
                "shrink-0 inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium ring-1 ring-inset transition",
                active ? "text-white" : "bg-ink-850 text-mist-300 ring-ink-700/40 hover:text-mist-50",
              )}
              style={
                active
                  ? {
                      background: `linear-gradient(180deg, ${c.color}, ${c.color}cc)`,
                      borderColor: `${c.color}80`,
                      boxShadow: `0 6px 16px -6px ${c.color}90, inset 0 1px 0 rgba(255,255,255,0.4)`,
                    }
                  : undefined
              }
            >
              <Icon
                className="h-3.5 w-3.5"
                strokeWidth={2.5}
                style={active ? undefined : { color: c.color }}
              />
              {c.label}
            </button>
          );
        })}
      </ChipStrip>
      <ChipStrip>
        <FilterChip active={profession === "all"} onClick={() => setProfession("all")}>
          All in category
        </FilterChip>
        {PROFESSIONS.filter((p) => p.category === category).map((p) => (
          <FilterChip key={p.id} active={profession === p.id} onClick={() => setProfession(p.id)}>
            {p.short}
          </FilterChip>
        ))}
      </ChipStrip>
    </div>
  );
}
