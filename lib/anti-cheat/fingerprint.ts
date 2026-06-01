// TalentRank — Browser fingerprint (anti-cheat)
// ----------------------------------------------------------------------------
// Hash stable du navigateur d'un utilisateur. Sert à identifier un même
// browser même si l'utilisateur change de compte ou nettoie son localStorage.
//
// Sources combinées (chacune ajoute de l'entropie sans toucher au stockage) :
//   1. Canvas signature   — rendu d'un texte stylisé sur un canvas 2D ; le
//                           rendu varie par GPU/driver/anti-aliasing settings.
//                           Très stable pour une même machine, varie entre
//                           OS différents.
//   2. AudioContext        — un OfflineAudioContext rend une oscillation et
//                           on lit la somme de la frequency bin. Varie par
//                           driver audio / hardware.
//   3. WebGL renderer     — vendor + renderer strings via WEBGL_debug_renderer_info.
//   4. UA + platform      — navigator.userAgent + navigator.platform.
//   5. Screen + tz        — screen.width/height/colorDepth + Intl timezone.
//   6. Hardware concurrency + deviceMemory  — CPU cores, GB de RAM si exposé.
//
// Le hash final = sha256 hex truncated à 32 chars (256 bits → 128 bits qui
// suffit largement pour de l'identification, et c'est plus court à logger).
//
// Précautions :
//   - Tous les checks sont try/catch ; si une API est absente, on contribue
//     un fallback. Le hash reste stable pour ce browser.
//   - On NE persiste rien client-side. Le hash est juste envoyé aux RPC
//     start_qcm_attempt et can_start_qcm.
//   - RGPD : pas de PII identifiante directe. C'est un hash technique
//     équivalent à une empreinte machine, comme TLS fingerprinting côté
//     network. À documenter dans la privacy policy (anti-cheat security).

"use client";

// ─── Public API ──────────────────────────────────────────────────────────

let _cached: string | null = null;
let _inflight: Promise<string> | null = null;

/** Calcule (ou retourne le cache) du fingerprint du browser courant.
 *  Cache mémoire pendant la durée de la session — pas de re-calcul à
 *  chaque mount. */
export async function getBrowserFingerprint(): Promise<string> {
  if (_cached) return _cached;
  if (_inflight) return _inflight;
  _inflight = computeFingerprint();
  try {
    const fp = await _inflight;
    _cached = fp;
    return fp;
  } finally {
    _inflight = null;
  }
}

// ─── Computation ─────────────────────────────────────────────────────────

async function computeFingerprint(): Promise<string> {
  const components: string[] = [];

  components.push(`v=2`);
  components.push(`ua=${safeUserAgent()}`);
  components.push(`pf=${safePlatform()}`);
  components.push(`tz=${safeTimezone()}`);
  components.push(`scr=${safeScreen()}`);
  components.push(`lng=${safeLanguages()}`);
  components.push(`hc=${safeHardware()}`);
  components.push(`canvas=${await safeCanvas()}`);
  components.push(`audio=${await safeAudio()}`);
  components.push(`webgl=${safeWebGL()}`);

  const payload = components.join("|");
  const hash = await sha256(payload);
  // 32 chars hex = 128 bits — largement suffisant
  return hash.slice(0, 32);
}

// ─── Source : User Agent / platform ──────────────────────────────────────

function safeUserAgent(): string {
  try {
    return navigator.userAgent || "ua-none";
  } catch {
    return "ua-error";
  }
}

function safePlatform(): string {
  try {
    return navigator.platform || "pf-none";
  } catch {
    return "pf-error";
  }
}

function safeTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "tz-none";
  } catch {
    return "tz-error";
  }
}

function safeScreen(): string {
  try {
    if (typeof screen === "undefined") return "scr-none";
    return `${screen.width}x${screen.height}x${screen.colorDepth ?? 24}`;
  } catch {
    return "scr-error";
  }
}

function safeLanguages(): string {
  try {
    const langs = navigator.languages?.join(",") ?? navigator.language ?? "";
    return langs || "lng-none";
  } catch {
    return "lng-error";
  }
}

function safeHardware(): string {
  try {
    const cores = (navigator.hardwareConcurrency ?? 0).toString();
    // deviceMemory: extension proposée Chrome/Edge — pas dans tous navigateurs
    const nav = navigator as Navigator & { deviceMemory?: number };
    const mem = (nav.deviceMemory ?? 0).toString();
    return `c${cores}m${mem}`;
  } catch {
    return "hc-error";
  }
}

