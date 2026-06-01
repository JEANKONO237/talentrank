"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Flag, Globe2, MapPin, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// RankingScopeTabs — sélecteur horizontal du périmètre de classement.
//
// Spec user : "lors-qu'il clique sur un metier il y'a un classement
// generale..juste à coté par ville...et encore à coté par region...et le
// dernier par nationalité sur une meme line horizontale"
//
// 4 onglets alignés en grid horizontale :
//   1. Général       (monde entier)
//   2. Par ville     (ex: Top à Paris)
//   3. Par région    (ex: Top en Île-de-France)
//   4. Par nationalité (ex: Top France)
//
// Le composant émet `onChange(scope)` au caller. Pour chaque scope autre
// que "general", on accepte une `value` (ville/région/pays) sélectionnée
// via dropdown contextuel — défaut = la ville/région/pays du user si auth.
//
// Pour l'instant, mock : on ne fait pas le filtrage réel (pas encore de
// cohorte par ville en DB) — on affiche le bon label dans le badge "scope
// actif" et le caller décide quoi rendre.
// ─────────────────────────────────────────────────────────────────────────────

export type RankingScope = "general" | "city" | "region" | "country";

export interface ScopeValue {
  city?: string;
  region?: string;
  country?: string;
}

interface Tab {
  id: RankingScope;
  label: string;
  icon: LucideIcon;
  hint: string;
}

const TABS: Tab[] = [
  { id: "general",  label: "Général",       icon: Globe2,    hint: "Monde entier" },
  { id: "city",     label: "Par ville",     icon: MapPin,    hint: "Top dans ta ville" },
  { id: "region",   label: "Par région",    icon: Building2, hint: "Top dans ta région" },
  { id: "country",  label: "Par nationalité", icon: Flag,    hint: "Top dans ton pays" },
];

// Quick defaults — à remplacer par les vraies valeurs du user/profil
const DEFAULTS: Required<ScopeValue> = {
  city: "Paris",
  region: "Île-de-France",
  country: "France",
};

interface Props {
  /** Onglet actif (controllé). */
  scope: RankingScope;
  /** Valeurs géo sélectionnées (city/region/country). */
  value?: ScopeValue;
  /** Callback quand l'onglet change. */
  onScopeChange: (scope: RankingScope) => void;
  /** Callback quand la value géo change (dropdown). */
  onValueChange?: (value: ScopeValue) => void;
  /** Couleur d'accent (depuis le métier consulté). */
  accent?: string;
}

export function RankingScopeTabs({
  scope,
  value,
  onScopeChange,
  onValueChange,
  accent = "#1A2535",
}: Props) {
  const v: Required<ScopeValue> = { ...DEFAULTS, ...value };
  const activeTab = TABS.find((t) => t.id === scope) ?? TABS[0];

  return (
    <div className="w-full">
      {/* Tabs row — grid horizontal 4 colonnes equal */}
      <div
        className="grid grid-cols-4 gap-1.5 sm:gap-2 rounded-2xl p-1.5 bg-ink-850 ring-1 ring-inset ring-ink-700/10"
        role="tablist"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = tab.id === scope;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onScopeChange(tab.id)}
              className={cn(
                "relative inline-flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-[11.5px] sm:text-[12.5px] font-bold transition",
                active ? "text-white" : "text-mist-300 hover:text-mist-50",
              )}
              style={
                active
                  ? {
                      background: accent,
                      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 12px -4px ${accent}66`,
                    }
                  : undefined
              }
            >
              <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
              <span className="hidden sm:inline truncate">{tab.label}</span>
              <span className="sm:hidden truncate">{tab.label.replace("Par ", "")}</span>
            </button>
          );
        })}
      </div>

      {/* Active scope detail — montre la valeur sélectionnée + dropdown */}
      <AnimatePresence mode="wait">
        <motion.div
          key={scope}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
          className="mt-3 flex flex-wrap items-center justify-between gap-2"
        >
          <p className="text-[12px] text-mist-400">
            <activeTab.icon className="inline-block h-3 w-3 -mt-0.5 mr-1" strokeWidth={2.6} />
            {activeTab.hint}
            {scope !== "general" && (
              <>
                {" : "}
                <span className="font-bold text-mist-50">
                  {scope === "city" && v.city}
                  {scope === "region" && v.region}
                  {scope === "country" && v.country}
                </span>
              </>
            )}
          </p>

          {scope !== "general" && onValueChange && (
            <ScopeValueSelector
              scope={scope}
              value={v}
              onChange={onValueChange}
              accent={accent}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Dropdown contextuel : choisir la ville/région/pays ──────────────────
// Liste hardcodée pour l'instant. À remplacer par des options dynamiques
// quand la cohorte réelle aura été indexée.

const CITY_OPTIONS = ["Paris", "Lyon", "Marseille", "Toulouse", "Bordeaux", "Lille", "Nantes", "Strasbourg", "Montpellier", "Nice"];
const REGION_OPTIONS = ["Île-de-France", "Auvergne-Rhône-Alpes", "PACA", "Occitanie", "Nouvelle-Aquitaine", "Hauts-de-France", "Pays de la Loire", "Grand Est"];
const COUNTRY_OPTIONS = ["France", "Belgique", "Suisse", "Canada", "Maroc", "Tunisie", "Sénégal", "Côte d'Ivoire"];

function ScopeValueSelector({
  scope,
  value,
  onChange,
  accent,
}: {
  scope: Exclude<RankingScope, "general">;
  value: Required<ScopeValue>;
  onChange: (v: ScopeValue) => void;
  accent: string;
}) {
  const options =
    scope === "city" ? CITY_OPTIONS : scope === "region" ? REGION_OPTIONS : COUNTRY_OPTIONS;
  const current = scope === "city" ? value.city : scope === "region" ? value.region : value.country;
  const fieldKey: keyof ScopeValue = scope;

  return (
    <div className="relative inline-flex items-center">
      <select
        value={current}
        onChange={(e) => onChange({ ...value, [fieldKey]: e.currentTarget.value })}
        className="h-8 rounded-full bg-white ring-1 ring-inset ring-ink-700/10 pl-3 pr-8 text-[11.5px] font-bold text-mist-100 outline-none focus:ring-2 transition appearance-none cursor-pointer"
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' stroke='%236E5A3E' stroke-width='1.5' fill='none' stroke-linecap='round'/></svg>")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 10px center",
        }}
        aria-label={`Choisir ${scope === "city" ? "la ville" : scope === "region" ? "la région" : "le pays"}`}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute -left-1 h-1.5 w-1.5 rounded-full"
        style={{ background: accent, boxShadow: `0 0 6px ${accent}` }}
      />
    </div>
  );
}
