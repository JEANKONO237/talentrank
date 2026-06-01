"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Users, X } from "lucide-react";
import {
  PROFESSION_CATEGORIES,
  PROFESSIONS,
  normalizeName,
  professionLabel,
  type ProfessionCategoryId,
} from "@/lib/professions";
import { iconForCategory } from "@/lib/profession-icons";
import { TALENTS, talentProfessionId } from "@/lib/mock-talents";
import { experienceClassForYears, type ExperienceClassId } from "@/lib/experience-class";
import { cn } from "@/lib/utils";

interface Props {
  onSelect: (professionId: string) => void;
  /** When set (typically passed by the Chasse wizard after Step 1), counts and
   *  greying-out reflect *only* talents whose experience class matches. */
  classId?: ExperienceClassId | null;
}

// Step 2 of the Chasse wizard. Recruiter MUST pick a specific profession —
// no talents are shown until they do. Search-first to keep the page calm,
// with a fold-out grid of professions grouped by category.
//
// Profile counts:
//   - shown on every profession card so the recruiter knows where there's
//     supply (and where there isn't) before clicking.
//   - shown on each category chip so they can prioritise active categories.
//   - if `classId` is provided, counts are SCOPED to that experience class
//     (so a Class-S filter on Boulanger truly shows how many S-rank bakers
//     exist — usually a tiny number, but precise).

export function ProfessionPicker({ onSelect, classId }: Props) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<ProfessionCategoryId | "all">("all");

  // ── Counts (memoised once per classId change) ─────────────────────────────
  // talentsByProfession[professionId] = number of talents matching the class
  const talentsByProfession = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of TALENTS) {
      if (classId && experienceClassForYears(t.yearsExperience).id !== classId) continue;
      const pid = talentProfessionId(t);
      map[pid] = (map[pid] ?? 0) + 1;
    }
    return map;
  }, [classId]);

  // talentsByCategory[categoryId] = total within that category, same scope
  const talentsByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of PROFESSIONS) {
      const count = talentsByProfession[p.id] ?? 0;
      map[p.category] = (map[p.category] ?? 0) + count;
    }
    return map;
  }, [talentsByProfession]);

  const filtered = useMemo(() => {
    const q = normalizeName(search);
    return PROFESSIONS
      .filter((p) => {
        if (p.id === "other") return false;
        if (activeCategory !== "all" && p.category !== activeCategory) return false;
        if (!q) return true;
        // Match against canonical labels + short labels + synonyms (FR + EN).
        const hay = [p.label, p.frLabel, p.short, p.frShort, ...(p.synonyms ?? [])]
          .map(normalizeName)
          .join(" ");
        return hay.includes(q);
      })
      // Professions with available talents first, then by count desc, then
      // alphabetically — recruiters see useful options at the top.
      .sort((a, b) => {
        const ca = talentsByProfession[a.id] ?? 0;
        const cb = talentsByProfession[b.id] ?? 0;
        if (cb !== ca) return cb - ca;
        return professionLabel(a, "fr").localeCompare(professionLabel(b, "fr"), "fr");
      });
  }, [search, activeCategory, talentsByProfession]);

  const totalAvailable = Object.values(talentsByProfession).reduce((sum, n) => sum + n, 0);

  return (
    <div className="w-full max-w-5xl">
      {/* Search bar */}
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-2 rounded-2xl bg-white ring-2 ring-ink-700/40 focus-within:ring-duo-green/50 transition-all px-4 py-2 shadow-card">
          <Search className="h-5 w-5 text-mist-400" strokeWidth={2.4} />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            placeholder="Quel métier ? — ex. Animateur 3D, Développeur frontend…"
            className="h-12 flex-1 bg-transparent text-[15px] text-mist-50 placeholder:text-mist-400 outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="grid h-9 w-9 place-items-center rounded-full text-mist-400 hover:bg-ink-850 hover:text-mist-50"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="mt-2 text-center text-[11.5px] text-mist-400">
          <Users className="inline-block h-3 w-3 mr-1 -mt-0.5" strokeWidth={2.6} />
          <span className="font-bold text-mist-200">{totalAvailable}</span> profil{totalAvailable > 1 ? "s" : ""} disponible{totalAvailable > 1 ? "s" : ""}
          {classId && <> · classe <span className="font-bold text-mist-200">{classId}</span></>}
        </p>
      </div>

      {/* Category filter chips — each shows the count for its category */}
      <div className="mt-6 flex flex-wrap justify-center gap-1.5">
        <CategoryChip
          active={activeCategory === "all"}
          onClick={() => setActiveCategory("all")}
          label="Tous"
          count={totalAvailable}
        />
        {PROFESSION_CATEGORIES.filter((c) => c.id !== "other").map((c) => (
          <CategoryChip
            key={c.id}
            active={activeCategory === c.id}
            onClick={() => setActiveCategory(c.id)}
            label={c.label.split(" & ")[0]}
            color={c.color}
            count={talentsByCategory[c.id] ?? 0}
          />
        ))}
      </div>

      {/* Professions grid */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {filtered.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-ink-700/30 bg-white/70 backdrop-blur p-10 text-center">
            <p className="font-display text-[16px] font-bold text-mist-50">Aucun métier trouvé.</p>
            <p className="mt-1 text-[13px] text-mist-400">Essaie un autre mot.</p>
          </div>
        ) : (
          filtered.map((p, i) => {
            const cat = PROFESSION_CATEGORIES.find((c) => c.id === p.category)!;
            const Icon = iconForCategory(p.category);
            const count = talentsByProfession[p.id] ?? 0;
            const empty = count === 0;
            return (
              <motion.button
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(i * 0.015, 0.3) }}
                onClick={() => !empty && onSelect(p.id)}
                disabled={empty}
                title={empty ? "Aucun profil disponible pour ce métier" : undefined}
                className={cn(
                  "row-squash group flex items-center gap-3 rounded-2xl ring-1 px-4 py-3 text-left",
                  "shadow-card",
                  empty
                    ? "bg-white/55 ring-ink-700/15 border-b-[3px] border-ink-700/15 cursor-not-allowed opacity-65"
                    : "bg-white/85 hover:bg-white ring-ink-700/30 hover:ring-ink-700/60 hover:shadow-card-hover border-b-[3px] border-ink-700/30 hover:border-ink-700/50",
                )}
              >
                <span
                  className="grid h-10 w-10 place-items-center rounded-xl shrink-0"
                  style={{
                    background: `linear-gradient(180deg, ${cat.color}, ${cat.color}cc)`,
                    boxShadow: `0 3px 0 0 ${cat.color}99, inset 0 1px 0 rgba(255,255,255,0.4)`,
                    opacity: empty ? 0.55 : 1,
                  }}
                >
                  <Icon className="h-5 w-5 text-white" strokeWidth={2.5} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-[14px] font-bold text-mist-50">
                    {professionLabel(p, "fr")}
                  </p>
                  <p className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-mist-400">
                    {cat.label.split(" & ")[0]}
                  </p>
                </div>

                {/* Count badge — the new piece. */}
                <CountBadge count={count} accent={cat.color} />
              </motion.button>
            );
          })
        )}
      </div>

      <p className="mt-6 text-center text-[12px] text-mist-400">
        On affichera <span className="font-bold text-mist-200">uniquement</span> les profils correspondant exactement à ce métier.
      </p>
    </div>
  );
}

