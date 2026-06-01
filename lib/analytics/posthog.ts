"use client";

import { useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// PostHog analytics — env-gated (audit Mira G3-Mira-1).
//
// Sans NEXT_PUBLIC_POSTHOG_KEY → no-op silencieux.
// Avec la key → lazy-load le SDK posthog-js et capture les pageviews + events.
//
// Pourquoi env-gated : on ne veut pas charger 50kb de SDK pour les users en
// dev local. Et on ne veut pas dépendre d'un service externe au boot.
//
// API :
//   - usePosthogInit()    → hook à monter une fois (dans RootShell ou layout)
//   - trackEvent(name, props?)   → log un event custom
//   - identifyUser(id, traits?)  → quand auth est branché
// ─────────────────────────────────────────────────────────────────────────────

const PH_KEY = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_POSTHOG_KEY : undefined;
const PH_HOST =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.posthog.com"
    : "https://eu.posthog.com";

// On charge posthog-js dynamiquement (peer-dep optional) pour ne pas casser
// le build si le package n'est pas installé. Si l'user veut PostHog :
//   pnpm add posthog-js
type PostHogModule = {
  default: {
    init: (key: string, options: Record<string, unknown>) => void;
    capture: (name: string, props?: Record<string, unknown>) => void;
    identify: (id: string, traits?: Record<string, unknown>) => void;
    reset: () => void;
  };
};

let _ph: PostHogModule["default"] | null = null;
let _initStarted = false;

async function ensureInit(): Promise<void> {
  if (_ph || _initStarted || !PH_KEY || typeof window === "undefined") return;
  _initStarted = true;
  try {
    // @ts-expect-error — peer dep optionnelle, import dynamique
    const mod = (await import("posthog-js")) as PostHogModule;
    mod.default.init(PH_KEY, {
      api_host: PH_HOST,
      person_profiles: "identified_only",
      capture_pageview: true,
      capture_pageleave: true,
    });
    _ph = mod.default;
  } catch {
    // posthog-js pas installé — silently no-op
    if (typeof console !== "undefined") {
      console.info(
        "[analytics] PostHog not loaded (install `posthog-js` to enable, or unset NEXT_PUBLIC_POSTHOG_KEY)",
      );
    }
  }
}

export function usePosthogInit(): void {
  useEffect(() => {
    void ensureInit();
  }, []);
}

export function trackEvent(name: string, props?: Record<string, unknown>): void {
  if (!_ph) {
    void ensureInit().then(() => _ph?.capture(name, props));
    return;
  }
  _ph.capture(name, props);
}

export function identifyUser(id: string, traits?: Record<string, unknown>): void {
  if (!_ph) {
    void ensureInit().then(() => _ph?.identify(id, traits));
    return;
  }
  _ph.identify(id, traits);
}

export function isAnalyticsEnabled(): boolean {
  return Boolean(PH_KEY);
}
