"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PortfolioItem } from "@/lib/mock-talents";

export function PortfolioGallery({ items }: { items: PortfolioItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.4, delay: i * 0.04 }}
          className={cn(
            "group relative isolate overflow-hidden rounded-2xl ring-1 ring-ink-700/30 cursor-pointer",
            i === 0 && "col-span-2 row-span-2 md:row-span-2",
          )}
          style={{ aspectRatio: i === 0 ? "16/10" : item.ratio === "4/5" ? "4/5" : item.ratio === "1/1" ? "1/1" : "16/11" }}
        >
          <div className={cn("absolute inset-0 bg-gradient-to-br transition-transform duration-700 group-hover:scale-[1.07]", item.gradient)} />
          <div className="absolute inset-0 bg-noise opacity-[0.08] mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/30 to-transparent opacity-90" />
          {item.kind === "video" && (
            <div className="absolute inset-0 grid place-items-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-ink-800 backdrop-blur-xl ring-1 ring-ink-700/60 transition-transform duration-300 group-hover:scale-110">
                <Play className="h-6 w-6 text-mist-50" fill="currentColor" strokeWidth={0} />
              </span>
            </div>
          )}
          <div className="absolute inset-x-4 bottom-4">
            <p className="font-display text-[14px] font-semibold tracking-tight text-mist-50 drop-shadow">
              {item.title}
            </p>
            {item.subtitle && (
              <p className="mt-0.5 text-[11px] text-mist-50/70">{item.subtitle}</p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
