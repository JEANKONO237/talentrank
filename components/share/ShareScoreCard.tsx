"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy, Link2, Linkedin, Share2, Twitter, X } from "lucide-react";
import { tierForPercentile } from "@/lib/tiers";
import { track } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// ShareScoreCard — bouton "Partager mon classement" + modal de partage.
//
// Le mécanisme viral du produit : un talent qui flexe son score sur LinkedIn
// crée une preview OG brandée TalentRank. C'est de l'acquisition organique.
//
// Conditions :
//   - Visible uniquement audience talent (un studio ne partage pas un score)
//   - Score > 0 (sinon rien à flexer)
//
// Tech :
//   - Génère l'URL /api/og/score?name=X&score=Y&tier=Z&...
//   - Construit une URL publique cible (profile ou ranking)
//   - 3 canaux : Twitter web intent, LinkedIn sharing, copy-to-clipboard
//   - Modal en portal-like overlay avec fade + scale, escape pour fermer
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  name: string;
  /** Score 0-100. */
  score: number;
  /** Percentile (0-100, plus bas = meilleur). */
  percentile: number;
  /** ID profession (ex: "char-animator"). Sert à construire les URLs. */
  professionId: string;
  /** Label profession (ex: "Character Animator") pour l'OG image. */
  professionLabel: string;
  /** Ville optionnelle. */
  city?: string | null;
  /** Slug pour pointer vers /talent/[slug]. Si absent, on pointe vers /ranking. */
  slug?: string | null;
  /** Variante visuelle du bouton. */
  variant?: "primary" | "ghost" | "compact";
  className?: string;
}

export function ShareScoreCard({
  name,
  score,
  percentile,
  professionId,
  professionLabel,
  city,
  slug,
  variant = "primary",
  className,
}: Props) {
  const [open, setOpen] = useState(false);

  if (score <= 0) return null;

  return (
    <>
      <ShareButton variant={variant} onClick={() => setOpen(true)} className={className} />
      <AnimatePresence>
        {open && (
          <ShareScoreModal
            onClose={() => setOpen(false)}
            name={name}
            score={score}
            percentile={percentile}
            professionId={professionId}
            professionLabel={professionLabel}
            city={city ?? undefined}
            slug={slug ?? undefined}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Trigger button ────────────────────────────────────────────────────────

function ShareButton({
  variant,
  onClick,
  className,
}: {
  variant: "primary" | "ghost" | "compact";
  onClick: () => void;
  className?: string;
}) {
  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="Partager mon classement"
        title="Partager mon classement"
        className={cn(
          "inline-grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white ring-1 ring-inset ring-white/30 hover:bg-white/25 transition",
          className,
        )}
      >
        <Share2 className="h-4 w-4" strokeWidth={2.6} />
      </button>
    );
  }
  if (variant === "ghost") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-full bg-white/15 text-white ring-1 ring-inset ring-white/30 px-3.5 text-[11.5px] font-bold uppercase tracking-[0.06em] hover:bg-white/25 transition",
          className,
        )}
      >
        <Share2 className="h-3.5 w-3.5" strokeWidth={2.8} />
        Partager
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center gap-1.5 rounded-full bg-mist-50 text-white px-5 text-[12.5px] font-bold uppercase tracking-[0.04em] hover:bg-mist-100 transition shadow-card",
        className,
      )}
    >
      <Share2 className="h-3.5 w-3.5" strokeWidth={2.8} />
      Partager mon classement
    </button>
  );
}

// ─── Modal (exporté pour usage avec triggers custom) ───────────────────────

