"use client";

import { useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// QCM Builder — storage local v1.
//
// MVP : permettre à un studio de créer ses QCM custom, les éditer, les
// "publier" (cosmétique pour l'instant, statut local). Quand Supabase sera
// branché, on migrera vers la table `studio_qcm_drafts` (cf SUPABASE_SETUP.md).
//
// Anti-cheat : le scope de ce module est l'authoring uniquement. Les attempts
// + scoring continuent de passer par lib/qcm/* (déjà câblé Supabase).
// ─────────────────────────────────────────────────────────────────────────────

const KEY = "tr:qcm-builder:drafts:v1";
const EVENT = "tr:qcm-builder-changed";

export interface BuilderQuestion {
  id: string;
  prompt: string;
  /** 4 options de réponse. Exactement 4 — c'est la convention TalentRank. */
  options: [string, string, string, string];
  /** Index de la bonne réponse (0..3). */
  correctIndex: 0 | 1 | 2 | 3;
  /** Explication facultative montrée après réponse. */
  explanation?: string;
}

export interface CustomQcm {
  id: string;
  title: string;
  description: string;
  /** Métier ciblé (ID profession). Optionnel mais conseillé. */
  professionId?: string;
  questions: BuilderQuestion[];
  status: "draft" | "published";
  createdAt: number;
  updatedAt: number;
}

export const EMPTY_QUESTION = (): BuilderQuestion => ({
  id: cryptoId(),
  prompt: "",
  options: ["", "", "", ""],
  correctIndex: 0,
  explanation: "",
});

export const EMPTY_QCM = (): CustomQcm => ({
  id: cryptoId(),
  title: "",
  description: "",
  professionId: undefined,
  questions: [EMPTY_QUESTION()],
  status: "draft",
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

function cryptoId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  // Fallback déterministe court
  return `q_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function read(): CustomQcm[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(qcms: CustomQcm[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(qcms));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {
    /* quota — silencieux pour la v1 */
  }
}

/** Hook réactif — toutes les instances se resyncent au save. */
export function useCustomQcms(): {
  qcms: CustomQcm[];
  saveQcm: (qcm: CustomQcm) => void;
  deleteQcm: (id: string) => void;
} {
  const [qcms, setQcms] = useState<CustomQcm[]>([]);

  useEffect(() => {
    setQcms(read());
    const handler = () => setQcms(read());
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);

  return {
    qcms,
    saveQcm: (qcm) => {
      const list = read();
      const idx = list.findIndex((q) => q.id === qcm.id);
      const updated = { ...qcm, updatedAt: Date.now() };
      if (idx >= 0) list[idx] = updated;
      else list.unshift(updated);
      write(list);
    },
    deleteQcm: (id) => {
      write(read().filter((q) => q.id !== id));
    },
  };
}

/** Lookup direct par id (pas reactif). Utile dans l'éditeur sur load. */
export function getCustomQcm(id: string): CustomQcm | undefined {
  return read().find((q) => q.id === id);
}

/** Calcule le pourcentage de complétion d'un QCM. */
export function qcmCompletionScore(qcm: CustomQcm): number {
  const fields: number[] = [];
  fields.push(qcm.title.trim() ? 1 : 0);
  fields.push(qcm.description.trim() ? 1 : 0);
  fields.push(qcm.professionId ? 1 : 0);
  // Question valide = prompt non vide + 4 options + une bonne réponse
  const validQuestions = qcm.questions.filter(
    (q) =>
      q.prompt.trim() &&
      q.options.every((o) => o.trim()) &&
      q.correctIndex >= 0 &&
      q.correctIndex < 4,
  );
  fields.push(validQuestions.length >= 3 ? 1 : validQuestions.length / 3);

  return Math.round((fields.reduce((a, b) => a + b, 0) / fields.length) * 100);
}
