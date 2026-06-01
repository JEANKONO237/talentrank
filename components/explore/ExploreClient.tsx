"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { TalentCard } from "@/components/talent/TalentCard";
import { PROFESSION_CATEGORIES, PROFESSIONS, type ProfessionCategoryId } from "@/lib/professions";
import { iconForCategory } from "@/lib/profession-icons";
import { TALENTS, type Availability } from "@/lib/mock-talents";
import { cn } from "@/lib/utils";

interface Props {
  initialCategory?: ProfessionCategoryId;
}

type Step = "category" | "filters" | "results";

export function ExploreClient({ initialCategory }: Props) {
  const [category, setCategory] = useState<ProfessionCategoryId | null>(initialCategory ?? null);
  const [profession, setProfession] = useState<string | "all">("all");
  const [city, setCity] = useState<string | "all">("all");
  const [availability, setAvailability] = useState<Availability | "all">("all");
  const [search, setSearch] = useState("");

  const step: Step = !category ? "category" : "results";

  const cities = useMemo(
    () =>
      Array.from(
        new Set(TALENTS.flatMap((t) => (t.city ? [t.city.split("/")[0].trim()] : []))),
      ).sort(),
    [],
  );

  const filtered = useMemo(() => {
    if (!category) return [];
    const legacyCreativeIds = [
      "animation-3d","unreal","motion-design","vfx","storyboard","character-art",
      "environment-art","generalist-3d","editing","visual-direction",
    ];
    let r = TALENTS.filter((t) => {
      const prof = t.professionId ? PROFESSIONS.find((p) => p.id === t.professionId) : undefined;
      const matchCat = prof?.category === category;
      const legacyCreative = !t.professionId && legacyCreativeIds.includes(t.discipline);
      if (!matchCat && !(category === "creative" && legacyCreative)) return false;

      if (profession !== "all") {
        if (t.professionId && t.professionId !== profession) return false;
        if (!t.professionId && t.discipline !== profession) return false;
      }
      if (city !== "all" && (t.city ? !t.city.toLowerCase().includes(city.toLowerCase()) : true)) return false;
      if (availability !== "all" && t.availability !== availability) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !t.name.toLowerCase().includes(q) &&
          !t.tagline.toLowerCase().includes(q) &&
          !t.specialties.some((s) => s.toLowerCase().includes(q))
        )
          return false;
      }
      return true;
    });
    return r.sort((a, b) => b.score - a.score);
  }, [category, profession, city, availability, search]);

  const professionsInCategory = useMemo(() => {
    if (!category) return [];
    return PROFESSIONS.filter((p) => p.category === category);
  }, [category]);

  // ─── STEP 1: Choose a category ─────────────────────────────────────
  if (step === "category") {
    return (
      <div className="container-page pt-28 pb-20">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-mist-400">
            Étape 1 sur 2
          </p>
          <h1 className="mt-4 font-display text-display-md font-bold text-mist-50">
            Choisis un métier pour commencer.
          </h1>
          <p className="mt-4 text-[15px] text-mist-300">
            Pas de catalogue infini. On t&apos;affiche uniquement les meilleurs profils
            de la catégorie que tu choisis.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 max-w-5xl mx-auto">
          {PROFESSION_CATEGORIES.filter((c) => c.id !== "other").map((c) => {
            const Icon = iconForCategory(c.id);
            const count = PROFESSIONS.filter((p) => p.category === c.id).length;
            return (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={cn(
                  "card-squash group relative flex flex-col items-center gap-3 rounded-3xl bg-ink-900 p-5",
                  "border-b-[4px] border-ink-700 hover:border-ink-600 ring-1 ring-ink-700/40",
                  "shadow-card hover:shadow-card-hover",
                  "active:border-b-[2px]",
                )}
                style={{
                  // @ts-expect-error -- custom prop for hover
                  "--cat-color": c.color,
                }}
              >
                <span
                  className="grid h-14 w-14 place-items-center rounded-2xl"
                  style={{
                    background: `linear-gradient(180deg, ${c.color}, ${c.color}cc)`,
                    boxShadow: `0 4px 0 0 ${c.color}99, inset 0 1px 0 rgba(255,255,255,0.4)`,
                  }}
                >
                  <Icon className="h-7 w-7 text-white" strokeWidth={2.5} />
                </span>
                <div className="text-center">
                  <p className="font-display text-[14.5px] font-bold leading-tight text-mist-50">
                    {c.label}
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-mist-400">
                    {count} métiers
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── STEP 2: Filter + results ──────────────────────────────────────
  const categoryDef = PROFESSION_CATEGORIES.find((c) => c.id === category)!;
  const Icon = iconForCategory(category!);

  return (
    <div className="container-page pt-28 pb-20">
      {/* Header — small, with breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setCategory(null)}
          className="text-[12.5px] font-medium text-mist-400 hover:text-mist-50 inline-flex items-center gap-1"
        >
          ← Catégories
        </button>
        <span className="h-1 w-1 rounded-full bg-mist-500" />
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white"
          style={{ background: `linear-gradient(180deg, ${categoryDef.color}, ${categoryDef.color}cc)` }}
        >
          <Icon className="h-3 w-3" strokeWidth={2.6} />
          {categoryDef.label}
        </span>
      </div>

      <div className="mt-6 flex items-end justify-between gap-4 flex-wrap">
        <h1 className="font-display text-[28px] sm:text-[34px] font-bold tracking-tight text-mist-50">
          {filtered.length} talents classés
        </h1>
        <span className="font-mono text-[12.5px] text-mist-400">
          {profession !== "all" || city !== "all" || availability !== "all" || search
            ? "Filtres actifs"
            : "Tous"}
        </span>
      </div>

      {/* Filter row — minimal */}
      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
        <div className="flex h-12 items-center gap-2 rounded-2xl bg-ink-900 ring-2 ring-ink-700/40 px-4">
          <Search className="h-4 w-4 text-mist-400" strokeWidth={2.4} />
          <input
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            placeholder="Rechercher par nom, spécialité…"
            className="h-full flex-1 bg-transparent text-[14px] text-mist-50 placeholder:text-mist-400 outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-mist-400 hover:text-mist-50">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <SelectChip
          value={profession}
          onChange={setProfession}
          options={[
            { v: "all", l: "Tout le métier" },
            ...professionsInCategory.map((p) => ({ v: p.id, l: p.short })),
          ]}
        />
        <SelectChip
          value={city}
          onChange={setCity}
          options={[{ v: "all", l: "Toutes les villes" }, ...cities.map((c) => ({ v: c, l: c }))]}
        />
        <SelectChip
          value={availability}
          onChange={(v) => setAvailability(v as Availability | "all")}
          options={[
            { v: "all", l: "Toute dispo" },
            { v: "available", l: "Disponible" },
            { v: "open", l: "Ouvert aux entretiens" },
            { v: "on-mission", l: "En mission" },
          ]}
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="mt-16 grid place-items-center rounded-3xl border border-ink-700/40 bg-ink-900 p-16 text-center">
          <p className="font-display text-[20px] font-bold text-mist-50">Aucun talent trouvé.</p>
          <p className="mt-2 text-[14px] text-mist-400">Élargis tes filtres.</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((t, i) => (
            <TalentCard key={t.id} talent={t} rankIndex={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function SelectChip<V extends string>({
  value,
  onChange,
  options,
}: {
  value: V;
  onChange: (v: V) => void;
  options: { v: V; l: string }[];
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.v === value) ?? options[0];
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-12 items-center gap-2 rounded-2xl bg-ink-900 ring-2 ring-ink-700/40 px-4 text-[13px] font-medium text-mist-200 hover:ring-ink-700/60 transition"
      >
        {current.l}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} strokeWidth={2.4} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 min-w-[200px] z-30 rounded-2xl bg-ink-900 ring-1 ring-ink-700/40 shadow-card p-1.5">
          {options.map((o) => (
            <button
              key={o.v}
              onClick={() => {
                onChange(o.v);
                setOpen(false);
              }}
              className={cn(
                "block w-full rounded-lg px-3 py-2 text-left text-[13px]",
                o.v === value
                  ? "bg-duo-blue/10 text-duo-blue font-semibold"
                  : "text-mist-200 hover:bg-ink-850",
              )}
            >
              {o.l}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