export function ShareScoreModal({
  onClose,
  name,
  score,
  percentile,
  professionId,
  professionLabel,
  city,
  slug,
}: {
  onClose: () => void;
  name: string;
  score: number;
  percentile: number;
  professionId: string;
  professionLabel: string;
  city?: string;
  slug?: string;
}) {
  const tier = tierForPercentile(percentile);
  const [copied, setCopied] = useState(false);

  // Build URLs. En SSR on n'a pas window — on lit l'origin côté client
  // dans un useState, et on tolère qu'il soit vide au premier render.
  const [origin, setOrigin] = useState<string>("");
  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  // Image OG : transmise telle quelle à <img>. Pas besoin d'origin.
  const ogParams = new URLSearchParams({
    name,
    score: String(score),
    tier: tier.id,
    profession: professionLabel,
  });
  if (city) ogParams.set("city", city);
  const ogUrl = `/api/og/score?${ogParams.toString()}`;

  // URL publique partagée : profile si slug, sinon classement métier.
  const publicPath = slug ? `/talent/${slug}` : `/ranking/${professionId}`;
  const fullPublicUrl = origin ? `${origin}${publicPath}` : publicPath;

  // Texte de partage — punchy, fier, sans cringe.
  const shareText = `Je suis ${tier.label} en ${professionLabel} sur TalentRank. Score officiel : ${score}/100${city ? ` · ${city}` : ""}.`;

  // Twitter web intent
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullPublicUrl)}`;

  // LinkedIn sharing (article URL only — LinkedIn ne respecte plus le `summary`)
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullPublicUrl)}`;

  // Esc pour fermer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleCopy = async () => {
    if (!fullPublicUrl) return;
    try {
      await navigator.clipboard.writeText(fullPublicUrl);
      setCopied(true);
      // NSM event — viralité activée via copy lien
      track("score_shared", {
        channel: "copy_link",
        score,
        profession_id: professionId,
      });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback : sélection manuelle via input visible
    }
  };

  // Handlers click pour tracker les social shares avant la nav externe
  const handleTwitterShare = () => {
    track("score_shared", { channel: "twitter", score, profession_id: professionId });
  };
  const handleLinkedInShare = () => {
    track("score_shared", { channel: "linkedin", score, profession_id: professionId });
  };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(15, 17, 24, 0.78)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[560px] rounded-3xl bg-white shadow-[0_30px_60px_-12px_rgba(0,0,0,0.45)] overflow-hidden"
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-3 right-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-mist-100 ring-1 ring-ink-700/10 hover:bg-white transition"
        >
          <X className="h-4 w-4" strokeWidth={2.6} />
        </button>

        {/* Header — accent tier */}
        <div
          className="px-6 pt-6 pb-3"
          style={{
            background: `linear-gradient(180deg, ${tier.color}15, transparent)`,
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: tier.color }}>
            Flex ton score
          </p>
          <h2
            id="share-modal-title"
            className="mt-1 font-display text-[22px] font-black tracking-tight text-mist-50 leading-tight"
          >
            Montre ton {tier.label} au monde.
          </h2>
          <p className="mt-1.5 text-[12.5px] text-mist-300 leading-snug">
            Aperçu généré automatiquement avec ta carte TalentRank.
          </p>
        </div>

        {/* OG preview */}
        <div className="px-6">
          <div
            className="relative aspect-[1200/630] w-full overflow-hidden rounded-2xl ring-1 ring-ink-700/10"
            style={{
              background: `linear-gradient(135deg, #FFF8E1, #FFE8B0)`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ogUrl}
              alt="Preview du partage TalentRank"
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        </div>

        {/* Share targets */}
        <div className="px-6 pt-5 pb-6 space-y-3">
          {/* Row 1 : social */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleTwitterShare}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-mist-50 text-white text-[12.5px] font-bold hover:bg-mist-100 transition"
            >
              <Twitter className="h-4 w-4" strokeWidth={2.4} />
              Partager sur X
            </a>
            <a
              href={linkedInUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleLinkedInShare}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl text-white text-[12.5px] font-bold transition"
              style={{
                background: "#0A66C2",
                boxShadow: "0 4px 0 0 #084c91, inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
            >
              <Linkedin className="h-4 w-4" strokeWidth={2.4} />
              Partager sur LinkedIn
            </a>
          </div>

          {/* Row 2 : copier lien */}
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              "w-full inline-flex h-11 items-center justify-between gap-2 rounded-2xl px-4 text-[12px] font-bold transition",
              copied
                ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-300"
                : "bg-ink-50 text-mist-50 ring-1 ring-inset ring-ink-700/10 hover:bg-ink-100",
            )}
          >
            <span className="inline-flex items-center gap-2 min-w-0">
              <Link2 className="h-4 w-4 shrink-0" strokeWidth={2.4} />
              <span className="truncate font-normal text-mist-300">
                {fullPublicUrl || "Lien en préparation…"}
              </span>
            </span>
            <span className="inline-flex items-center gap-1 shrink-0">
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  Copié
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" strokeWidth={2.6} />
                  Copier
                </>
              )}
            </span>
          </button>

          {/* Microcopy honnêteté — pas de fake numbers, juste un rappel */}
          <p className="text-[11px] text-mist-400 leading-snug text-center pt-1">
            Ton score est verrouillé 1 mois — anti-cheat. Recule pas, on s&apos;en
            souviendra.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