// ─── Source : Canvas signature ───────────────────────────────────────────
// Dessine un texte stylisé sur un canvas, puis lit le PNG dataURL.
// Le rendu pixel-perfect varie par GPU/driver/anti-aliasing.

async function safeCanvas(): Promise<string> {
  try {
    if (typeof document === "undefined") return "cv-ssr";
    const canvas = document.createElement("canvas");
    canvas.width = 220;
    canvas.height = 60;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "cv-no-ctx";

    // Texte avec courbure et glyphes exotiques pour stresser le renderer
    ctx.textBaseline = "alphabetic";
    ctx.font = "16px 'Arial', sans-serif";
    ctx.fillStyle = "#F59E0B";
    ctx.fillRect(0, 0, 220, 60);
    ctx.fillStyle = "#1A2535";
    ctx.fillText("TalentRank · 🎯🦊🐉", 4, 22);
    ctx.font = "20px 'Times New Roman', serif";
    ctx.fillStyle = "rgba(28, 176, 246, 0.7)";
    ctx.fillText("Anti-cheat probe", 4, 48);

    // Read first 1KB du dataURL — assez pour empreinter sans payload énorme
    const dataUrl = canvas.toDataURL("image/png");
    return dataUrl.slice(22, 22 + 1024);
  } catch {
    return "cv-error";
  }
}

// ─── Source : AudioContext ───────────────────────────────────────────────

async function safeAudio(): Promise<string> {
  try {
    if (typeof window === "undefined") return "au-ssr";
    type AudioCtor = typeof OfflineAudioContext;
    const Ctor: AudioCtor | undefined =
      (window as Window & { OfflineAudioContext?: AudioCtor; webkitOfflineAudioContext?: AudioCtor })
        .OfflineAudioContext ??
      (window as Window & { OfflineAudioContext?: AudioCtor; webkitOfflineAudioContext?: AudioCtor })
        .webkitOfflineAudioContext;
    if (!Ctor) return "au-none";

    const ctx = new Ctor(1, 44100, 44100);
    const oscillator = ctx.createOscillator();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(10000, 0);
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-50, 0);
    compressor.knee.setValueAtTime(40, 0);
    compressor.ratio.setValueAtTime(12, 0);
    compressor.attack.setValueAtTime(0, 0);
    compressor.release.setValueAtTime(0.25, 0);
    oscillator.connect(compressor);
    compressor.connect(ctx.destination);
    oscillator.start(0);

    // Avec un timeout pour éviter de bloquer si l'API stall
    const buffer = await Promise.race([
      ctx.startRendering(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
    ]);
    if (!buffer || typeof buffer === "object" && !("getChannelData" in buffer)) return "au-timeout";

    const data = (buffer as AudioBuffer).getChannelData(0);
    // Sum sur une plage stable
    let sum = 0;
    for (let i = 4500; i < 5000; i++) sum += Math.abs(data[i] ?? 0);
    return sum.toString();
  } catch {
    return "au-error";
  }
}

// ─── Source : WebGL renderer ─────────────────────────────────────────────

function safeWebGL(): string {
  try {
    if (typeof document === "undefined") return "gl-ssr";
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) return "gl-none";
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    if (!dbg) {
      return `${gl.getParameter(gl.VENDOR)}|${gl.getParameter(gl.RENDERER)}`;
    }
    const vendor = gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL);
    const renderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
    return `${vendor}|${renderer}`;
  } catch {
    return "gl-error";
  }
}

// ─── Hashing (sha256 via SubtleCrypto) ───────────────────────────────────

async function sha256(input: string): Promise<string> {
  try {
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const enc = new TextEncoder();
      const data = enc.encode(input);
      const buf = await crypto.subtle.digest("SHA-256", data);
      return [...new Uint8Array(buf)]
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }
  } catch {
    /* fall through */
  }
  // Fallback djb2-ish — pas crypto mais stable
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(16).padStart(8, "0").repeat(8);
}

// ─── React hook (commodité) ──────────────────────────────────────────────

import { useEffect, useState } from "react";

/** Hook qui retourne le fingerprint dès qu'il est calculé. null pendant
 *  le calcul initial (~100-300ms en général). */
export function useBrowserFingerprint(): string | null {
  const [fp, setFp] = useState<string | null>(_cached);
  useEffect(() => {
    if (_cached) {
      setFp(_cached);
      return;
    }
    let cancelled = false;
    getBrowserFingerprint().then((value) => {
      if (!cancelled) setFp(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return fp;
}
