"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import { PROFESSION_CATEGORIES, categoryLabel } from "@/lib/professions";
import { allCategoryStats } from "@/lib/profession-stats";
import { iconForCategory } from "@/lib/profession-icons";
import { cn } from "@/lib/utils";

export function MetiersIndexClient() {
  const [query, setQuery] = useState("");
  const stats = useMemo(() => allCategoryStats(), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stats;
    return stats.filter((s) => {
      const cat = PROFESSION_CATEGORIES.find((c) => c.id === s.categoryId);
      if (!cat) return false;
      return (
        cat.label.toLowerCase().includes(q) || cat.frLabel.toLowerCase().includes(q)
      );
    });
  }, [stats, query]);

  const totalProfessions = stats.reduce((sum, s) => sum + s.professionCount, 0);
  const totalTalents = stats.reduce((sum, s) => sum + s.talentCount, 0);

  return (
    <div className="container-page pt-28 pb-24">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-mist-400">
          Catalogue
        </p>
        <h1 className="mt-3 font-display text-display-md font-bold tracking-tight text-mist-50">
          Tous les métiers,{" "}
          <span className="text-gradient-cyan">classés un par un.</span>
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-mist-300">
          Chaque métier a son propre classement. Pas de mélange : les boulangers ne
          concourent pas avec les développeurs frontend. Choisis une catégorie pour
          voir les métiers, puis un métier pour voir son classement.
        </p>
        <div className="mt-6 inline-flex items-center gap-4 rounded-full bg-ink-875/60 ring-1 ring-inset ring-ink-700/40 px-5 py-2 text-[12.5px] text-mist-300">
          <span>
            <strong className="text-mist-50">{totalProfessions}</strong> métiers actifs
          </span>
          <span className="text-ink-700">·</span>
          <span>
            <strong className="text-mist-50">{totalTalents}</strong> talents inscrits
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="mt-10 mx-auto max-w-md">
        <div className="flex items-center gap-2 rounded-full bg-ink-875/70 ring-2 ring-inset ring-ink-700/40 focus-within:ring-cyan-400/60 transition px-3 py-2">
          <Search className="ml-2 h-4 w-4 text-mist-400" strokeWidth={2.4} />
          <input
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            placeholder="Filtrer les catégories"
            className="h-10 flex-1 bg-transparent text-[14px] text-mist-50 placeholder:text-mist-400 outline-none"
          />
        </div>
      </div>

      {/* Categories grid */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((stat, i) => {
          const cat = PROFESSION_CATEGORIES.find((c) => c.id === stat.categoryId);
          if (!cat) return null;
          const Icon = iconForCategory(cat.id);
          const hasTalents = stat.talentCount > 0;
          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: (i % 6) * 0.04 }}
            >
              <Link
                href={`/metiers/${cat.id}`}
                className={cn(
                  "card-squash group relative block overflow-hidden rounded-3xl",
                  "border border-ink-700/40 hover:border-ink-700/70",
                  "bg-ink-875 p-6 shadow-card hover:shadow-card-hover",
                  !hasTalents && "opacity-65",
                )}
              >
                {/* Color halo */}
                <div
                  className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-25 blur-3xl transition-opacity group-hover:opacity-60"
                  style={{ background: cat.color }}
                />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <span
                      className="inline-grid h-11 w-11 place-items-center rounded-2xl ring-1 ring-inset ring-ink-700/40"
                      style={{
                        background: `linear-gradient(160deg, ${cat.color}30, ${cat.color}10)`,
                      }}
                    >
                      <Icon
                        className="h-5 w-5"
                        strokeWidth={2.5}
                        style={{ color: cat.color }}
                      />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-mist-500">
                      {categoryLabel(cat, "en")}
                    </span>
                  </div>

                  <h3 className="mt-5 font-display text-[20px] font-bold leading-tight tracking-tight text-mist-50">
                    {categoryLabel(cat, "fr")}
                  </h3>

                  <div className="mt-4 flex items-end justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-mist-400">
                        Métiers
                      </p>
                      <p className="font-display text-[22px] font-bold text-mist-50 leading-none">
                        {stat.professionCount}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-mist-400">
                        Talents
                      </p>
                      <p className="font-display text-[22px] font-bold text-mist-50 leading-none">
                        {stat.talentCount}
                      </p>
                    </div>
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.14em]"
                      style={{
                        background: `${cat.color}1f`,
                        color: cat.color,
                      }}
                    >
                      Explorer <ArrowRight className="h-3 w-3" strokeWidth={2.8} />
                    </span>
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
            Aucune catégorie ne correspond.
          </p>
          <p className="mt-1.5 text-[13px] text-mist-400">
            Essaie un autre mot ou efface ta recherche.
          </p>
        </div>
      )}

      {/* CTA: profession not in the catalogue */}
      <div className="mt-16 mx-auto max-w-2xl rounded-3xl border border-dashed border-ink-700/50 bg-ink-875/40 p-6 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-mist-400">
          Métier manquant ?
        </p>
        <h3 className="mt-2 font-display text-[18px] font-bold text-mist-50">
          Ton métier n&apos;est pas dans la liste ?
        </h3>
        <p className="mt-2 text-[13.5px] text-mist-300 max-w-md mx-auto">
          Tu pourras l&apos;ajouter pendant ton inscription. Il rejoindra une catégorie
          cohérente et sera marqué <span className="font-bold text-mist-50">« à valider »</span>{" "}
          jusqu&apos;à confirmation par notre équipe.
        </p>
        <Link
          href="/sign-up"
          className="mt-5 inline-flex h-10 items-center gap-1.5 rounded-full bg-cyan-400 hover:bg-cyan-300 px-5 text-[13px] font-bold tracking-tight text-ink-950 transition"
        >
          Proposer un métier
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.8} />
        </Link>
      </div>
    </div>
  );
}
