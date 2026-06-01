"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Award,
  Briefcase,
  Camera,
  Check,
  Clock,
  ExternalLink,
  FileText,
  Github,
  Globe,
  Linkedin,
  MapPin,
  Plus,
  Trash2,
  Upload,
  User,
  Video,
  X,
} from "lucide-react";
import {
  computeCompletion,
  fileToDataUrl,
  parseVideoEmbed,
  useTalentProfile,
  type TalentProfile,
} from "@/lib/profile/storage";
import { ProfileCompletion } from "@/components/talent/ProfileCompletion";
import { listBanks } from "@/lib/qcm/registry";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// RichProfileEditor — édition complète du profil talent.
//
// Sections (chacune autonome, sauvegardée à la volée) :
//   1. Identité           — nom, ville, métier principal, dispo, liens
//   2. Galerie photos     — multi-upload, supprime, jusqu'à 12 photos
//   3. CV                 — upload PDF + preview filename + taille
//   4. Vidéos             — URLs YouTube/Vimeo + preview embed
//   5. Bio                — textarea + compteur 280 char
//   6. Compétences        — chips ajoutables, suppression au hover
//   7. Expériences        — mini-cards (titre/entreprise/période/desc)
//   8. Certifications     — chips ajoutables
//
// Stockage : localStorage via useTalentProfile() (en attendant Supabase).
// ProfileCompletion en haut montre le % live.
// ─────────────────────────────────────────────────────────────────────────────

const MAX_PHOTOS = 12;
const MAX_VIDEOS = 6;
const BIO_MAX = 280;
const AVAIL_LABELS: Record<TalentProfile["availability"], string> = {
  now: "Maintenant",
  "30d": "Sous 30 jours",
  "90d": "Sous 90 jours",
  not_available: "Pas disponible",
};

