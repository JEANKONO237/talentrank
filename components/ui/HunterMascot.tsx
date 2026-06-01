"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// HunterMascot v2 — Sheriff sympathique (cowboy friendly).
//
// Refonte audit Yuki (mascot-designer) + Nadia (art-director) :
//   Le HunterMascot v1 dark/silhouette cassait la famille mascots joyeuses.
//   v2 : visage rond chaleureux, sourire visible, joues blush, chapeau cowboy
//   marron clair. Garde l'étoile shérif (signature chasseur de têtes) mais
//   l'incarne en personnage attachant — pas un traqueur menaçant.
//
// À utiliser :
//   - PeekingMascot côté /talent (le sheriff te repère pour t'aider, pas pour
//     t'arrêter)
//   - Headers /chasse côté studio
//
// Style cohérent LeagueMascot : viewBox 100×100, radial gradients faces,
// double specular eyes, drop shadow filter via useId.
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  size?: number;
  className?: string;
  /** Étoile shérif visible. Default true. */
  withStar?: boolean;
}

export function HunterMascot({ size = 80, className, withStar = true }: Props) {
  const id = useId();
  const filterId = `${id}-drop`;
  const faceId = `${id}-face`;
  const hatId = `${id}-hat`;
  const hatBandId = `${id}-band`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="Sheriff TalentRank"
      className={cn("block", className)}
    >
      <defs>
        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.4" />
          <feOffset dx="0" dy="1.5" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.32" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Visage : peau ambrée chaleureuse (style mascots) */}
        <radialGradient id={faceId} cx="35%" cy="28%" r="85%">
          <stop offset="0%" stopColor="#FFD7A8" />
          <stop offset="55%" stopColor="#E8A55A" />
          <stop offset="100%" stopColor="#A8702F" />
        </radialGradient>
        {/* Chapeau cuir clair (vs dark v1) */}
        <radialGradient id={hatId} cx="50%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#A06B3D" />
          <stop offset="100%" stopColor="#5C3A1F" />
        </radialGradient>
        <linearGradient id={hatBandId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3D2918" />
          <stop offset="100%" stopColor="#2A1B0E" />
        </linearGradient>
      </defs>

      <g filter={`url(#${filterId})`}>
        {/* Face — visage rond chaleureux */}
        <path
          d="M 50 36 Q 76 38 76 62 Q 76 82 50 86 Q 24 82 24 62 Q 24 38 50 36 Z"
          fill={`url(#${faceId})`}
        />
        {/* Form shadow droite */}
        <path
          d="M 50 36 Q 76 38 76 62 Q 76 82 50 86 Q 50 60 50 36 Z"
          fill="#A8702F"
          opacity="0.18"
        />

        {/* Joues blush — la signature mascot warm */}
        <ellipse cx="32" cy="62" rx="5" ry="3.5" fill="#FF9F6B" opacity="0.55" />
        <ellipse cx="68" cy="62" rx="5" ry="3.5" fill="#FF9F6B" opacity="0.55" />

        {/* Eyes — gros yeux noirs ronds + double specular (style mascot) */}
        <circle cx="40" cy="56" r="5" fill="#1B1208" />
        <circle cx="60" cy="56" r="5" fill="#1B1208" />
        {/* Main highlight TL */}
        <circle cx="38.5" cy="54.5" r="1.6" fill="#FFFFFF" />
        <circle cx="58.5" cy="54.5" r="1.6" fill="#FFFFFF" />
        {/* Spec BR */}
        <circle cx="41.5" cy="57.5" r="0.7" fill="#FFFFFF" opacity="0.7" />
        <circle cx="61.5" cy="57.5" r="0.7" fill="#FFFFFF" opacity="0.7" />

        {/* Nez — petit point sympa */}
        <ellipse cx="50" cy="68" rx="3" ry="2.4" fill="#1B1208" />
        <ellipse cx="49" cy="67" rx="1" ry="0.6" fill="#FFFFFF" opacity="0.5" />

        {/* Sourire CHALEUREUX (pas bandana qui cache) */}
        <path
          d="M 42 76 Q 50 82 58 76"
          stroke="#1B1208"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />

        {/* Chapeau cowboy — sur la tête, marron clair friendly */}
        {/* Crown du chapeau */}
        <path
          d="M 50 16 Q 34 18 30 34 Q 50 30 70 34 Q 66 18 50 16 Z"
          fill={`url(#${hatId})`}
        />
        {/* Bord large arqué */}
        <path
          d="M 12 36 Q 50 28 88 36 Q 88 42 50 44 Q 12 42 12 36 Z"
          fill={`url(#${hatId})`}
        />
        {/* Ruban (band) du chapeau */}
        <path
          d="M 30 32 Q 50 28 70 32 L 70 36 Q 50 32 30 36 Z"
          fill={`url(#${hatBandId})`}
        />
        {/* Étoile de shérif sur le ruban */}
        {withStar && (
          <path
            d="M 50 30 L 51.5 33.5 L 55 33.7 L 52.2 35.8 L 53.2 39.2 L 50 37.3 L 46.8 39.2 L 47.8 35.8 L 45 33.7 L 48.5 33.5 Z"
            fill="#FFC800"
            stroke="#8B6500"
            strokeWidth="0.6"
            strokeLinejoin="round"
          />
        )}

        {/* Petit highlight sur le bord du chapeau pour la rondeur */}
        <ellipse cx="50" cy="20" rx="14" ry="2" fill="rgba(255,255,255,0.25)" />
      </g>
    </svg>
  );
}
