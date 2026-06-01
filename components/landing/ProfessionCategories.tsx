"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { PROFESSION_CATEGORIES, categoryLabel } from "@/lib/professions";
import { allCategoryStats } from "@/lib/profession-stats";

export function ProfessionCategories() {
  const stats = allCategoryStats();
  const byId = new Map(stats.map((s) => [s.categoryId, s]));

  return (
    <section className="relative py-24">
      <div className="container-page">
        <div className="grid items-end gap-6 md:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-mist-500">
              Toutes les professions
            </p>
            <h2 className="mt-3 font-display text-display-md font-semibold text-mist-50">
              Un classement par métier.{" "}
              <span className="text-gradient-cyan">Jamais mélangé.</span>
            </h2>
          </div>
          <p className="max-w-md text-[15px] text-mist-300 md:justify-self-end">
            Des développeurs aux boulangers, des architectes aux infirmiers : chaque
            métier a son propre podium. Le même score transparent. Le même modèle de
            chasse privée.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {PROFESSION_CATEGORIES.map((c, i) => {
            const stat = byId.get(c.id);
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: (i % 6) * 0.04 }}
              >
                <Link
                  href={`/metiers/${c.id}`}
                  className="card-squash group relative block overflow-hidden rounded-2xl border border-ink-700/40 hover:border-ink-700/60 bg-ink-875 p-4 shadow-card hover:shadow-card-hover"
                >
                  <div
                    className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-50 blur-2xl transition-opacity group-hover:opacity-80"
                    style={{ background: c.color }}
                  />
                  <div className="relative">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: c.color, boxShadow: `0 0 8px ${c.color}` }}
                      />
                      <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-mist-400">
                        {stat?.professionCount ?? 0} métiers
                      </span>
                    </div>
                    <h3 className="mt-3 font-display text-[14.5px] font-semibold leading-tight tracking-tight text-mist-50">
                      {categoryLabel(c, "fr")}
                    </h3>
                    <div className="mt-3 flex items-center justify-between text-[11.5px] font-medium text-mist-400">
                      <span>{stat?.talentCount ?? 0} talents</span>
                      <span className="inline-flex items-center gap-1 group-hover:text-cyan-300">
                        Explorer <ArrowUpRight className="h-3 w-3" strokeWidth={2.4} />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
