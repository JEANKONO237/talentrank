"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ClipboardList,
  GripVertical,
  Plus,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  EMPTY_QCM,
  EMPTY_QUESTION,
  getCustomQcm,
  qcmCompletionScore,
  useCustomQcms,
  type BuilderQuestion,
  type CustomQcm,
} from "@/lib/qcm-builder/storage";
import { PROFESSIONS } from "@/lib/professions";
import { track } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// QcmEditorClient — éditeur d'un QCM custom.
//
// Layout :
//   - Sticky top bar avec retour, titre, status pill, bouton Sauvegarder
//   - Métadonnées (titre, description, métier)
//   - Questions (array de QuestionEditor)
//   - Bouton "+ Ajouter une question"
//   - Bouton "Publier" en bas (cosmétique — flag local)
//
// Auto-save debounced (800ms) à chaque édition. Indicateur visuel de l'état
// (sauvé / en cours / non sauvé).
// ─────────────────────────────────────────────────────────────────────────────

const SAVE_DEBOUNCE_MS = 800;

export function QcmEditorClient({ qcmId }: { qcmId: string }) {
  const { saveQcm } = useCustomQcms();
  const [qcm, setQcm] = useState<CustomQcm | null>(null);
  const [saveState, setSaveState] = useState<"saved" | "dirty" | "saving">("saved");

  // Load initial state
  useEffect(() => {
    const found = getCustomQcm(qcmId);
    if (found) {
      setQcm(found);
    } else {
      // Si l'id n'existe pas, on initie un nouveau QCM avec cet id
      // (cas où le user a navigué vers /qcm-builder/[id] directement)
      const fresh = { ...EMPTY_QCM(), id: qcmId };
      setQcm(fresh);
      saveQcm(fresh);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qcmId]);

  // Auto-save debounced
  useEffect(() => {
    if (!qcm) return;
    setSaveState("dirty");
    const t = setTimeout(() => {
      setSaveState("saving");
      saveQcm(qcm);
      setSaveState("saved");
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qcm]);

  const completion = useMemo(
    () => (qcm ? qcmCompletionScore(qcm) : 0),
    [qcm],
  );

  if (!qcm) {
    return (
      <div className="container-page pt-32 pb-20 text-center">
        <p className="text-[13px] text-mist-400">Chargement…</p>
      </div>
    );
  }

  const update = (patch: Partial<CustomQcm>) =>
    setQcm((prev) => (prev ? { ...prev, ...patch } : prev));

  const updateQuestion = (qid: string, patch: Partial<BuilderQuestion>) =>
    setQcm((prev) =>
      prev
        ? {
            ...prev,
            questions: prev.questions.map((q) =>
              q.id === qid ? { ...q, ...patch } : q,
            ),
          }
        : prev,
    );

  const addQuestion = () =>
    setQcm((prev) =>
      prev
        ? { ...prev, questions: [...prev.questions, EMPTY_QUESTION()] }
        : prev,
    );

  const deleteQuestion = (qid: string) =>
    setQcm((prev) =>
      prev
        ? { ...prev, questions: prev.questions.filter((q) => q.id !== qid) }
        : prev,
    );

  const togglePublish = () => {
    const goingPublic = qcm.status !== "published";
    if (goingPublic) {
      track("custom_qcm_published", {
        question_count: qcm.questions.length,
        profession_id: qcm.professionId,
      });
    }
    update({ status: goingPublic ? "published" : "draft" });
  };

  const canPublish = completion >= 100;

  return (
    <div className="container-page pt-12 pb-20 max-w-3xl">
      {/* Back */}
      <Link
        href="/qcm-builder"
        className="inline-flex items-center gap-1.5 text-[12px] font-bold text-mist-400 hover:text-mist-50 transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.6} />
        Retour à la liste
      </Link>

      {/* Header */}
      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-mist-400 inline-flex items-center gap-1.5">
            <ClipboardList className="h-3 w-3 text-amber-700" strokeWidth={2.8} />
            QCM Builder · Éditeur
          </p>
          <h1
            className="mt-2 font-display font-black tracking-tight text-mist-50"
            style={{
              fontSize: "clamp(1.6rem, 3.2vw, 2.2rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
            }}
          >
            {qcm.title || "Nouveau QCM"}
          </h1>
        </div>

        {/* Save state pill */}
        <SaveStatePill state={saveState} completion={completion} />
      </div>

      {/* ─── Métadonnées ─────────────────────────────────────────────── */}
      <section className="mt-8 card-white p-5 sm:p-6 space-y-5">
        <h2 className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400">
          Métadonnées
        </h2>

        <Field label="Titre" required>
          <input
            type="text"
            value={qcm.title}
            onChange={(e) => update({ title: e.currentTarget.value })}
            placeholder="ex : Animation 3D — niveau Senior"
            maxLength={120}
            className="w-full h-11 rounded-xl bg-white ring-1 ring-inset ring-ink-700/10 focus:ring-2 focus:ring-amber-300/60 px-3 text-[14px] text-mist-50 placeholder:text-mist-400 outline-none transition"
          />
        </Field>

        <Field label="Description courte">
          <textarea
            value={qcm.description}
            onChange={(e) => update({ description: e.currentTarget.value })}
            placeholder="Ce que ce QCM évalue. Visible aux talents avant qu'ils commencent."
            maxLength={400}
            rows={3}
            className="w-full rounded-xl bg-white ring-1 ring-inset ring-ink-700/10 focus:ring-2 focus:ring-amber-300/60 px-3 py-2 text-[14px] text-mist-50 placeholder:text-mist-400 outline-none transition resize-none"
          />
          <p className="mt-1 text-[10.5px] text-mist-400 text-right tabular-nums">
            {qcm.description.length}/400
          </p>
        </Field>

        <Field label="Métier ciblé" hint="Détermine dans quel classement les talents apparaissent">
          <select
            value={qcm.professionId ?? ""}
            onChange={(e) =>
              update({ professionId: e.currentTarget.value || undefined })
            }
            className="w-full h-11 rounded-xl bg-white ring-1 ring-inset ring-ink-700/10 focus:ring-2 focus:ring-amber-300/60 px-3 text-[14px] text-mist-50 outline-none transition"
          >
            <option value="">— Pas encore choisi —</option>
            {PROFESSIONS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.frLabel}
              </option>
            ))}
          </select>
        </Field>
      </section>

      {/* ─── Questions ────────────────────────────────────────────────── */}
      <section className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400">
            Questions · {qcm.questions.length}
          </h2>
          <span className="h-px flex-1 bg-ink-700/10" />
        </div>

        <div className="space-y-3">
          {qcm.questions.map((q, i) => (
            <QuestionEditor
              key={q.id}
              question={q}
              index={i + 1}
              onChange={(patch) => updateQuestion(q.id, patch)}
              onDelete={
                qcm.questions.length > 1
                  ? () => deleteQuestion(q.id)
                  : undefined
              }
            />
          ))}
        </div>

        <button
          type="button"
          onClick={addQuestion}
          className="mt-4 w-full inline-flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-white ring-1 ring-inset ring-dashed ring-ink-700/25 hover:bg-amber-50 hover:ring-amber-400/40 text-mist-100 hover:text-amber-800 text-[12.5px] font-bold transition"
        >
          <Plus className="h-4 w-4" strokeWidth={2.8} />
          Ajouter une question
        </button>
      </section>

      {/* ─── Publish ────────────────────────────────────────────────── */}
      <section className="mt-10 card-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400">
              Statut actuel
            </p>
            <p className="mt-1 font-display text-[16px] font-black text-mist-50">
              {qcm.status === "published" ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" strokeWidth={2.8} />
                  Publié
                </span>
              ) : (
                "Brouillon"
              )}
            </p>
            {!canPublish && qcm.status === "draft" && (
              <p className="mt-1 text-[11.5px] text-mist-400">
                Complète au moins 3 questions valides + titre + métier pour
                pouvoir publier.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={togglePublish}
            disabled={!canPublish && qcm.status === "draft"}
            className={cn(
              "inline-flex h-11 items-center gap-1.5 rounded-full px-5 text-[12.5px] font-bold uppercase tracking-[0.04em] transition shadow-card",
              qcm.status === "published"
                ? "bg-white ring-1 ring-inset ring-ink-700/10 text-mist-100 hover:bg-ink-50"
                : "bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50 disabled:pointer-events-none",
            )}
          >
            {qcm.status === "published" ? (
              <>
                Repasser en brouillon
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" strokeWidth={2.8} />
                Publier ce QCM
              </>
            )}
          </button>
        </div>
      </section>

      <p className="mt-12 text-center text-[11.5px] text-mist-400 max-w-md mx-auto">
        <Sparkles className="inline-block h-3 w-3 -mt-0.5 mr-1 text-amber-600" strokeWidth={2.6} />
        Auto-sauvegarde locale. Quand la prod sera live, &laquo; Publier &raquo;
        soumettra ton QCM au workflow review admin.
      </p>
    </div>
  );
}

// ─── Save state pill ────────────────────────────────────────────────────────

function SaveStatePill({
  state,
  completion,
}: {
  state: "saved" | "dirty" | "saving";
  completion: number;
}) {
  return (
    <div className="flex flex-col items-end gap-1.5">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.08em] ring-1 ring-inset",
          state === "saved"
            ? "bg-emerald-100 text-emerald-800 ring-emerald-300/40"
            : "bg-amber-100 text-amber-800 ring-amber-300/40",
        )}
      >
        {state === "saved" ? (
          <>
            <Check className="h-2.5 w-2.5" strokeWidth={3} />
            Sauvegardé
          </>
        ) : (
          <>
            <Save className="h-2.5 w-2.5" strokeWidth={2.8} />
            {state === "saving" ? "Sauvegarde…" : "Modifié"}
          </>
        )}
      </span>
      <span className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-mist-400 tabular-nums">
        Complétion {completion}%
      </span>
    </div>
  );
}

