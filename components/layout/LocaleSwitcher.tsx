"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Globe } from "lucide-react";
import { LOCALES, LOCALE_META, type Locale } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

interface Props {
  current: Locale;
  className?: string;
}

export function LocaleSwitcher({ current, className }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const setLocale = (locale: Locale) => {
    setOpen(false);
    startTransition(async () => {
      await fetch("/api/locale", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      router.refresh();
    });
  };

  const currentMeta = LOCALE_META[current];

  return (
    <div ref={ref} className={cn("relative", isPending && "opacity-60", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink-850 ring-1 ring-inset ring-ink-700/40 hover:ring-ink-700/50 hover:bg-ink-850 px-3 transition"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Globe className="h-3.5 w-3.5 text-mist-400" strokeWidth={2.4} />
        <span className="text-[12.5px] font-semibold text-mist-100">{currentMeta.flag}</span>
        <span className="text-[12.5px] font-semibold text-mist-100 hidden sm:inline">
          {current.toUpperCase()}
        </span>
        <ChevronDown
          className={cn("h-3 w-3 text-mist-400 transition-transform", open && "rotate-180")}
          strokeWidth={2.4}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 z-50 rounded-2xl border border-ink-700/40 bg-ink-900/95 backdrop-blur-xl shadow-card p-1.5">
          <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-mist-500">
            Language
          </p>
          {LOCALES.map((l) => {
            const meta = LOCALE_META[l];
            const active = l === current;
            return (
              <button
                key={l}
                onClick={() => setLocale(l)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] transition",
                  active ? "bg-cyan-400/15 text-cyan-100" : "text-mist-200 hover:bg-ink-850 hover:text-mist-50",
                )}
              >
                <span className="text-[15px] leading-none">{meta.flag}</span>
                <span className="flex-1 font-medium">{meta.native}</span>
                {active && <Check className="h-3.5 w-3.5 text-cyan-300" strokeWidth={2.6} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
