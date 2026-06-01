"use client";

import { useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Profile editor storage v1 — localStorage en attendant Supabase.
//
// Stocke le draft profil avec sections multi-média :
//   - photos      : data URLs (jusqu'à 12 — limite localStorage ~5MB total)
//   - cv          : { filename, dataUrl, sizeKb }
//   - videos      : array d'URLs YouTube / Vimeo (jusqu'à 6)
//   - bio, skills, experiences, availability, certifications
//
// Le composant édit en mémoire + persist debounced en localStorage.
// Migration future : remplacer par Supabase storage + table profiles_extra.
// ─────────────────────────────────────────────────────────────────────────────

const KEY = "tr:profile:draft:v1";
const EVENT = "tr:profile-changed";

export interface TalentProfile {
  displayName: string;
  professionId: string;
  city: string;
  bio: string;
  /** Photos : data URLs ou URLs absolues. */
  photos: string[];
  /** CV : info fichier. */
  cv: { filename: string; dataUrl: string; sizeKb: number } | null;
  /** URLs YouTube / Vimeo. */
  videos: string[];
  /** Compétences (chips). */
  skills: string[];
  /** Expériences (mini-cards). */
  experiences: Array<{
    id: string;
    title: string;
    company: string;
    period: string;
    description?: string;
  }>;
  /** Disponibilité. */
  availability: "now" | "30d" | "90d" | "not_available";
  /** Certifications (chips). */
  certifications: string[];
  /** Liens externes. */
  links: { github?: string; linkedin?: string; portfolio?: string; behance?: string };
}

export const EMPTY_PROFILE: TalentProfile = {
  displayName: "",
  professionId: "",
  city: "",
  bio: "",
  photos: [],
  cv: null,
  videos: [],
  skills: [],
  experiences: [],
  availability: "30d",
  certifications: [],
  links: {},
};

function read(): TalentProfile {
  if (typeof window === "undefined") return EMPTY_PROFILE;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY_PROFILE;
    const parsed = JSON.parse(raw);
    return { ...EMPTY_PROFILE, ...parsed };
  } catch {
    return EMPTY_PROFILE;
  }
}

function write(profile: TalentProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch (e) {
    // localStorage might be full (data URLs of photos can be heavy)
    console.warn("Profile save failed:", e);
  }
}

export function useTalentProfile(): {
  profile: TalentProfile;
  setProfile: (p: TalentProfile) => void;
  update: <K extends keyof TalentProfile>(key: K, value: TalentProfile[K]) => void;
  isHydrated: boolean;
} {
  const [profile, setProfileState] = useState<TalentProfile>(EMPTY_PROFILE);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setProfileState(read());
    setIsHydrated(true);
    const handler = () => setProfileState(read());
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);

  const setProfile = (p: TalentProfile) => {
    setProfileState(p);
    write(p);
  };
  const update = <K extends keyof TalentProfile>(key: K, value: TalentProfile[K]) => {
    setProfileState((prev) => {
      const next = { ...prev, [key]: value };
      write(next);
      return next;
    });
  };

  return { profile, setProfile, update, isHydrated };
}

// ─── Helpers ─────────────────────────────────────────────────────────────

/** Calcule le % complétion sur les 8 sections clés. */
export function computeCompletion(p: TalentProfile): {
  pct: number;
  completed: string[];
  total: number;
} {
  const checks: Array<{ id: string; done: boolean }> = [
    { id: "photo", done: p.photos.length > 0 },
    { id: "bio", done: p.bio.trim().length > 20 },
    { id: "cv", done: p.cv !== null },
    { id: "portfolio", done: p.photos.length >= 3 || p.videos.length > 0 },
    { id: "experiences", done: p.experiences.length > 0 },
    { id: "skills", done: p.skills.length >= 3 },
    { id: "availability", done: p.availability !== "not_available" },
    { id: "certifications", done: p.certifications.length > 0 },
  ];
  const completed = checks.filter((c) => c.done).map((c) => c.id);
  return {
    pct: Math.round((completed.length / checks.length) * 100),
    completed,
    total: checks.length,
  };
}

/** Parse une URL YouTube/Vimeo et renvoie l'URL embed. */
export function parseVideoEmbed(url: string): {
  provider: "youtube" | "vimeo" | "other";
  embedUrl: string;
  thumbnail?: string;
} | null {
  try {
    const u = new URL(url);
    // YouTube
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
      let videoId: string | null = null;
      if (u.hostname.includes("youtu.be")) {
        videoId = u.pathname.slice(1);
      } else if (u.pathname === "/watch") {
        videoId = u.searchParams.get("v");
      } else if (u.pathname.startsWith("/embed/")) {
        videoId = u.pathname.split("/embed/")[1]?.split(/[?/]/)[0] ?? null;
      } else if (u.pathname.startsWith("/shorts/")) {
        videoId = u.pathname.split("/shorts/")[1]?.split(/[?/]/)[0] ?? null;
      }
      if (videoId) {
        return {
          provider: "youtube",
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
          thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        };
      }
    }
    // Vimeo
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id && /^\d+$/.test(id)) {
        return {
          provider: "vimeo",
          embedUrl: `https://player.vimeo.com/video/${id}`,
        };
      }
    }
    // Fallback (Drive, autre)
    return { provider: "other", embedUrl: url };
  } catch {
    return null;
  }
}

/** Convert File en data URL (pour stockage localStorage en démo). */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