// ─── Field wrapper ──────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist-100 inline-flex items-center gap-1">
        {label}
        {required && <span className="text-rose-600">*</span>}
      </span>
      {hint && (
        <span className="block mt-0.5 text-[11px] text-mist-400">{hint}</span>
      )}
      <span className="block mt-1.5">{children}</span>
    </label>
  );
}

// ─── Question editor ────────────────────────────────────────────────────────

function QuestionEditor({
  question,
  index,
  onChange,
  onDelete,
}: {
  question: BuilderQuestion;
  index: number;
  onChange: (patch: Partial<BuilderQuestion>) => void;
  onDelete?: () => void;
}) {
  const isValid =
    question.prompt.trim() &&
    question.options.every((o) => o.trim()) &&
    question.correctIndex >= 0 &&
    question.correctIndex < 4;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="card-white p-5 relative"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <GripVertical className="h-3.5 w-3.5 text-mist-400 shrink-0" aria-hidden />
        <span
          className={cn(
            "inline-flex h-6 items-center justify-center rounded-full px-2 text-[10.5px] font-bold tabular-nums",
            isValid
              ? "bg-emerald-100 text-emerald-800"
              : "bg-ink-100 text-mist-100",
          )}
        >
          Q{index}
        </span>
        {isValid && (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.8} />
        )}
        <span className="flex-1" />
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Supprimer la question ${index}`}
            className="grid h-7 w-7 place-items-center rounded-full text-mist-400 hover:text-rose-600 hover:bg-rose-50 transition"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={2.4} />
          </button>
        )}
      </div>

      {/* Prompt */}
      <textarea
        value={question.prompt}
        onChange={(e) => onChange({ prompt: e.currentTarget.value })}
        placeholder="Énoncé de la question…"
        rows={2}
        maxLength={300}
        className="w-full rounded-xl bg-white ring-1 ring-inset ring-ink-700/10 focus:ring-2 focus:ring-amber-300/60 px-3 py-2 text-[14px] text-mist-50 placeholder:text-mist-400 outline-none transition resize-none"
      />

      {/* Options */}
      <div className="mt-3 space-y-2">
        {question.options.map((opt, i) => {
          const isCorrect = question.correctIndex === i;
          return (
            <div
              key={i}
              className={cn(
                "flex items-start gap-2 rounded-xl p-2 transition",
                isCorrect
                  ? "bg-emerald-50 ring-1 ring-inset ring-emerald-300/50"
                  : "bg-ink-50 ring-1 ring-inset ring-ink-700/10",
              )}
            >
              <button
                type="button"
                onClick={() =>
                  onChange({ correctIndex: i as 0 | 1 | 2 | 3 })
                }
                aria-label={`Marquer l'option ${String.fromCharCode(65 + i)} comme bonne réponse`}
                aria-pressed={isCorrect}
                className={cn(
                  "mt-1 grid h-6 w-6 place-items-center rounded-full text-[10px] font-black tabular-nums shrink-0 transition",
                  isCorrect
                    ? "bg-emerald-500 text-white"
                    : "bg-white ring-1 ring-inset ring-ink-700/15 text-mist-100 hover:ring-emerald-400 hover:text-emerald-700",
                )}
              >
                {isCorrect ? <Check className="h-3 w-3" strokeWidth={3} /> : String.fromCharCode(65 + i)}
              </button>
              <input
                type="text"
                value={opt}
                onChange={(e) => {
                  const next = [...question.options] as BuilderQuestion["options"];
                  next[i] = e.currentTarget.value;
                  onChange({ options: next });
                }}
                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                maxLength={200}
                className="flex-1 bg-transparent text-[13.5px] text-mist-50 placeholder:text-mist-400 outline-none"
              />
            </div>
          );
        })}
      </div>

      {/* Explanation */}
      <div className="mt-3">
        <label className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-mist-400">
          Explication (optionnelle)
        </label>
        <textarea
          value={question.explanation ?? ""}
          onChange={(e) => onChange({ explanation: e.currentTarget.value })}
          placeholder="Affichée après la réponse pour expliquer la bonne option."
          rows={2}
          maxLength={300}
          className="mt-1 w-full rounded-xl bg-white ring-1 ring-inset ring-ink-700/10 focus:ring-2 focus:ring-amber-300/60 px-3 py-2 text-[13px] text-mist-100 placeholder:text-mist-400 outline-none transition resize-none"
        />
      </div>
    </motion.div>
  );
}
