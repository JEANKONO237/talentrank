"use client";

import { motion } from "framer-motion";
import { Pin, PinOff } from "lucide-react";
import { togglePin, usePinnedProfessions } from "@/lib/pinning/professions";
import { useAudience } from "@/lib/audience/client";
import { track } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// PinButton — bouton compact pour épingler un métier.
//
// Audience-agnostique (#119) :
//   - studio → épingle ses métiers cibles à chasser
//   - talent → épingle des métiers connexes à comparer avec le sien
//     (demande user : "les talents... peuvent ajouter un autre metier")
//
// État réactif via usePinnedProfessions().
// Animation : scale + rotation au toggle pour feedback satisfaisant.
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  professionId: string;
  /** Taille de l'icône (h-X w-X). Default 4 (16px). */
  size?: 4 | 5;
  /** "compact" = icon seul, "full" = icon + label "Épinglé". */
  variant?: "compact" | "full";
  /** Empêche la propagation du click (pour les cards cliquables). */
  stopPropagation?: boolean;
}

export function PinButton({
  professionId,
  size = 4,
  variant = "compact",
  stopPropagation = true,
}: Props) {
  const { isPinned } = usePinnedProfessions();
  const { audience } = useAudience();

  const pinned = isPinned(professionId);
  const Icon = pinned ? PinOff : Pin;
  const iconClass = size === 5 ? "h-5 w-5" : "h-4 w-4";

  const handleClick = (e: React.MouseEvent) => {
    if (stopPropagation) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Track uniquement quand on pin (pas le un-pin) — c'est l'intent fort.
    if (!pinned) {
      track("profession_pinned", {
        profession_id: professionId,
        audience: audience === "studio" ? "studio" : "talent",
      });
    }
    togglePin(professionId);
  };

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={pinned ? "Désépingler" : "Épingler"}
        aria-pressed={pinned}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.06em] transition",
          pinned
            ? "bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-400/40 hover:bg-amber-200"
            : "bg-white text-mist-100 ring-1 ring-inset ring-ink-700/10 hover:bg-ink-850",
        )}
      >
        <motion.span
          key={pinned ? "pinned" : "unpinned"}
          initial={{ scale: 0.6, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
          className="inline-flex"
        >
          <Icon className={iconClass} strokeWidth={2.4} />
        </motion.span>
        {pinned ? "Épinglé" : "Épingler"}
      </button>
    );
  }

  // Variant compact (default)
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={pinned ? "Désépingler ce métier" : "Épingler ce métier"}
      aria-pressed={pinned}
      title={pinned ? "Désépingler" : "Épingler ce métier"}
      className={cn(
        "grid place-items-center rounded-full transition shrink-0",
        size === 5 ? "h-9 w-9" : "h-8 w-8",
        pinned
          ? "bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-400/40 hover:bg-amber-200"
          : "bg-white text-mist-400 ring-1 ring-inset ring-ink-700/10 hover:text-mist-100 hover:bg-ink-850",
      )}
    >
      <motion.span
        key={pinned ? "pinned" : "unpinned"}
        initial={{ scale: 0.6, rotate: pinned ? -30 : 30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 18 }}
        className="inline-flex"
      >
        <Icon className={iconClass} strokeWidth={2.4} />
      </motion.span>
    </button>
  );
}
