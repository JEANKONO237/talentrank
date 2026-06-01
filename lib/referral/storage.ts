"use client";

import { useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Referral storage — programme de parrainage pre-launch.
//
// Audit Sasha G3-Sasha-4 : "Invite 3 amis, saute la queue beta" — mécanique
// virale standard pre-launch. Sans ça, 0 acquisition organique.
//
// v1 localStorage (anonyme), v2 → Supabase quand auth est branché.
// Le code génère un slug unique par user/browser et compte les invitations
// "ouvertes" (un clic sur le lien depuis un autre browser/tab).
// ─────────────────────────────────────────────────────────────────────────────

const SLUG_KEY = "tr:referral:my-slug:v1";
const INVITES_KEY = "tr:referral:invites:v1";
const EVENT = "tr:referral-changed";

interface InviteEntry {
  /** Email de l'invité (optionnel — si renseigné par le user). */
  email?: string;
  /** Date d'envoi. */
  ts: number;
  /** Statut. "sent" = lien partagé, "clicked" = le link a été visité,
   *  "joined" = l'invité a créé un compte (à wire quand auth live). */
  status: "sent" | "clicked" | "joined";
}

function generateSlug(): string {
  const random = Math.random().toString(36).slice(2, 8);
  const ts = Date.now().toString(36).slice(-4);
  return `${random}${ts}`;
}

export function getMySlug(): string {
  if (typeof window === "undefined") return "";
  let slug = localStorage.getItem(SLUG_KEY);
  if (!slug) {
    slug = generateSlug();
    localStorage.setItem(SLUG_KEY, slug);
  }
  return slug;
}

export function getInvites(): InviteEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(INVITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function logInviteSent(email?: string): void {
  if (typeof window === "undefined") return;
  const list = getInvites();
  list.push({ email, ts: Date.now(), status: "sent" });
  localStorage.setItem(INVITES_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function useReferral(): {
  slug: string;
  inviteUrl: string;
  invites: InviteEntry[];
  count: number;
  /** True si seuil queue-jump atteint (3 invitations sent+). */
  hasJumpedQueue: boolean;
} {
  const [slug, setSlug] = useState("");
  const [invites, setInvites] = useState<InviteEntry[]>([]);

  useEffect(() => {
    setSlug(getMySlug());
    setInvites(getInvites());
    const handler = () => setInvites(getInvites());
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);

  const inviteUrl = slug && typeof window !== "undefined"
    ? `${window.location.origin}/welcome?ref=${slug}`
    : "";

  return {
    slug,
    inviteUrl,
    invites,
    count: invites.length,
    hasJumpedQueue: invites.length >= 3,
  };
}
