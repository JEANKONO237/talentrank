"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { EXPERIENCE_ORDER, type ExperienceClass } from "@/lib/experience-class";
import { cn } from "@/lib/utils";

interface ClassPickerProps {
  onSelect: (classId: ExperienceClass["id"]) => void;
}

// 3-card shuffle stack — drag the front card left to cycle to the next
// class. Inspired by the user-provided testimonial-cards spec.
export function ClassPicker({ onSelect }: ClassPickerProps) {
  // Carousel index: which class is at the "front".
  const [activeIdx, setActiveIdx] = React.useState(0);

  const next = () => setActiveIdx((i) => (i + 1) % EXPERIENCE_ORDER.length);
  const prev = () =>
    setActiveIdx((i) => (i - 1 + EXPERIENCE_ORDER.length) % EXPERIENCE_ORDER.length);

  // Build the visible stack: front (active), middle (next), back (next+1).
  const order = EXPERIENCE_ORDER.length;
  const visible = [
    { cls: EXPERIENCE_ORDER[activeIdx], pos: "front" as const },
    { cls: EXPERIENCE_ORDER[(activeIdx + 1) % order], pos: "middle" as const },
    { cls: EXPERIENCE_ORDER[(activeIdx + 2) % order], pos: "back" as const },
  ];

  const front = visible[0].cls;

  return (
    <div className="grid place-items-center gap-10">
      {/* Stack of cards — front, middle, back layered */}
      <div className="relative h-[500px] w-[340px]">
        {visible.map((v) => (
          <ClassCard
            key={v.cls.id}
            cls={v.cls}
            position={v.pos}
            onSwipeLeft={next}
            onPickFromMiddle={next}
          />
        ))}
      </div>

      {/* Controls + CTA */}
      <div className="flex flex-col items-center gap-4">
        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {EXPERIENCE_ORDER.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setActiveIdx(i)}
              aria-label={c.label}
              className={cn(
                "h-2 rounded-full transition-all",
                i === activeIdx ? "w-8" : "w-2",
              )}
              style={{
                background: i === activeIdx ? c.color : "rgba(125,110,75,0.3)",
              }}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={prev}
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-900 ring-1 ring-ink-700/60 border-b-[3px] border-ink-700 text-mist-200 font-bold text-[18px] transition active:translate-y-[2px] active:border-b-[1px]"
            aria-label="Classe précédente"
          >
            ←
          </button>

          <button
            type="button"
            onClick={() => onSelect(front.id)}
            className={cn(
              "inline-flex h-12 items-center gap-2 rounded-2xl px-7 font-bold uppercase tracking-[0.04em] text-[13px]",
              "border-b-[4px] transition-all duration-100 active:translate-y-[2px] active:border-b-[1px]",
              "hover:brightness-105 will-change-transform",
            )}
            style={{
              background: `linear-gradient(180deg, ${front.highlight}, ${front.color})`,
              borderBottomColor: front.color,
              color: front.id === "E" || front.id === "D" ? "#1B1208" : "#FFFFFF",
              textShadow: front.id === "E" || front.id === "D" ? "none" : "0 1px 0 rgba(0,0,0,0.25)",
              boxShadow: `0 6px 18px -6px ${front.color}aa, inset 0 1px 0 rgba(255,255,255,0.4)`,
            }}
          >
            Choisir {front.label}
            <ArrowRight className="h-4 w-4" strokeWidth={2.6} />
          </button>

          <button
            type="button"
            onClick={next}
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-900 ring-1 ring-ink-700/60 border-b-[3px] border-ink-700 text-mist-200 font-bold text-[18px] transition active:translate-y-[2px] active:border-b-[1px]"
            aria-label="Classe suivante"
          >
            →
          </button>
        </div>

        <p className="text-[12px] text-mist-400">
          ← Glisse la carte vers la gauche · ou utilise les flèches
        </p>
      </div>
    </div>
  );
}

interface ClassCardProps {
  cls: ExperienceClass;
  position: "front" | "middle" | "back";
  onSwipeLeft: () => void;
  onPickFromMiddle: () => void;
}

function ClassCard({ cls, position, onSwipeLeft, onPickFromMiddle }: ClassCardProps) {
  const dragRef = React.useRef(0);
  const isFront = position === "front";

  return (
    <motion.div
      animate={{
        rotate: position === "front" ? "-4deg" : position === "middle" ? "0deg" : "5deg",
        x: position === "front" ? "0%" : position === "middle" ? "10%" : "20%",
        y: position === "front" ? 0 : position === "middle" ? 6 : 14,
        scale: position === "front" ? 1 : position === "middle" ? 0.96 : 0.92,
      }}
      drag={isFront}
      dragElastic={0.35}
      dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
      onDragStart={(e) => {
        dragRef.current = "clientX" in e ? (e as MouseEvent).clientX : 0;
      }}
      onDragEnd={(e) => {
        const x = "clientX" in e ? (e as MouseEvent).clientX : 0;
        if (dragRef.current - x > 120) onSwipeLeft();
        dragRef.current = 0;
      }}
      onClick={() => !isFront && onPickFromMiddle()}
      transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
      className={cn(
        "absolute inset-0 grid select-none place-content-center gap-5 rounded-3xl p-8 text-center",
        "shadow-[0_20px_60px_-20px_rgba(0,0,0,0.25)] ring-2 ring-white/50",
        isFront ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
      )}
      style={{
        zIndex: position === "front" ? 3 : position === "middle" ? 2 : 1,
        background: `radial-gradient(120% 100% at 30% 0%, ${cls.highlight} 0%, ${cls.color} 60%, ${cls.color}dd 100%)`,
      }}
    >
      {/* Big letter S/A/B/C/D/E */}
      <div className="relative">
        <span
          className="block font-display font-black tracking-tighter text-white"
          style={{
            fontSize: "120px",
            lineHeight: 0.85,
            textShadow: "0 6px 24px rgba(0,0,0,0.3), 0 2px 0 rgba(0,0,0,0.25)",
          }}
        >
          {cls.id}
        </span>
        <span className="absolute -top-1 right-2 text-[44px]" aria-hidden>
          {cls.emoji}
        </span>
      </div>

      {/* Seniority label */}
      <div>
        <p
          className="font-display text-[28px] font-bold tracking-tight text-white"
          style={{ textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
        >
          {cls.seniority}
        </p>
        <p className="mt-1 text-[13px] font-bold uppercase tracking-[0.18em] text-white/85">
          {cls.description}
        </p>
      </div>

      {/* Long blurb */}
      <p className="text-[13.5px] leading-relaxed text-white/95 px-2">
        {cls.blurb}
      </p>

      {/* Hint for the front card */}
      {isFront && (
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70 mt-2">
          ← Glisse pour la suivante
        </p>
      )}
    </motion.div>
  );
}
