"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Edit3,
  FileQuestion,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useCustomQcms, qcmCompletionScore, EMPTY_QCM, type CustomQcm } from "@/lib/qcm-builder/storage";
import { getProfession } from "@/lib/professions";
import { track } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// QcmBuilderListClient — page d'accueil du QCM Builder (audience studio).
//
// 2 états :
//   - Empty state (aucun QCM créé) — hero + grosse card "Créer mon premier QCM"
//   - Liste : grille de QcmCards + bouton "Nouveau QCM"
//
// Chaque QcmCard montre titre, métier ciblé, nb questions, %complétion, status
// (draft/published). Action principale : éditer. Action secondaire : supprimer.
// ─────────────────────────────────────────────────────────────────────────────

export function QcmBuilderListClient() {
  const { qcms, saveQcm, deleteQcm } = useCustomQcms();

  const sorted = useMemo(
    () => [...qcms].sort((a, b) => b.updatedAt - a.updatedAt),
    [qcms],
  );

  const handleCreateNew = () => {
    const fresh = EMPTY_QCM();
    saveQcm(fresh);
    track("custom_qcm_created", {});
    // Navigation programmatique vers l'éditeur
    if (typeof window !== "undefined") {
      window.location.href = `/qcm-builder/${fresh.id}`;
    }
  };

  return (
    <div className="container-page pt-12 pb-20">
      {/* Header */}
      <div className="max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-mist-400 inline-flex items-center gap-1.5">
          <ClipboardList className="h-3 w-3 text-amber-700" strokeWidth={2.8} />
          QCM Builder
        </p>
        <h1
          className="mt-3 font-display font-black tracking-tight text-mist-50"
          style={{
            fontSize: "clamp(2rem, 4.5vw, 3.2rem)",
            lineHeight: 1.02,
            letterSpacing: "-0.02em",
          }}
        >
          Construis tes propres QCM.
        </h1>
        <p className="mt-4 text-[14.5px] text-mist-300 leading-relaxed">
          Crée une évaluation sur-mesure pour un poste précis. Les talents qui
          passent ton QCM apparaissent dans <span className="font-bold text-mist-100">ton classement</span>.
          Pour l&apos;instant tu construis local — quand la prod sera live, tes
          questions enrichiront aussi la banque commune (workflow review admin).
        </p>
      </div>

      {/* Action bar */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleCreateNew}
          className="inline-flex h-11 items-center gap-1.5 rounded-full bg-night-700 hover:bg-night-600 text-white px-5 text-[12.5px] font-bold uppercase tracking-[0.04em] transition shadow-card"
        >
          <Plus className="h-4 w-4" strokeWidth={2.8} />
          Nouveau QCM
        </button>
        {sorted.length > 0 && (
          <span className="text-[11.5px] text-mist-400">
            <strong className="text-mist-50 tabular-nums">{sorted.length}</strong>{" "}
            QCM{sorted.length > 1 ? "s" : ""} en cours
          </span>
        )}
      </div>

      {/* Empty state OR list */}
      {sorted.length === 0 ? (
        <EmptyState onCreate={handleCreateNew} />
      ) : (
        <section className="mt-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map((qcm, i) => (
              <QcmCard
                key={qcm.id}
                qcm={qcm}
                index={i}
                onDelete={() => {
                  if (
                    typeof window !== "undefined" &&
                    window.confirm(`Supprimer "${qcm.title || "QCM sans titre"}" ? Cette action est définitive.`)
                  ) {
                    deleteQcm(qcm.id);
                  }
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Footer note */}
      <p className="mt-12 text-center text-[11.5px] text-mist-400 max-w-md mx-auto">
        <Sparkles className="inline-block h-3 w-3 -mt-0.5 mr-1 text-amber-600" strokeWidth={2.6} />
        Stockage local pour la beta. Quand la prod sera live, tes QCM seront
        sauvegardés côté serveur + soumis au workflow review admin.
      </p>
    </div>
  );
}

// ─── Empty state ────────────────────────────────────────────────────────────

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mt-12 card-white p-10 sm:p-14 text-center max-w-2xl mx-auto relative overflow-hidden"
    >
      {/* Halo discret */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-300/30 blur-3xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-violet-300/20 blur-3xl"
      />

      <div className="relative">
        <span className="inline-grid h-16 w-16 place-items-center rounded-2xl bg-amber-100 ring-1 ring-inset ring-amber-300/40 mb-5">
          <FileQuestion className="h-8 w-8 text-amber-700" strokeWidth={2.4} />
        </span>
        <h2 className="font-display text-[22px] sm:text-[26px] font-black tracking-tight text-mist-50">
          Tu n&apos;as pas encore de QCM.
        </h2>
        <p className="mt-3 text-[14px] text-mist-300 max-w-md mx-auto leading-relaxed">
          Crée ton premier QCM en quelques minutes. Pour chaque question, tu
          rédiges l&apos;énoncé, 4 réponses possibles, et tu marques la bonne.
        </p>
        <button
          type="button"
          onClick={onCreate}
          className="mt-6 inline-flex h-11 items-center gap-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white px-6 text-[12.5px] font-bold uppercase tracking-[0.04em] transition shadow-card"
        >
          <Plus className="h-4 w-4" strokeWidth={2.8} />
          Créer mon premier QCM
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.8} />
        </button>
      </div>
    </motion.div>
  );
}

// ─── QCM Card ───────────────────────────────────────────────────────────────

function QcmCard({
  qcm,
  index,
  onDelete,
}: {
  qcm: CustomQcm;
  index: number;
  onDelete: () => void;
}) {
  const completion = qcmCompletionScore(qcm);
  const profession = qcm.professionId ? getProfession(qcm.professionId) : undefined;
  const isPublished = qcm.status === "published";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(0.04 * index, 0.4) }}
      className="card-white relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-0.5 flex flex-col"
    >
      {/* Status pill */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ring-1 ring-inset",
            isPublished
              ? "bg-emerald-100 text-emerald-800 ring-emerald-300/40"
              : "bg-ink-100 text-mist-100 ring-ink-700/10",
          )}
        >
          {isPublished ? (
            <>
              <CheckCircle2 className="h-2.5 w-2.5" strokeWidth={3} />
              Publié
            </>
          ) : (
            "Brouillon"
          )}
        </span>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Supprimer ${qcm.title || "QCM sans titre"}`}
          className="grid h-7 w-7 place-items-center rounded-full text-mist-400 hover:text-rose-600 hover:bg-rose-50 transition"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={2.4} />
        </button>
      </div>

      {/* Title */}
      <h3 className="mt-3 font-display text-[16px] font-black tracking-tight text-mist-50 line-clamp-2 min-h-[42px]">
        {qcm.title || (
          <span className="italic text-mist-400 font-medium">QCM sans titre</span>
        )}
      </h3>

      {/* Profession */}
      {profession && (
        <p className="mt-1 text-[11.5px] text-amber-800 font-bold truncate">
          {profession.frLabel}
        </p>
      )}

      {/* Description preview */}
      {qcm.description && (
        <p className="mt-2 text-[12.5px] text-mist-300 line-clamp-2">
          {qcm.description}
        </p>
      )}

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-lg bg-ink-50 ring-1 ring-inset ring-ink-700/10 px-2 py-1.5">
          <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-mist-400">
            Questions
          </p>
          <p className="font-display text-[14px] font-black tabular-nums text-mist-50">
            {qcm.questions.length}
          </p>
        </div>
        <div className="rounded-lg bg-ink-50 ring-1 ring-inset ring-ink-700/10 px-2 py-1.5">
          <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-mist-400">
            Complétion
          </p>
          <p className="font-display text-[14px] font-black tabular-nums text-mist-50">
            {completion}
            <span className="text-mist-400 text-[10px]">%</span>
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink-50">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${completion}%`,
            background:
              completion >= 100
                ? "linear-gradient(90deg, #10B981, #059669)"
                : "linear-gradient(90deg, #F59E0B, #FBBF24)",
          }}
        />
      </div>

      {/* CTA */}
      <Link
        href={`/qcm-builder/${qcm.id}`}
        className="mt-4 inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-white ring-1 ring-inset ring-ink-700/10 hover:bg-ink-50 text-mist-100 text-[11.5px] font-bold uppercase tracking-[0.04em] transition"
      >
        <Edit3 className="h-3.5 w-3.5" strokeWidth={2.6} />
        Éditer
      </Link>
    </motion.div>
  );
}
