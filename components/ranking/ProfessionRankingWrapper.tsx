"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Info } from "lucide-react";
import { ProfessionRankingClient } from "./ProfessionRankingClient";
import { PinButton } from "./PinButton";
import { RankingScopeTabs, type RankingScope, type ScopeValue } from "./RankingScopeTabs";

// ─────────────────────────────────────────────────────────────────────────────
// ProfessionRankingWrapper — enveloppe le ProfessionRankingClient existant
// avec :
//   - Breadcrumb retour /ranking
//   - PinButton (visible studio only)
//   - RankingScopeTabs (4 onglets horizontaux Général/Ville/Région/Pays)
//   - Bannière scope actif quand ≠ général
//
// Le ProfessionRankingClient interne n'est pas modifié — il rend son
// classement (monde entier) tel quel. Quand la cohorte par ville/région
// sera indexée en DB, on lui passera le scope en prop pour filtrer.
// Pour l'instant : la liste reste la même mais le contexte visuel change.
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  professionId: string;
  professionLabel: string;
  professionCategoryColor: string;
}

export function ProfessionRankingWrapper({
  professionId,
  professionLabel,
  professionCategoryColor,
}: Props) {
  const [scope, setScope] = useState<RankingScope>("general");
  const [scopeValue, setScopeValue] = useState<ScopeValue>({
    city: "Paris",
    region: "Île-de-France",
    country: "France",
  });

  return (
    <div className="container-page pt-12 pb-20">
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <Link
          href="/ranking"
          className="inline-flex items-center gap-1.5 text-[12px] font-bold text-mist-400 hover:text-mist-50 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.6} />
          Tous les classements
        </Link>
        <PinButton professionId={professionId} variant="full" />
      </div>

      {/* Profession title micro-header */}
      <div className="mb-5">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400">
          Classement officiel
        </p>
        <h1
          className="mt-1 font-display font-black tracking-tight text-mist-50"
          style={{
            fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}
        >
          {professionLabel}
        </h1>
      </div>

      {/* Scope tabs */}
      <div className="mb-6">
        <RankingScopeTabs
          scope={scope}
          value={scopeValue}
          onScopeChange={setScope}
          onValueChange={setScopeValue}
          accent={professionCategoryColor}
        />
      </div>

      {/* Bannière scope actif — info que les data sont actuellement le pool
          monde entier (le filtre par ville/région/pays viendra avec la
          cohorte réelle). Visible uniquement quand scope ≠ general. */}
      {scope !== "general" && (
        <div
          className="mb-5 rounded-2xl px-4 py-3 flex items-start gap-2.5 ring-1 ring-inset ring-amber-300/40"
          style={{ background: "#FFF8E1" }}
        >
          <Info className="h-4 w-4 text-amber-700 mt-0.5 shrink-0" strokeWidth={2.4} />
          <p className="text-[12.5px] text-amber-900 leading-relaxed">
            <span className="font-bold">Filtre {scope === "city" ? "ville" : scope === "region" ? "région" : "pays"} actif</span>
            {" — "}
            la cohorte régionalisée arrive avec les premiers passages
            officiels du QCM. Pour l&apos;instant tu vois le classement{" "}
            <span className="font-bold">monde entier</span> par défaut.
          </p>
        </div>
      )}

      {/* Le client existant (liste classement complète, filtres etc.) */}
      <ProfessionRankingClient professionId={professionId} />
    </div>
  );
}
