"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// StudioMascot — l'Aigle Sheriff. Mascotte officielle de l'univers Entreprise.
//
// Audit Yuki (mascot-designer) G1-Yuki-3 : le studio n'avait aucune mascotte.
// Univers froid vs talent qui a 6 mascots (Lion, Dragon, Aigle, etc.). On
// crée donc un Aigle stylisé spécifique au studio :
//   - perception aiguë (chasseur de talents qui scanne le marché)
//   - autorité (chapeau de shérif optionnel)
//   - vol panoramique (vue d'ensemble sur le classement)
//
// Style : viewBox 100×100, radial gradients, eyes double-specular —
// cohérent avec LeagueMascot family. Palette nuit (bleu nuit dominant) avec
// accent cyan pour les yeux (autorité signal).
//
// À utiliser :
//   - PeekingMascot côté /studio landing (en remplacement du HunterMascot
//     qui devient exclusif au /talent)
//   - Headers dashboard studio
//   - Avatar default studio (s'il n'y a pas de logo entreprise)
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  size?: number;
  className?: string;
  /** Badge étoile shérif sur la poitrine. Default true. */
  withBadge?: boolean;
}

export function StudioMascot({ size = 80, className, withBadge = true }: Props) {
  const id = useId();
  const filterId = `${id}-drop`;
  const bodyId = `${id}-body`;
  const beakId = `${id}-beak`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="Aigle Sheriff TalentRank Studio"
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
        {/* Corps : bleu nuit dégradé (palette brand studio) */}
        <radialGradient id={bodyId} cx="35%" cy="28%" r="85%">
          <stop offset="0%" stopColor="#6F7B8A" />
          <stop offset="55%" stopColor="#2C3E55" />
          <stop offset="100%" stopColor="#0A1018" />
        </radialGradient>
        <linearGradient id={beakId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFC107" />
          <stop offset="100%" stopColor="#B86F00" />
        </linearGradient>
      </defs>

      <g filter={`url(#${filterId})`}>
        {/* Crest feather — petites plumes en V au sommet de la tête */}
        <path
          d="M 50 12 L 42 28 L 50 22 L 58 28 Z"
          fill="#1A2535"
        />
        <path
          d="M 50 12 L 50 22"
          stroke="#4D5A6B"
          strokeWidth="0.8"
          strokeLinecap="round"
        />

        {/* Face / tête — forme aigle stylisée (plus angulaire que les autres mascots) */}
        <path
          d="M 50 24 Q 78 28 76 60 Q 70 80 50 86 Q 30 80 24 60 Q 22 28 50 24 Z"
          fill={`url(#${bodyId})`}
        />

        {/* Form shadow droite (volume) */}
        <path
          d="M 50 24 Q 78 28 76 60 Q 70 80 50 86 Q 50 55 50 24 Z"
          fill="#0A1018"
          opacity="0.25"
        />

        {/* Masque blanc autour des yeux (signature aigle) */}
        <path
          d="M 50 38 Q 70 42 68 60 Q 62 74 50 74 Q 38 74 32 60 Q 30 42 50 38 Z"
          fill="#E2E8F0"
        />
        <path
          d="M 50 38 Q 70 42 68 60 Q 65 60 60 55 Q 55 50 50 38 Z"
          fill="#CBD5E1"
          opacity="0.6"
        />

        {/* Brows fierce (le regard du chasseur de têtes) */}
        <path
          d="M 28 44 L 42 48"
          stroke="#0A1018"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M 72 44 L 58 48"
          stroke="#0A1018"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Yeux — iris jaune doré + pupille noire + double specular */}
        <circle cx="40" cy="52" r="5.5" fill="#FFC800" />
        <circle cx="60" cy="52" r="5.5" fill="#FFC800" />
        {/* Inner glow doré */}
        <circle cx="38.5" cy="50.5" r="2" fill="#FFE082" opacity="0.8" />
        <circle cx="58.5" cy="50.5" r="2" fill="#FFE082" opacity="0.8" />
        {/* Pupille */}
        <circle cx="40" cy="52" r="2.8" fill="#1B1208" />
        <circle cx="60" cy="52" r="2.8" fill="#1B1208" />
        {/* Main specular */}
        <circle cx="39" cy="51" r="0.9" fill="#FFFFFF" />
        <circle cx="59" cy="51" r="0.9" fill="#FFFFFF" />

        {/* Bec courbe (signature aigle/faucon, façon chasseur précis) */}
        <path
          d="M 50 60 L 44 72 L 50 80 L 56 72 Z"
          fill={`url(#${beakId})`}
        />
        <path
          d="M 50 70 L 47 76 L 50 78 L 53 76 Z"
          fill="#8C5800"
        />
        {/* Highlight bec */}
        <path
          d="M 50 60 L 47 68"
          stroke="#FFE082"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Badge étoile shérif sous le bec (signature studio = autorité chasseur) */}
        {withBadge && (
          <g transform="translate(50 86)">
            <path
              d="M 0 -4 L 1.2 -1.2 L 4 -1 L 1.8 0.8 L 2.4 3.6 L 0 2 L -2.4 3.6 L -1.8 0.8 L -4 -1 L -1.2 -1.2 Z"
              fill="#FFC800"
              stroke="#8B6500"
              strokeWidth="0.5"
              strokeLinejoin="round"
            />
          </g>
        )}
      </g>
    </svg>
  );
}
