"use client";

import { useEffect, useState } from "react";
import { AUDIENCE_COOKIE, AUDIENCE_COOKIE_MAX_AGE, isAudience, type Audience } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Audience helpers — client-side. Lit/écrit le cookie via document.cookie
// (le cookie n'est PAS httpOnly volontairement). Émet un event custom à
// chaque switch pour que tous les composants useAudience() se mettent à
// jour sans devoir re-fetch.
// ─────────────────────────────────────────────────────────────────────────────

const SWITCH_EVENT = "tr:audience-changed";

function readCookie(): Audience | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${AUDIENCE_COOKIE}=`));
  if (!match) return null;
  const v = decodeURIComponent(match.slice(AUDIENCE_COOKIE.length + 1));
  return isAudience(v) ? v : null;
}

function writeCookie(value: Audience): void {
  if (typeof document === "undefined") return;
  document.cookie = `${AUDIENCE_COOKIE}=${encodeURIComponent(value)}; path=/; max-age=${AUDIENCE_COOKIE_MAX_AGE}; samesite=lax`;
  window.dispatchEvent(new CustomEvent(SWITCH_EVENT));
}

function clearCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${AUDIENCE_COOKIE}=; path=/; max-age=0; samesite=lax`;
  window.dispatchEvent(new CustomEvent(SWITCH_EVENT));
}

/** Hook réactif : lit l'audience du cookie + s'abonne aux changements
 *  via l'event custom. Renvoie null en SSR / avant hydration. */
export function useAudience(): {
  audience: Audience | null;
  setAudience: (a: Audience) => void;
  clearAudience: () => void;
  isHydrated: boolean;
} {
  const [audience, setAudienceState] = useState<Audience | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setAudienceState(readCookie());
    setIsHydrated(true);
    const handler = () => setAudienceState(readCookie());
    window.addEventListener(SWITCH_EVENT, handler);
    return () => window.removeEventListener(SWITCH_EVENT, handler);
  }, []);

  return {
    audience,
    isHydrated,
    setAudience: (v) => writeCookie(v),
    clearAudience: () => clearCookie(),
  };
}
