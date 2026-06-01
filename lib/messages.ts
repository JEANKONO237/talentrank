"use client";

// In-platform messaging store
// ----------------------------------------------------------------------------
// Recruiters / companies can write a free-form message to any talent directly
// from their profile page. For now we persist to localStorage (no backend), so
// the user can replay their outgoing thread and see it appear in their recruiter
// dashboard. Later we swap the storage layer for a Supabase RPC without
// touching call sites.
//
// Important: messages are stored on the SENDER'S device. This is the recruiter
// outbox. When the backend lands, sending will mirror this object to the
// recipient's inbox via RLS-aware writes.

const STORAGE_KEY = "talentrank:messages:v1";

export type MessageStatus = "sent" | "delivered" | "read" | "replied";

export interface SentMessage {
  id: string;
  /** Talent id (recipient). */
  talentId: string;
  /** Talent slug — used to link back to their profile. */
  talentSlug: string;
  /** Display name of the recipient, denormalised so the outbox can render
   *  without re-resolving against the talent table. */
  talentName: string;
  talentInitials: string;
  /** Gradient class string ("from-X via-Y to-Z"). */
  talentGradient: string;
  /** Country code for flag display in outbox. */
  talentCountryCode?: string;
  /** Optional subject line. Empty string when omitted. */
  subject: string;
  /** Required body (free-form, plain text). */
  body: string;
  /** Epoch milliseconds at send time. */
  sentAt: number;
  status: MessageStatus;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readAll(): SentMessage[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SentMessage[]) : [];
  } catch {
    return [];
  }
}

function writeAll(list: SentMessage[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    // Broadcast to other tabs / components mounted in this tab.
    window.dispatchEvent(new CustomEvent("talentrank:messages-changed"));
  } catch {
    /* quota exceeded or storage unavailable — silently ignore */
  }
}

export function listSentMessages(): SentMessage[] {
  return readAll().sort((a, b) => b.sentAt - a.sentAt);
}

export function listMessagesForTalent(talentId: string): SentMessage[] {
  return readAll()
    .filter((m) => m.talentId === talentId)
    .sort((a, b) => b.sentAt - a.sentAt);
}

export interface SendMessageInput {
  talentId: string;
  talentSlug: string;
  talentName: string;
  talentInitials: string;
  talentGradient: string;
  talentCountryCode?: string;
  subject?: string;
  body: string;
}

export function sendMessage(input: SendMessageInput): SentMessage {
  const trimmedBody = input.body.trim();
  if (!trimmedBody) throw new Error("Le message ne peut pas être vide.");
  if (trimmedBody.length > 4000) throw new Error("Le message dépasse 4000 caractères.");

  const msg: SentMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    talentId: input.talentId,
    talentSlug: input.talentSlug,
    talentName: input.talentName,
    talentInitials: input.talentInitials,
    talentGradient: input.talentGradient,
    talentCountryCode: input.talentCountryCode,
    subject: (input.subject ?? "").trim(),
    body: trimmedBody,
    sentAt: Date.now(),
    status: "sent",
  };

  writeAll([msg, ...readAll()]);
  return msg;
}

/** React-friendly subscription: callback fires whenever the outbox changes
 *  (same tab via CustomEvent, or another tab via the storage event). */
export function subscribeMessages(callback: (list: SentMessage[]) => void): () => void {
  if (!isBrowser()) return () => {};
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback(listSentMessages());
  };
  const handleCustom = () => callback(listSentMessages());
  window.addEventListener("storage", handleStorage);
  window.addEventListener("talentrank:messages-changed", handleCustom);
  // Initial push so callers don't need to call read separately.
  callback(listSentMessages());
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("talentrank:messages-changed", handleCustom);
  };
}
