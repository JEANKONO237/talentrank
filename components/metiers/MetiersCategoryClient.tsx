"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Search, Sparkles, Users } from "lucide-react";
import {
  PROFESSION_CATEGORIES,
  categoryLabel,
  professionLabel,
  professionShort,
  normalizeName,
  type ProfessionCategoryId,
} from "@/lib/professions";
import { allProfessionStatsForCategory } from "@/lib/profession-stats";
import { iconForCategory } from "@/lib/profession-icons";
import { tierForPercentile } from "@/lib/tiers";
import { cn } from "@/lib/utils";

interface Props {
  categoryId: ProfessionCategoryId;
}

export function MetiersCategoryClient({ categoryId }: Props) {
  const cat = PROFESSION_CATEGORIES.find((c) => c.id === categoryId)!;
  const Icon = iconForCategory(categoryId);
  const allStats = useMemo(() => allProfessionStatsForCategory(categoryId), [categoryId]);

  const [query, setQuery] = useState("");
  const [showEmpty, setShowEmpty] = useState(false);

  const filtered = useMemo(() => {
    const q = normalizeName(query);
    let r = allStats;
    if (!showEmpty) r = r.filter((s) => s.talentCount > 0);
    if (!q) return r;
    return r.filter((s) => {
      const p = s.profession;
      const hay = [p.label, p.frLabel, p.short, p.frShort, ...(p.synonyms ?? [])]
        .map(normalizeName)
        .join(" ");
      return hay.includes(q);
    });
  }, [allStats, query, showEmpty]);

  const activeCount = allStats.filter((s) => s.talentCount > 0).length;
  const totalTalents = allStats.reduce((sum, s) => sum + s.talentCount, 0);

  return (
    <div className="container-page pt-28 pb-20">
      {/* Breadcrumb */}
      <Link
        href="/metiers"
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-mist-400 hover:text-mist-50 transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.6} />
        Toutes les catégories
      </Link>

      {/* Header */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
        <div>
          <div className="flex items-center gap-3">
            <span
              className="inline-grid h-12 w-12 place-items-center rounded-2xl ring-1 ring-inset ring-ink-700/40"
              style={{ background: `linear-gradient(160deg, ${cat.color}30, ${cat.color}10)` }}
            >
              <Icon className="h-6 w-6" strokeWidth={2.5} style={{ color: cat.color }} />
            </span>
            <div>
              <p
                className="text-[10.5px] font-bold uppercase tracking-[0.2em]"
                style={{ color: cat.color }}
              >
                {categoryLabel(cat, "en")}
              </p>
              <h1 className="mt-0.5 font-display text-display-md font-bold tracking-tight text-mist-50">
                {categoryLabel(cat, "fr")}
              </h1>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-[12px] text-mist-300">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-875/70 ring-1 ring-inset ring-ink-700/40 px-3 py-1">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2.4} style={{ color: cat.color }} />
            <strong className="text-mist-50">{activeCount}</strong> métiers actifs
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-875/70 ring-1 ring-inset ring-ink-700/40 px-3 py-1">
            <Users className="h-3.5 w-3.5" strokeWidth={2.4} style={{ color: cat.color }} />
            <strong className="text-mist-50">{totalTalents}</strong> talents
          </span>
        </div>
      </div>

      {/* Search + toggle */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 rounded-full bg-ink-875/70 ring-2 ring-inset ring-ink-700/40 focus-within:ring-cyan-400/60 transition px-3 py-2">
          <Search className="ml-2 h-4 w-4 text-mist-400" strokeWidth={2.4} />
          <input
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            placeholder="Filtrer les métiers de la catégorie"
            className="h-10 flex-1 bg-transparent text-[14px] text-mist-50 placeholder:text-mist-400 outline-none"
          />
        </div>
        <button
          onClick={() => setShowEmpty((v) => !v)}
          className={cn(
            "inline-flex h-12 items-center gap-2 rounded-full px-4 text-[12.5px] font-semibold transition ring-1 ring-inset",
            showEmpty
              ? "bg-cyan-400/15 text-cyan-200 ring-cyan-400/40"
              : "bg-ink-875/70 text-mist-300 ring-ink-700/40 hover:text-mist-50",
          )}
        >
          {showEmpty ? "Cacher les métiers vides" : "Inclure les métiers sans talents"}
        </button>
      </div>

      {/* Professions grid */}
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((stat, i) => {
          const p = stat.profession;
          const empty = stat.talentCount === 0;
          const topTier = stat.topScore !== null ? tierForPercentile(100 - stat.topScore) : null;
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: (i % 6) * 0.03 }}
            >
              <Link
                href={empty ? "#" : `/ranking/${p.id}`}
                onClick={(e) => empty && e.preventDefault()}
                className={cn(
                  "card-squash group relative block overflow-hidden rounded-2xl",
                  "border border-ink-700/40 hover:border-ink-700/70",
                  "bg-ink-875 p-5 shadow-card hover:shadow-card-hover",
                  empty && "cursor-not-allowed opacity-50",
                )}
              >
                {/* Gradient halo */}
                <div
                  className={cn(
                    "pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-25 blur-2xl transition-opacity",
                    !empty && "group-hover:opacity-50",
                  )}
                  style={{ background: cat.color }}
                />
                <div className="relative">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-[17px] font-bold leading-tight tracking-tight text-mist-50">
                      {professionLabel(p, "fr")}
                    </h3>
                    {p.pending && (
                      <span
                        className="shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em]"
                        style={{
                          background: "linear-gradient(180deg, #FFEAA0, #FFC800)",
                          color: "#1B1208",
                          boxShadow: "0 2px 0 0 #C99A00aa, inset 0 1px 0 rgba(255,255,255,0.5)",
                        }}
                      >
                        À valider
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[12px] text-mist-400">
                    {professionShort(p, "en")}
                  </p>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-mist-300">
                        <Users className="h-3.5 w-3.5" strokeWidth={2.4} />
                        {stat.talentCount}
                      </span>
                      {topTier && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em]"
                          style={{
                            background: `linear-gradient(180deg, ${topTier.highlight}, ${topTier.color})`,
                            color:
                              topTier.id === "rising" ||
                              topTier.id === "emerging" ||
                              topTier.id === "new"
                                ? "#1B1208"
                                : "#FFFFFF",
                            boxShadow: `0 2px 0 0 ${topTier.color}aa, inset 0 1px 0 rgba(255,255,255,0.5)`,
                          }}
                        >
                          Top {stat.topScore}
                        </span>
                      )}
                    </div>

                    {!empty && (
                      <span className="inline-flex items-center gap-1 text-[11.5px] font-bold uppercase tracking-[0.14em] text-cyan-300 group-hover:text-cyan-200">
                        Voir <ArrowRight className="h-3 w-3" strokeWidth={2.8} />
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="mt-12 mx-auto max-w-md rounded-3xl border border-ink-700/40 bg-ink-875/60 p-10 text-center">
          <Sparkles className="mx-auto h-7 w-7 text-mist-500" strokeWidth={2.2} />
          <p className="mt-3 font-display text-[16px] font-semibold text-mist-50">
            Aucun métier ne correspond.
          </p>
          <p className="mt-1.5 text-[13px] text-mist-400">
            Essaie une autre recherche ou inclus les métiers sans talents.
          </p>
        </div>
      )}
    </div>
  );
}
