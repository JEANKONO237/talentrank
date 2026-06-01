import "server-only";
import { cookies } from "next/headers";
import {
  AUDIENCE_COOKIE,
  AUDIENCE_COOKIE_MAX_AGE,
  ONBOARDED_COOKIE,
  isAudience,
  type Audience,
} from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Audience helpers — server-side (Server Components, Route Handlers,
// Server Actions, middleware). Le cookie est lu depuis next/headers.
// ─────────────────────────────────────────────────────────────────────────────

/** Lit l'audience courante depuis le cookie. Renvoie null si jamais set
 *  (= user n'a pas encore fait le choix → afficher /welcome). */
export async function getAudienceServer(): Promise<Audience | null> {
  const store = await cookies();
  const v = store.get(AUDIENCE_COOKIE)?.value;
  return isAudience(v) ? v : null;
}

/** Set l'audience via cookie. À appeler dans une Server Action. */
export async function setAudienceServer(value: Audience): Promise<void> {
  const store = await cookies();
  store.set(AUDIENCE_COOKIE, value, {
    path: "/",
    maxAge: AUDIENCE_COOKIE_MAX_AGE,
    sameSite: "lax",
    httpOnly: false, // lisible côté client pour adapter UI sans roundtrip
  });
}

/** Efface le cookie audience — force /welcome au prochain reload. Util pour
 *  "Reset choix" dans les settings. */
export async function clearAudienceServer(): Promise<void> {
  const store = await cookies();
  store.delete(AUDIENCE_COOKIE);
}

// ─── Onboarded flag ──────────────────────────────────────────────────────

export async function isOnboardedServer(): Promise<boolean> {
  const store = await cookies();
  return store.get(ONBOARDED_COOKIE)?.value === "1";
}

export async function setOnboardedServer(): Promise<void> {
  const store = await cookies();
  store.set(ONBOARDED_COOKIE, "1", {
    path: "/",
    maxAge: AUDIENCE_COOKIE_MAX_AGE,
    sameSite: "lax",
    httpOnly: false,
  });
}

export async function clearOnboardedServer(): Promise<void> {
  const store = await cookies();
  store.delete(ONBOARDED_COOKIE);
}
