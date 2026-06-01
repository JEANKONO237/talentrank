"use client";

import { useAudience } from "@/lib/audience/client";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// CrosshairOverlay — viseur de bounty hunter au hover des cards talent.
//
// Concept : tu es chasseur. Quand tu survoles un profil, ton viseur s'aligne
// sur la cible. 4 brackets en L aux coins + dot central + microtexte "TARGET".
//
// Conditions d'affichage :
//   - audience === "studio" (un talent ne se "vise" pas lui-même)
//   - parent doit avoir className "group" (ou "group/card" si custom)
//   - parent doit être position:relative
//
// Animation : appear via opacity + scale au group-hover, avec stagger des
// 4 brackets pour effet "acquisition de cible".
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  /** Couleur d'accent du viseur. Default ambre prestige. */
  accent?: string;
  /** Préfixe du group à observer (par default "group" / "group-hover"). */
  groupName?: string;
  /** Si false, le viseur reste visible même hors hover (debug). */
  hoverOnly?: boolean;
  /** "full" = brackets + cross-hair + ring + label (gros cards).
   *  "minimal" = juste les 4 brackets aux coins (rows fines / listes). */
  variant?: "full" | "minimal";
  /** Bypass la règle "studio only". Utile pour les grilles métiers du ranking
   *  où le viseur sert d'indicateur visuel d'interactivité, pas de chasse. */
  bypassAudienceGate?: boolean;
  className?: string;
}

export function CrosshairOverlay({
  accent = "#F59E0B",
  hoverOnly = true,
  variant = "full",
  bypassAudienceGate = false,
  className,
}: Props) {
  const { audience } = useAudience();
  // Visible uniquement pour les studios — un talent ne se chasse pas lui-même.
  // Override via bypassAudienceGate quand on veut juste l'effet visuel.
  if (!bypassAudienceGate && audience !== "studio") return null;

  const baseOpacity = hoverOnly ? "opacity-0 group-hover:opacity-100" : "opacity-100";

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 transition-opacity duration-300",
        baseOpacity,
        className,
      )}
      style={{ zIndex: 3 }}
    >
      {/* 4 brackets en L aux coins — 16px square chacun, 2px stroke */}
      <CornerBracket position="tl" accent={accent} delay={0} />
      <CornerBracket position="tr" accent={accent} delay={0.06} />
      <CornerBracket position="bl" accent={accent} delay={0.12} />
      <CornerBracket position="br" accent={accent} delay={0.18} />

      {variant === "minimal" && null}

      {/* Cross-hair center : ligne H + V courte + dot central */}
      {variant === "full" && (
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {/* Ligne horizontale */}
        <span
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-px"
          style={{
            width: 28,
            background: accent,
            boxShadow: `0 0 6px ${accent}`,
          }}
        />
        {/* Ligne verticale */}
        <span
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-px"
          style={{
            height: 28,
            background: accent,
            boxShadow: `0 0 6px ${accent}`,
          }}
        />
        {/* Cercle anneau */}
        <span
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: 18,
            height: 18,
            border: `1.5px solid ${accent}`,
            boxShadow: `0 0 8px ${accent}88, inset 0 0 4px ${accent}44`,
          }}
        />
        {/* Dot central pulsant — audit Léo G2-Léo-1 : passe de framer-motion
            (JS scheduler) à CSS animation (GPU compositing). Sur 20 cards
            simultanément ça divise le JS overhead par ~20. */}
        <span
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-1 w-1 rounded-full crosshair-pulse"
          style={{
            background: accent,
            boxShadow: `0 0 8px ${accent}, 0 0 4px ${accent}`,
          }}
        />
      </div>
      )}

      {/* Label TARGET en bas du viseur (full only).
          Audit Anya G2-Anya-4 — double canal d'info pour daltonisme :
          1. Couleur ambre (canal #1)
          2. Fond NOIR opaque + texte BLANC (contraste maximum, indépendant
             de la perception couleur)
          3. Symbole ⌖ universel + texte explicite "Cible"
          → un daltonien deutéranope perçoit toujours le viseur. */}
      {variant === "full" && (
        <span
          className="absolute left-1/2 bottom-3 -translate-x-1/2 font-mono text-[8.5px] font-black uppercase tracking-[0.22em] px-2 py-1 rounded inline-flex items-center gap-1"
          style={{
            color: "#FFFFFF",
            background: "rgba(0,0,0,0.85)",
            boxShadow: `0 0 0 1.5px ${accent}, 0 2px 8px rgba(0,0,0,0.5)`,
          }}
        >
          <span aria-hidden style={{ color: accent }}>⌖</span>
          Cible
        </span>
      )}
    </div>
  );
}

// ─── Corner bracket (L-shape) ────────────────────────────────────────────

function CornerBracket({
  position,
  accent,
  delay,
}: {
  position: "tl" | "tr" | "bl" | "br";
  accent: string;
  delay: number;
}) {
  const SIZE = 18;
  const STROKE = 2;
  const offset = 8; // distance from the card edge
  const positionStyles: Record<typeof position, React.CSSProperties> = {
    tl: { top: offset, left: offset },
    tr: { top: offset, right: offset },
    bl: { bottom: offset, left: offset },
    br: { bottom: offset, right: offset },
  };

  // Définit les 2 segments d'angle selon le coin
  const segments: Record<typeof position, { h: React.CSSProperties; v: React.CSSProperties }> = {
    tl: {
      h: { top: 0, left: 0, width: SIZE, height: STROKE },
      v: { top: 0, left: 0, width: STROKE, height: SIZE },
    },
    tr: {
      h: { top: 0, right: 0, width: SIZE, height: STROKE },
      v: { top: 0, right: 0, width: STROKE, height: SIZE },
    },
    bl: {
      h: { bottom: 0, left: 0, width: SIZE, height: STROKE },
      v: { bottom: 0, left: 0, width: STROKE, height: SIZE },
    },
    br: {
      h: { bottom: 0, right: 0, width: SIZE, height: STROKE },
      v: { bottom: 0, right: 0, width: STROKE, height: SIZE },
    },
  };

  // CSS-only animation : transition opacity gérée par parent (group-hover).
  // Delay via CSS transition-delay variable. Plus de framer-motion par bracket.
  return (
    <span
      className="absolute"
      style={{
        ...positionStyles[position],
        width: SIZE,
        height: SIZE,
        transitionDelay: `${delay}s`,
      }}
    >
      <span
        className="absolute"
        style={{
          ...segments[position].h,
          background: accent,
          boxShadow: `0 0 6px ${accent}88`,
        }}
      />
      <span
        className="absolute"
        style={{
          ...segments[position].v,
          background: accent,
          boxShadow: `0 0 6px ${accent}88`,
        }}
      />
    </span>
  );
}