export function RichProfileEditor() {
  const { profile, update, isHydrated } = useTalentProfile();
  const banks = listBanks();

  if (!isHydrated) {
    return (
      <div className="container-page pt-12 pb-20 text-center">
        <p className="text-mist-400">Chargement de ton profil…</p>
      </div>
    );
  }

  const { pct, completed } = computeCompletion(profile);

  return (
    <div className="container-page pt-10 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <Link
          href="/talent"
          className="inline-flex items-center gap-1.5 text-[12px] font-bold text-mist-400 hover:text-mist-50 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.6} />
          Accueil
        </Link>
        <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-mist-400">
          Sauvegarde automatique
          <span className="inline-block ml-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" style={{ boxShadow: "0 0 6px rgba(16,185,129,0.7)" }} />
        </span>
      </div>

      <div className="mb-6">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400">
          Mon profil
        </p>
        <h1
          className="mt-1 font-display font-black tracking-tight text-mist-50"
          style={{
            fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}
        >
          Construis ton profil.
        </h1>
        <p className="mt-2 text-[13.5px] text-mist-300 max-w-xl">
          Chaque section que tu remplis booste ta visibilité auprès des
          studios. Tout est privé tant que tu n&apos;es pas listé dans un classement.
        </p>
      </div>

      {/* Completion bar */}
      <div className="mb-8">
        <ProfileCompletion completed={completed} expanded={false} />
      </div>

      {/* Grid sections — réordonné (audit Marco G2-Marco-3) :
          le user remplit le CŒUR rapide d'abord (identité, bio, skills, dispo),
          puis les MÉDIAS lourds (photos, vidéo, CV), enfin l'EXPÉRIENCE pro.
          Au lieu d'être confronté aux 12 slots photo vides en arrivant, il a
          un sentiment de complétion rapide sur les 4 premières sections. */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left col : 2/3 — cœur du profil + médias riches */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Cœur du profil (rapide à remplir) */}
          <IdentitySection profile={profile} update={update} banks={banks} />
          <BioSection profile={profile} update={update} />
          {/* 2. Médias lourds (prend plus de temps, mais valorisé) */}
          <PhotoGallerySection profile={profile} update={update} />
          <VideosSection profile={profile} update={update} />
          <CVSection profile={profile} update={update} />
        </div>

        {/* Right col : 1/3 — métadonnées compactes (chips, dispo, exp) */}
        <div className="space-y-6">
          {/* Méta rapides en haut */}
          <SkillsSection profile={profile} update={update} />
          <AvailabilitySection profile={profile} update={update} />
          {/* Expériences (plus de friction, donc plus bas) */}
          <ExperiencesSection profile={profile} update={update} />
          <CertificationsSection profile={profile} update={update} />
          <LinksSection profile={profile} update={update} />
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="mt-10 text-center">
        <p className="text-[12.5px] text-mist-400">
          Profil complété à <span className="font-bold text-mist-50">{pct}%</span> ·{" "}
          {pct < 100 ? (
            <>Continue pour gagner en visibilité.</>
          ) : (
            <span className="text-emerald-700 font-bold">Profil complet — tu es prioritaire !</span>
          )}
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1 — IDENTITÉ
// ═══════════════════════════════════════════════════════════════════════════

function IdentitySection({
  profile,
  update,
  banks,
}: {
  profile: TalentProfile;
  update: <K extends keyof TalentProfile>(k: K, v: TalentProfile[K]) => void;
  banks: { professionId: string; frLabel: string }[];
}) {
  return (
    <SectionCard
      icon={<User className="h-4 w-4" strokeWidth={2.4} />}
      title="Identité"
      accent="#1A2535"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TextField
          label="Nom complet"
          value={profile.displayName}
          onChange={(v) => update("displayName", v)}
          placeholder="Jean Marie O."
        />
        <TextField
          label="Ville"
          value={profile.city}
          onChange={(v) => update("city", v)}
          placeholder="Paris, France"
          icon={<MapPin className="h-3 w-3" strokeWidth={2.6} />}
        />
        <SelectField
          label="Métier principal"
          value={profile.professionId}
          onChange={(v) => update("professionId", v)}
          options={banks.map((b) => ({ value: b.professionId, label: b.frLabel }))}
          placeholder="Choisir…"
          className="sm:col-span-2"
        />
      </div>
    </SectionCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2 — GALERIE PHOTOS
// ═══════════════════════════════════════════════════════════════════════════

function PhotoGallerySection({
  profile,
  update,
}: {
  profile: TalentProfile;
  update: <K extends keyof TalentProfile>(k: K, v: TalentProfile[K]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const remaining = MAX_PHOTOS - profile.photos.length;
    const toAdd: string[] = [];
    for (const file of Array.from(files).slice(0, remaining)) {
      if (!file.type.startsWith("image/")) continue;
      try {
        const dataUrl = await fileToDataUrl(file);
        toAdd.push(dataUrl);
      } catch {
        /* ignore */
      }
    }
    update("photos", [...profile.photos, ...toAdd]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = (i: number) =>
    update(
      "photos",
      profile.photos.filter((_, idx) => idx !== i),
    );

  const move = (from: number, to: number) => {
    if (to < 0 || to >= profile.photos.length) return;
    const arr = [...profile.photos];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    update("photos", arr);
  };

  return (
    <SectionCard
      icon={<Camera className="h-4 w-4" strokeWidth={2.4} />}
      title="Galerie photos"
      accent="#F472B6"
      hint={`${profile.photos.length} / ${MAX_PHOTOS}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleUpload(e.target.files)}
        className="hidden"
        aria-label="Ajouter des photos"
      />

      {profile.photos.length === 0 ? (
        <EmptyDropZone
          onClick={() => inputRef.current?.click()}
          uploading={uploading}
          icon={<Camera className="h-8 w-8" strokeWidth={1.8} />}
          title="Glisse tes photos ici"
          hint="JPG, PNG, WebP · jusqu'à 12 photos"
          accent="#F472B6"
        />
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {profile.photos.map((src, i) => (
            <motion.div
              key={`${i}-${src.slice(-20)}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group relative aspect-square overflow-hidden rounded-xl ring-1 ring-inset ring-ink-700/10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
              {/* Reorder + delete overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, i - 1)}
                    disabled={i === 0}
                    className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-night-900 text-[12px] font-bold disabled:opacity-30"
                    aria-label="Déplacer à gauche"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, i + 1)}
                    disabled={i === profile.photos.length - 1}
                    className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-night-900 text-[12px] font-bold disabled:opacity-30"
                    aria-label="Déplacer à droite"
                  >
                    →
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="grid h-7 w-7 place-items-center rounded-full bg-rose-500 text-white"
                  aria-label="Supprimer"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2.4} />
                </button>
              </div>
              {i === 0 && (
                <span className="absolute top-1.5 left-1.5 inline-flex items-center rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-ink-950">
                  Cover
                </span>
              )}
            </motion.div>
          ))}
          {profile.photos.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="aspect-square rounded-xl border-2 border-dashed border-ink-700/20 hover:border-pink-400/60 hover:bg-pink-50/40 transition flex flex-col items-center justify-center gap-1 text-mist-400 hover:text-pink-600"
            >
              <Plus className="h-5 w-5" strokeWidth={2.4} />
              <span className="text-[10px] font-bold">Ajouter</span>
            </button>
          )}
        </div>
      )}
    </SectionCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3 — VIDÉOS (YouTube / Vimeo)
// ═══════════════════════════════════════════════════════════════════════════

function VideosSection({
  profile,
  update,
}: {
  profile: TalentProfile;
  update: <K extends keyof TalentProfile>(k: K, v: TalentProfile[K]) => void;
}) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const add = () => {
    if (profile.videos.length >= MAX_VIDEOS) {
      setError(`Maximum ${MAX_VIDEOS} vidéos`);
      return;
    }
    const trimmed = url.trim();
    if (!trimmed) return;
    const parsed = parseVideoEmbed(trimmed);
    if (!parsed) {
      setError("URL invalide. Utilise une URL YouTube ou Vimeo.");
      return;
    }
    if (profile.videos.includes(trimmed)) {
      setError("Vidéo déjà ajoutée.");
      return;
    }
    update("videos", [...profile.videos, trimmed]);
    setUrl("");
    setError(null);
  };

  const remove = (i: number) =>
    update(
      "videos",
      profile.videos.filter((_, idx) => idx !== i),
    );

  return (
    <SectionCard
      icon={<Video className="h-4 w-4" strokeWidth={2.4} />}
      title="Vidéos / Showreel"
      accent="#A78BFA"
      hint={`${profile.videos.length} / ${MAX_VIDEOS}`}
    >
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.currentTarget.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="https://youtube.com/watch?v=… ou https://vimeo.com/…"
          className="flex-1 h-11 rounded-xl bg-white ring-1 ring-inset ring-ink-700/15 focus:ring-2 focus:ring-night-700/50 px-4 text-[13px] text-mist-50 placeholder:text-mist-400 outline-none transition"
        />
        <button
          type="button"
          onClick={add}
          disabled={!url.trim() || profile.videos.length >= MAX_VIDEOS}
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl px-4 text-[12px] font-bold uppercase tracking-[0.06em] text-white transition disabled:opacity-40"
          style={{
            background: "linear-gradient(180deg, #A78BFA, #7C3AED)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), 0 4px 12px -4px rgba(124,58,237,0.4)",
          }}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.6} />
          Ajouter
        </button>
      </div>
      {error && <p className="mt-2 text-[11.5px] text-rose-700 font-medium">{error}</p>}

      {profile.videos.length > 0 && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {profile.videos.map((vurl, i) => {
            const parsed = parseVideoEmbed(vurl);
            return (
              <motion.div
                key={vurl}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative rounded-xl overflow-hidden ring-1 ring-inset ring-ink-700/10 bg-ink-850"
              >
                {parsed?.embedUrl ? (
                  <div className="relative aspect-video">
                    <iframe
                      src={parsed.embedUrl}
                      title={`Vidéo ${i + 1}`}
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 h-full w-full"
                    />
                  </div>
                ) : (
                  <div className="aspect-video grid place-items-center text-mist-400 text-[12px]">
                    Aperçu indisponible
                  </div>
                )}
                <div className="flex items-center justify-between gap-2 px-3 py-2 bg-white">
                  <a
                    href={vurl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10.5px] font-bold text-mist-300 hover:text-mist-50 truncate"
                  >
                    <ExternalLink className="h-2.5 w-2.5" strokeWidth={2.6} />
                    {parsed?.provider ?? "URL"}
                  </a>
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="grid h-6 w-6 place-items-center rounded-full text-rose-600 hover:bg-rose-100 transition"
                    aria-label="Supprimer vidéo"
                  >
                    <Trash2 className="h-3 w-3" strokeWidth={2.4} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4 — CV
// ═══════════════════════════════════════════════════════════════════════════

function CVSection({
  profile,
  update,
}: {
  profile: TalentProfile;
  update: <K extends keyof TalentProfile>(k: K, v: TalentProfile[K]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File | null) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Seuls les PDF sont acceptés.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Maximum 5 MB.");
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      update("cv", {
        filename: file.name,
        dataUrl,
        sizeKb: Math.round(file.size / 1024),
      });
      setError(null);
    } catch {
      setError("Erreur de lecture du fichier.");
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <SectionCard
      icon={<FileText className="h-4 w-4" strokeWidth={2.4} />}
      title="CV (PDF)"
      accent="#1CB0F6"
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={(e) => handleUpload(e.target.files?.[0] ?? null)}
        className="hidden"
      />
      {profile.cv ? (
        <div className="flex items-center gap-3 rounded-xl bg-white ring-1 ring-inset ring-ink-700/10 p-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-cyan-100 text-cyan-700 shrink-0">
            <FileText className="h-6 w-6" strokeWidth={2.2} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-display text-[14px] font-black text-mist-50 truncate">
              {profile.cv.filename}
            </p>
            <p className="text-[11px] text-mist-400">{profile.cv.sizeKb} KB · PDF</p>
          </div>
          <a
            href={profile.cv.dataUrl}
            download={profile.cv.filename}
            className="inline-flex h-9 items-center gap-1 rounded-full bg-cyan-100 hover:bg-cyan-200 text-cyan-800 px-3 text-[11px] font-bold uppercase tracking-[0.06em] transition"
          >
            Voir
          </a>
          <button
            type="button"
            onClick={() => update("cv", null)}
            className="grid h-9 w-9 place-items-center rounded-full text-rose-600 hover:bg-rose-100 transition"
            aria-label="Supprimer CV"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={2.4} />
          </button>
        </div>
      ) : (
        <EmptyDropZone
          onClick={() => inputRef.current?.click()}
          uploading={false}
          icon={<Upload className="h-8 w-8" strokeWidth={1.8} />}
          title="Importe ton CV PDF"
          hint="Maximum 5 MB"
          accent="#1CB0F6"
        />
      )}
      {error && <p className="mt-2 text-[11.5px] text-rose-700 font-medium">{error}</p>}
    </SectionCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5 — BIO
// ═══════════════════════════════════════════════════════════════════════════

function BioSection({
  profile,
  update,
}: {
  profile: TalentProfile;
  update: <K extends keyof TalentProfile>(k: K, v: TalentProfile[K]) => void;
}) {
  const left = BIO_MAX - profile.bio.length;
  return (
    <SectionCard
      icon={<FileText className="h-4 w-4" strokeWidth={2.4} />}
      title="Bio courte"
      accent="#F59E0B"
      hint={`${left} / ${BIO_MAX}`}
    >
      <textarea
        value={profile.bio}
        onChange={(e) => update("bio", e.currentTarget.value.slice(0, BIO_MAX))}
        rows={3}
        placeholder="Ce qui te rend différent en 2 lignes — ton style, tes obsessions, ce que tu cherches."
        className="w-full rounded-xl bg-white ring-1 ring-inset ring-ink-700/15 focus:ring-2 focus:ring-night-700/50 p-3 text-[13.5px] text-mist-50 placeholder:text-mist-400 outline-none transition resize-none leading-relaxed"
      />
    </SectionCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION — DISPONIBILITÉ (sidebar)
// ═══════════════════════════════════════════════════════════════════════════

function AvailabilitySection({
  profile,
  update,
}: {
  profile: TalentProfile;
  update: <K extends keyof TalentProfile>(k: K, v: TalentProfile[K]) => void;
}) {
  return (
    <SectionCard
      icon={<Clock className="h-4 w-4" strokeWidth={2.4} />}
      title="Disponibilité"
      accent="#10B981"
    >
      <div className="grid grid-cols-2 gap-1.5">
        {(["now", "30d", "90d", "not_available"] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => update("availability", opt)}
            className={cn(
              "inline-flex items-center justify-center rounded-full px-2.5 py-2 text-[11px] font-bold transition",
              profile.availability === opt
                ? "text-white"
                : "bg-white text-mist-100 ring-1 ring-inset ring-ink-700/10 hover:bg-ink-850",
            )}
            style={
              profile.availability === opt
                ? {
                    background: opt === "not_available" ? "#94A3B8" : "#10B981",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)",
                  }
                : undefined
            }
          >
            {AVAIL_LABELS[opt]}
          </button>
        ))}
      </div>
    </SectionCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION — COMPÉTENCES
// ═══════════════════════════════════════════════════════════════════════════

function SkillsSection({
  profile,
  update,
}: {
  profile: TalentProfile;
  update: <K extends keyof TalentProfile>(k: K, v: TalentProfile[K]) => void;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const v = input.trim();
    if (!v || profile.skills.includes(v)) return;
    update("skills", [...profile.skills, v]);
    setInput("");
  };

  return (
    <SectionCard
      icon={<Award className="h-4 w-4" strokeWidth={2.4} />}
      title="Compétences"
      accent="#22D3EE"
      hint={`${profile.skills.length}`}
    >
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="React, Maya, Photoshop…"
          className="flex-1 h-9 rounded-xl bg-white ring-1 ring-inset ring-ink-700/15 focus:ring-2 focus:ring-night-700/50 px-3 text-[12.5px] text-mist-50 placeholder:text-mist-400 outline-none transition"
        />
        <button
          type="button"
          onClick={add}
          className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-500 text-white"
          aria-label="Ajouter compétence"
        >
          <Plus className="h-4 w-4" strokeWidth={2.6} />
        </button>
      </div>
      {profile.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {profile.skills.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 rounded-full bg-cyan-100 ring-1 ring-inset ring-cyan-300/40 pl-2.5 pr-1.5 py-0.5 text-[11.5px] font-bold text-cyan-800"
            >
              {s}
              <button
                type="button"
                onClick={() =>
                  update(
                    "skills",
                    profile.skills.filter((x) => x !== s),
                  )
                }
                className="grid h-4 w-4 place-items-center rounded-full hover:bg-cyan-200 transition"
                aria-label={`Retirer ${s}`}
              >
                <X className="h-2.5 w-2.5" strokeWidth={3} />
              </button>
            </span>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION — EXPÉRIENCES
// ═══════════════════════════════════════════════════════════════════════════

function ExperiencesSection({
  profile,
  update,
}: {
  profile: TalentProfile;
  update: <K extends keyof TalentProfile>(k: K, v: TalentProfile[K]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ title: "", company: "", period: "", description: "" });

  const save = () => {
    if (!draft.title.trim() || !draft.company.trim()) return;
    update("experiences", [
      ...profile.experiences,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ...draft,
        description: draft.description.trim() || undefined,
      },
    ]);
    setDraft({ title: "", company: "", period: "", description: "" });
    setAdding(false);
  };

  return (
    <SectionCard
      icon={<Briefcase className="h-4 w-4" strokeWidth={2.4} />}
      title="Expériences"
      accent="#FBBF24"
      hint={`${profile.experiences.length}`}
    >
      {profile.experiences.length > 0 && (
        <ul className="space-y-2 mb-3">
          {profile.experiences.map((exp) => (
            <li
              key={exp.id}
              className="group rounded-xl bg-white ring-1 ring-inset ring-ink-700/10 p-3 relative"
            >
              <button
                type="button"
                onClick={() =>
                  update(
                    "experiences",
                    profile.experiences.filter((x) => x.id !== exp.id),
                  )
                }
                className="absolute top-1.5 right-1.5 grid h-6 w-6 place-items-center rounded-full text-mist-400 hover:bg-rose-100 hover:text-rose-700 opacity-0 group-hover:opacity-100 transition"
                aria-label="Supprimer"
              >
                <X className="h-3 w-3" strokeWidth={2.6} />
              </button>
              <p className="font-display text-[13px] font-black text-mist-50 leading-tight pr-6">
                {exp.title}
              </p>
              <p className="text-[11.5px] text-mist-300">
                {exp.company} · <span className="text-mist-400">{exp.period}</span>
              </p>
              {exp.description && (
                <p className="mt-1 text-[11.5px] text-mist-200 leading-relaxed">{exp.description}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      <AnimatePresence initial={false}>
        {adding ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 rounded-xl bg-amber-50 ring-1 ring-inset ring-amber-300/40 p-3">
              <input
                type="text"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.currentTarget.value })}
                placeholder="Titre · ex Animateur 3D"
                className="w-full h-9 rounded-lg bg-white ring-1 ring-inset ring-ink-700/15 px-3 text-[12.5px] outline-none"
              />
              <input
                type="text"
                value={draft.company}
                onChange={(e) => setDraft({ ...draft, company: e.currentTarget.value })}
                placeholder="Entreprise · ex Ubisoft"
                className="w-full h-9 rounded-lg bg-white ring-1 ring-inset ring-ink-700/15 px-3 text-[12.5px] outline-none"
              />
              <input
                type="text"
                value={draft.period}
                onChange={(e) => setDraft({ ...draft, period: e.currentTarget.value })}
                placeholder="Période · ex 2020 – 2024"
                className="w-full h-9 rounded-lg bg-white ring-1 ring-inset ring-ink-700/15 px-3 text-[12.5px] outline-none"
              />
              <textarea
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.currentTarget.value })}
                rows={2}
                placeholder="Description (optionnel)"
                className="w-full rounded-lg bg-white ring-1 ring-inset ring-ink-700/15 p-2 text-[12px] resize-none outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={save}
                  disabled={!draft.title.trim() || !draft.company.trim()}
                  className="flex-1 inline-flex h-8 items-center justify-center gap-1 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold uppercase tracking-[0.06em] transition disabled:opacity-50"
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="inline-flex h-8 items-center gap-1 rounded-full bg-white ring-1 ring-inset ring-ink-700/10 text-mist-100 px-3 text-[11px] font-bold uppercase tracking-[0.06em]"
                >
                  Annuler
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="w-full inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-amber-400/40 hover:border-amber-500 text-amber-700 text-[11.5px] font-bold transition"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.6} />
            Ajouter une expérience
          </button>
        )}
      </AnimatePresence>
    </SectionCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION — CERTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════

function CertificationsSection({
  profile,
  update,
}: {
  profile: TalentProfile;
  update: <K extends keyof TalentProfile>(k: K, v: TalentProfile[K]) => void;
}) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim();
    if (!v || profile.certifications.includes(v)) return;
    update("certifications", [...profile.certifications, v]);
    setInput("");
  };
  return (
    <SectionCard
      icon={<Award className="h-4 w-4" strokeWidth={2.4} />}
      title="Certifications"
      accent="#7C3AED"
      hint={`${profile.certifications.length}`}
    >
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="MOPA, Ynov, MOF…"
          className="flex-1 h-9 rounded-xl bg-white ring-1 ring-inset ring-ink-700/15 focus:ring-2 focus:ring-night-700/50 px-3 text-[12.5px] outline-none"
        />
        <button
          type="button"
          onClick={add}
          className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500 text-white"
          aria-label="Ajouter certification"
        >
          <Plus className="h-4 w-4" strokeWidth={2.6} />
        </button>
      </div>
      {profile.certifications.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {profile.certifications.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1 rounded-full bg-violet-100 ring-1 ring-inset ring-violet-300/40 pl-2.5 pr-1.5 py-0.5 text-[11.5px] font-bold text-violet-800"
            >
              {c}
              <button
                type="button"
                onClick={() =>
                  update(
                    "certifications",
                    profile.certifications.filter((x) => x !== c),
                  )
                }
                className="grid h-4 w-4 place-items-center rounded-full hover:bg-violet-200 transition"
                aria-label={`Retirer ${c}`}
              >
                <X className="h-2.5 w-2.5" strokeWidth={3} />
              </button>
            </span>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION — LIENS EXTERNES
// ═══════════════════════════════════════════════════════════════════════════

function LinksSection({
  profile,
  update,
}: {
  profile: TalentProfile;
  update: <K extends keyof TalentProfile>(k: K, v: TalentProfile[K]) => void;
}) {
  const setLink = (k: keyof TalentProfile["links"], v: string) =>
    update("links", { ...profile.links, [k]: v.trim() || undefined });
  return (
    <SectionCard
      icon={<Globe className="h-4 w-4" strokeWidth={2.4} />}
      title="Liens externes"
      accent="#10F0A0"
    >
      <div className="space-y-2">
        <LinkInput
          icon={<Github className="h-3.5 w-3.5" strokeWidth={2.4} />}
          placeholder="github.com/toi"
          value={profile.links.github ?? ""}
          onChange={(v) => setLink("github", v)}
        />
        <LinkInput
          icon={<Linkedin className="h-3.5 w-3.5" strokeWidth={2.4} />}
          placeholder="linkedin.com/in/toi"
          value={profile.links.linkedin ?? ""}
          onChange={(v) => setLink("linkedin", v)}
        />
        <LinkInput
          icon={<Globe className="h-3.5 w-3.5" strokeWidth={2.4} />}
          placeholder="ton-portfolio.com"
          value={profile.links.portfolio ?? ""}
          onChange={(v) => setLink("portfolio", v)}
        />
        <LinkInput
          icon={<Globe className="h-3.5 w-3.5" strokeWidth={2.4} />}
          placeholder="behance.net/toi"
          value={profile.links.behance ?? ""}
          onChange={(v) => setLink("behance", v)}
        />
      </div>
    </SectionCard>
  );
}

function LinkInput({
  icon,
  placeholder,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-white ring-1 ring-inset ring-ink-700/10 px-3 h-9 focus-within:ring-2 focus-within:ring-night-700/50">
      <span className="text-mist-400 shrink-0">{icon}</span>
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-[12px] text-mist-50 placeholder:text-mist-400 outline-none"
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SHARED — SectionCard, EmptyDropZone, TextField, SelectField
// ═══════════════════════════════════════════════════════════════════════════

function SectionCard({
  icon,
  title,
  accent,
  hint,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  accent: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <article className="card-white p-5">
      <div className="flex items-center gap-2 mb-3">
        <span
          className="grid h-7 w-7 place-items-center rounded-lg shrink-0"
          style={{ background: `${accent}1A`, color: accent }}
        >
          {icon}
        </span>
        <h2 className="font-display text-[14px] font-black text-mist-50">{title}</h2>
        {hint && (
          <span className="ml-auto text-[10px] font-bold uppercase tracking-[0.12em] text-mist-400">
            {hint}
          </span>
        )}
      </div>
      {children}
    </article>
  );
}

function EmptyDropZone({
  onClick,
  uploading,
  icon,
  title,
  hint,
  accent,
}: {
  onClick: () => void;
  uploading: boolean;
  icon: React.ReactNode;
  title: string;
  hint: string;
  accent: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={uploading}
      className="w-full rounded-xl border-2 border-dashed transition flex flex-col items-center justify-center gap-2 py-10 text-mist-400 hover:text-mist-100"
      style={{ borderColor: `${accent}40` }}
      onMouseEnter={(e) => (e.currentTarget.style.background = `${accent}10`)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {icon}
      <p className="font-display text-[14px] font-black text-mist-50">
        {uploading ? "Upload…" : title}
      </p>
      <p className="text-[11.5px]">{hint}</p>
    </button>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  icon,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-[0.14em] text-mist-400">
        {icon}
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        placeholder={placeholder}
        className="w-full h-10 rounded-xl bg-white ring-1 ring-inset ring-ink-700/15 focus:ring-2 focus:ring-night-700/50 px-3 text-[13px] text-mist-50 placeholder:text-mist-400 outline-none transition"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-[0.14em] text-mist-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        className="w-full h-10 rounded-xl bg-white ring-1 ring-inset ring-ink-700/15 focus:ring-2 focus:ring-night-700/50 px-3 text-[13px] text-mist-50 outline-none transition appearance-none"
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' stroke='%236E5A3E' stroke-width='1.5' fill='none' stroke-linecap='round'/></svg>")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 12px center",
          paddingRight: "32px",
        }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

// Helper for unused image import
void Image;