// ─── Count badge (right side of each profession card) ─────────────────────
function CountBadge({ count, accent }: { count: number; accent: string }) {
  if (count === 0) {
    return (
      <span
        className="shrink-0 inline-flex items-center justify-center rounded-full bg-ink-850/60 ring-1 ring-inset ring-ink-700/30 px-2 py-0.5 font-display text-[11px] font-bold tabular-nums text-mist-400"
        aria-label="0 profil disponible"
      >
        0
      </span>
    );
  }
  return (
    <span
      className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-1 font-display text-[12px] font-black tabular-nums leading-none"
      style={{
        background: `${accent}22`,
        color: "#1B1208",
        boxShadow: `inset 0 0 0 1px ${accent}55`,
      }}
      aria-label={`${count} profil${count > 1 ? "s" : ""} disponible${count > 1 ? "s" : ""}`}
    >
      <Users className="h-3 w-3" strokeWidth={2.8} style={{ color: accent }} />
      {count}
    </span>
  );
}

// ─── Category filter chip (now with count) ────────────────────────────────
function CategoryChip({
  active,
  onClick,
  label,
  color,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color?: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[12px] font-bold ring-1 ring-inset transition",
        active ? "text-white" : "bg-white/70 text-mist-300 ring-ink-700/30 hover:text-mist-50",
      )}
      style={
        active && color
          ? {
              background: `linear-gradient(180deg, ${color}, ${color}cc)`,
              borderColor: `${color}80`,
              boxShadow: `0 3px 0 0 ${color}99, inset 0 1px 0 rgba(255,255,255,0.4)`,
            }
          : active
          ? { background: "#1B1208", color: "#FFFFFF" }
          : undefined
      }
    >
      {color && !active && <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />}
      {label}
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full px-1.5 font-display text-[10px] font-black tabular-nums leading-none min-w-[18px] h-[16px]",
          active
            ? "bg-white/25 text-white"
            : count === 0
            ? "bg-ink-850/40 text-mist-400"
            : "bg-ink-850 text-mist-50",
        )}
      >
        {count}
      </span>
    </button>
  );
}
