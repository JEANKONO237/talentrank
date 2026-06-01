"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { DISCIPLINES } from "@/lib/disciplines";
import { TALENTS } from "@/lib/mock-talents";

export function Disciplines() {
  const counts = DISCIPLINES.map((d) => ({
    ...d,
    count: TALENTS.filter((t) => t.discipline === d.id).length,
  }));

  return (
    <section className="relative py-24">
      <div className="container-page">
        <div className="grid items-end gap-6 md:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-mist-500">
              Disciplines
            </p>
            <h2 className="mt-3 font-display text-display-md font-semibold text-mist-50">
              Every creative role, one ranked network.
            </h2>
          </div>
          <p className="max-w-md text-[15px] text-mist-300 md:justify-self-end">
            From character animation to virtual production. Each discipline is
            its own ranked ecosystem with tiered visibility and discipline-aware
            scoring.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {counts.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.03 }}
            >
              <Link
                href={`/explore?discipline=${d.id}`}
                className="group relative block overflow-hidden rounded-2xl border border-ink-700/40 bg-ink-875/60 p-5 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-ink-700/60"
              >
                <div
                  className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${d.gradient} opacity-40 blur-2xl transition-opacity group-hover:opacity-60`}
                />
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: d.accent, boxShadow: `0 0 10px ${d.accent}` }}
                    />
                    <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-mist-400">
                      {d.count} talents
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-[20px] font-semibold tracking-tight text-mist-50">
                    {d.label}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-mist-400">
                    {d.blurb}
                  </p>
                  <div className="mt-5 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-cyan-300 transition-colors group-hover:text-cyan-200">
                    Explore <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.4} />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
