"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import type { TierId } from "@/lib/tiers";

// ─────────────────────────────────────────────────────────────────────────────
// League mascots — hand-built SVG illustrations, dimensional pass.
// One per tier, drawn from geometric primitives (no external assets).
//
// V2 directive (art-director + mascot-designer):
//   Les PNG du sidebar (banner/*.png) sont 3D, riches, sculptés. Les mascottes
//   SVG étaient flat-2D Duolingo, créant un mismatch de famille. Cette passe
//   ajoute :
//     - radial gradients sur faces (light TL → dark BR pour le volume)
//     - inner shading & form shadow (creux sous le menton, plis)
//     - specular highlights doubles sur yeux (main + spark)
//     - blush warm sur joues
//     - drop shadow filter doux sur tout le mascot
//   Le silhouette reste lisible à 28px (TierEmblem xs).
//
// Style rules :
//   - viewBox 100×100, face-centered (no body)
//   - useId() pour gradient IDs uniques (≥2 instances OK sur la même page)
//   - Animal's natural colour ; le ring tier porte la couleur de ligue
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  tier: TierId;
  size?: number;
  className?: string;
}

export function LeagueMascot({ tier, size = 80, className }: Props) {
  const Mascot = MASCOTS[tier] ?? Fox;
  const filterId = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={LABEL[tier]}
      className={cn("block", className)}
    >
      <defs>
        {/* Drop shadow doux — partagé par toutes les mascottes. */}
        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.4" />
          <feOffset dx="0" dy="1.5" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.32" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter={`url(#${filterId})`}>
        <Mascot />
      </g>
    </svg>
  );
}

const LABEL: Record<TierId, string> = {
  elite: "Dragon",
  senior: "Lion",
  trending: "Aigle",
  rising: "Loup",
  emerging: "Renard",
  new: "Poussin",
};

const MASCOTS: Record<TierId, () => React.ReactElement> = {
  elite: Dragon,
  senior: Lion,
  trending: Eagle,
  rising: Wolf,
  emerging: Fox,
  new: Chick,
};

// ─── Shared eye component — double specular pour effet 3D ───────────────────
// L'astuce 3D : un highlight principal (top-left) + un spark plus petit en bas
// à droite. Ça donne l'illusion d'une sphère pleine, pas un sticker plat.
function Eye({ cx, cy, r, irisColor = "#1B1208" }: { cx: number; cy: number; r: number; irisColor?: string }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill={irisColor} />
      {/* Main highlight — TL */}
      <circle cx={cx - r * 0.3} cy={cy - r * 0.35} r={r * 0.32} fill="#FFFFFF" />
      {/* Spark — BR (vivacité) */}
      <circle cx={cx + r * 0.4} cy={cy + r * 0.35} r={r * 0.15} fill="#FFFFFF" opacity="0.7" />
    </>
  );
}

// ─── Fox (Bronze / emerging) ────────────────────────────────────────────────
function Fox() {
  const id = useId();
  const face = `${id}-face`;
  const muzzle = `${id}-muzzle`;
  return (
    <>
      <defs>
        <radialGradient id={face} cx="35%" cy="28%" r="85%">
          <stop offset="0%" stopColor="#FFB87A" />
          <stop offset="55%" stopColor="#D88A4A" />
          <stop offset="100%" stopColor="#9C4F18" />
        </radialGradient>
        <radialGradient id={muzzle} cx="50%" cy="35%" r="80%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#EAD8B5" />
        </radialGradient>
      </defs>
      {/* Ears */}
      <path d="M 20 30 L 30 50 L 12 48 Z" fill="#B5662C" />
      <path d="M 22 34 L 28 46 L 18 44 Z" fill="#3D1F0B" />
      <path d="M 80 30 L 70 50 L 88 48 Z" fill="#B5662C" />
      <path d="M 78 34 L 72 46 L 82 44 Z" fill="#3D1F0B" />
      {/* Face */}
      <path
        d="M 50 30 Q 84 34 78 70 Q 68 90 50 92 Q 32 90 22 70 Q 16 34 50 30 Z"
        fill={`url(#${face})`}
      />
      {/* Form shadow — côté droit-bas, ombre du volume */}
      <path
        d="M 50 30 Q 84 34 78 70 Q 68 90 50 92 Q 50 60 50 30 Z"
        fill="#1B1208"
        opacity="0.10"
      />
      {/* White muzzle */}
      <path
        d="M 50 56 Q 68 58 66 78 Q 58 90 50 90 Q 42 90 34 78 Q 32 58 50 56 Z"
        fill={`url(#${muzzle})`}
      />
      {/* Cheek blush */}
      <ellipse cx="28" cy="64" rx="4.5" ry="3" fill="#FF9E6B" opacity="0.55" />
      <ellipse cx="72" cy="64" rx="4.5" ry="3" fill="#FF9E6B" opacity="0.55" />
      {/* Eyes */}
      <Eye cx={38} cy={52} r={6} />
      <Eye cx={62} cy={52} r={6} />
      {/* Nose */}
      <ellipse cx="50" cy="68" rx="4" ry="3" fill="#1B1208" />
      <ellipse cx="49" cy="67" rx="1.2" ry="0.8" fill="#FFFFFF" opacity="0.5" />
      {/* Smile */}
      <path
        d="M 44 78 Q 50 82 56 78"
        stroke="#1B1208"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
    </>
  );
}

// ─── Wolf (Silver / rising) ────────────────────────────────────────────────
function Wolf() {
  const id = useId();
  const face = `${id}-face`;
  const chest = `${id}-chest`;
  return (
    <>
      <defs>
        <radialGradient id={face} cx="35%" cy="28%" r="85%">
          <stop offset="0%" stopColor="#B5C2D2" />
          <stop offset="55%" stopColor="#7C8B9D" />
          <stop offset="100%" stopColor="#3E4B5C" />
        </radialGradient>
        <radialGradient id={chest} cx="50%" cy="35%" r="80%">
          <stop offset="0%" stopColor="#E5EAF0" />
          <stop offset="100%" stopColor="#B0BAC5" />
        </radialGradient>
      </defs>
      {/* Pointy ears */}
      <path d="M 18 32 L 28 52 L 10 50 Z" fill="#4A586A" />
      <path d="M 21 36 L 26 48 L 16 46 Z" fill="#2A3744" />
      <path d="M 82 32 L 72 52 L 90 50 Z" fill="#4A586A" />
      <path d="M 79 36 L 74 48 L 84 46 Z" fill="#2A3744" />
      {/* Face — slightly more angular than fox */}
      <path
        d="M 50 32 Q 82 36 76 70 Q 68 90 50 92 Q 32 90 24 70 Q 18 36 50 32 Z"
        fill={`url(#${face})`}
      />
      {/* Form shadow */}
      <path
        d="M 50 32 Q 82 36 76 70 Q 68 90 50 92 Q 50 62 50 32 Z"
        fill="#1B1208"
        opacity="0.12"
      />
      {/* Lighter chest mark */}
      <path
        d="M 50 58 Q 66 60 64 80 Q 58 90 50 90 Q 42 90 36 80 Q 34 60 50 58 Z"
        fill={`url(#${chest})`}
      />
      {/* Cheek shading */}
      <ellipse cx="28" cy="64" rx="4" ry="2.5" fill="#5A6877" opacity="0.4" />
      <ellipse cx="72" cy="64" rx="4" ry="2.5" fill="#5A6877" opacity="0.4" />
      {/* Brows — slightly stern */}
      <path d="M 30 47 L 42 49" stroke="#2A3744" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M 70 47 L 58 49" stroke="#2A3744" strokeWidth="2.8" strokeLinecap="round" />
      {/* Eyes */}
      <Eye cx={38} cy={54} r={5.5} />
      <Eye cx={62} cy={54} r={5.5} />
      {/* Nose */}
      <path d="M 44 68 Q 50 64 56 68 Q 54 74 50 74 Q 46 74 44 68 Z" fill="#1B1208" />
      <ellipse cx="48" cy="67" rx="1" ry="0.6" fill="#FFFFFF" opacity="0.45" />
      {/* Mouth */}
      <path
        d="M 50 74 L 50 80 M 44 80 Q 50 84 56 80"
        stroke="#1B1208"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
    </>
  );
}

// ─── Lion (Gold / senior) ──────────────────────────────────────────────────
function Lion() {
  const id = useId();
  const face = `${id}-face`;
  const inner = `${id}-inner`;
  return (
    <>
      <defs>
        <radialGradient id={face} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#FFE4B5" />
          <stop offset="55%" stopColor="#FFC880" />
          <stop offset="100%" stopColor="#C98C3D" />
        </radialGradient>
        <radialGradient id={inner} cx="50%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#FFF1D4" />
          <stop offset="100%" stopColor="#FFD494" />
        </radialGradient>
      </defs>
      {/* Mane — petals around the face, gradient outer ring */}
      {[...Array(12)].map((_, i) => {
        const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
        const cx = 50 + Math.cos(angle) * 32;
        const cy = 50 + Math.sin(angle) * 32;
        // Tint by position — top lighter, bottom darker for volume
        const tint = cy < 50 ? "#D88E45" : "#9C5E22";
        return <circle key={i} cx={cx} cy={cy} r="11" fill={tint} />;
      })}
      {/* Inner mane darker */}
      {[...Array(12)].map((_, i) => {
        const angle = (i / 12) * Math.PI * 2 - Math.PI / 2 + Math.PI / 12;
        const cx = 50 + Math.cos(angle) * 28;
        const cy = 50 + Math.sin(angle) * 28;
        const tint = cy < 50 ? "#A56529" : "#6B3A14";
        return <circle key={`d-${i}`} cx={cx} cy={cy} r="8" fill={tint} />;
      })}
      {/* Face — round, golden, with radial volume */}
      <circle cx="50" cy="50" r="24" fill={`url(#${face})`} />
      {/* Inner face highlight */}
      <ellipse cx="50" cy="55" rx="16" ry="14" fill={`url(#${inner})`} />
      {/* Chin shadow */}
      <ellipse cx="50" cy="68" rx="12" ry="5" fill="#A56529" opacity="0.2" />
      {/* Ears */}
      <circle cx="32" cy="34" r="6" fill="#D88E45" />
      <circle cx="68" cy="34" r="6" fill="#D88E45" />
      <circle cx="32" cy="34" r="3" fill="#6B3A14" />
      <circle cx="68" cy="34" r="3" fill="#6B3A14" />
      {/* Cheek blush */}
      <ellipse cx="35" cy="56" rx="4" ry="2.5" fill="#FF9F6B" opacity="0.5" />
      <ellipse cx="65" cy="56" rx="4" ry="2.5" fill="#FF9F6B" opacity="0.5" />
      {/* Eyes */}
      <Eye cx={42} cy={48} r={4.5} />
      <Eye cx={58} cy={48} r={4.5} />
      {/* Nose */}
      <path d="M 46 58 Q 50 56 54 58 Q 52 62 50 62 Q 48 62 46 58 Z" fill="#1B1208" />
      <ellipse cx="49" cy="57.5" rx="1" ry="0.5" fill="#FFFFFF" opacity="0.5" />
      {/* Smile */}
      <path
        d="M 50 62 L 50 65 M 44 65 Q 50 70 56 65"
        stroke="#1B1208"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
    </>
  );
}

// ─── Dragon (Diamond / elite) ──────────────────────────────────────────────
function Dragon() {
  const id = useId();
  const face = `${id}-face`;
  const belly = `${id}-belly`;
  return (
    <>
      <defs>
        <radialGradient id={face} cx="35%" cy="28%" r="85%">
          <stop offset="0%" stopColor="#67E8F9" />
          <stop offset="55%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#0C637A" />
        </radialGradient>
        <radialGradient id={belly} cx="50%" cy="35%" r="80%">
          <stop offset="0%" stopColor="#E0FAFF" />
          <stop offset="100%" stopColor="#7DD9EC" />
        </radialGradient>
      </defs>
      {/* Horns */}
      <path d="M 28 28 Q 22 14 30 12 Q 34 22 32 30 Z" fill="#0E7490" />
      <path d="M 29 14 Q 30 18 31 24" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <path d="M 72 28 Q 78 14 70 12 Q 66 22 68 30 Z" fill="#0E7490" />
      <path d="M 71 14 Q 70 18 69 24" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      {/* Wings hint behind */}
      <path
        d="M 16 50 Q 8 38 4 56 Q 12 60 22 56 Z"
        fill="#67E8F9"
        opacity="0.55"
      />
      <path
        d="M 84 50 Q 92 38 96 56 Q 88 60 78 56 Z"
        fill="#67E8F9"
        opacity="0.55"
      />
      {/* Face — wedge, slightly tapered at chin */}
      <path
        d="M 50 26 Q 80 30 76 64 Q 70 86 50 92 Q 30 86 24 64 Q 20 30 50 26 Z"
        fill={`url(#${face})`}
      />
      {/* Form shadow on right side */}
      <path
        d="M 50 26 Q 80 30 76 64 Q 70 86 50 92 Q 50 60 50 26 Z"
        fill="#0C637A"
        opacity="0.18"
      />
      {/* Belly / inner face highlight */}
      <path
        d="M 50 50 Q 66 52 64 78 Q 58 88 50 88 Q 42 88 36 78 Q 34 52 50 50 Z"
        fill={`url(#${belly})`}
      />
      {/* Scales hint — small dots */}
      <circle cx="32" cy="58" r="1.5" fill="#0E7490" opacity="0.55" />
      <circle cx="68" cy="58" r="1.5" fill="#0E7490" opacity="0.55" />
      <circle cx="38" cy="42" r="1.5" fill="#0E7490" opacity="0.55" />
      <circle cx="62" cy="42" r="1.5" fill="#0E7490" opacity="0.55" />
      <circle cx="30" cy="44" r="1" fill="#0E7490" opacity="0.4" />
      <circle cx="70" cy="44" r="1" fill="#0E7490" opacity="0.4" />
      {/* Brows (fierce) */}
      <path d="M 28 44 L 42 48" stroke="#0C4A5A" strokeWidth="3" strokeLinecap="round" />
      <path d="M 72 44 L 58 48" stroke="#0C4A5A" strokeWidth="3" strokeLinecap="round" />
      {/* Eyes — big yellow with vertical slit + 3D shading */}
      <circle cx="38" cy="54" r="5.5" fill="#FFEB3B" />
      <ellipse cx="36" cy="52" rx="2" ry="2.5" fill="#FFFDE7" opacity="0.7" />
      <circle cx="62" cy="54" r="5.5" fill="#FFEB3B" />
      <ellipse cx="60" cy="52" rx="2" ry="2.5" fill="#FFFDE7" opacity="0.7" />
      <ellipse cx="38" cy="54" rx="1.6" ry="4" fill="#1B1208" />
      <ellipse cx="62" cy="54" rx="1.6" ry="4" fill="#1B1208" />
      {/* Specular dots on slits */}
      <circle cx="37.5" cy="52" r="0.7" fill="#FFFFFF" />
      <circle cx="61.5" cy="52" r="0.7" fill="#FFFFFF" />
      {/* Nostrils */}
      <circle cx="46" cy="70" r="1.5" fill="#0C4A5A" />
      <circle cx="54" cy="70" r="1.5" fill="#0C4A5A" />
      {/* Mouth — smirk */}
      <path
        d="M 42 78 Q 50 82 58 78"
        stroke="#0C4A5A"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      {/* Tiny tooth */}
      <path d="M 48 79 L 49 82 L 50 79 Z" fill="#FFFFFF" />
    </>
  );
}

// ─── Eagle (Sapphire / trending) ──────────────────────────────────────────
function Eagle() {
  const id = useId();
  const face = `${id}-face`;
  const mask = `${id}-mask`;
  const beak = `${id}-beak`;
  return (
    <>
      <defs>
        <radialGradient id={face} cx="35%" cy="28%" r="85%">
          <stop offset="0%" stopColor="#A5B0FF" />
          <stop offset="55%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#2E2E6B" />
        </radialGradient>
        <radialGradient id={mask} cx="50%" cy="35%" r="80%">
          <stop offset="0%" stopColor="#F5F7FF" />
          <stop offset="100%" stopColor="#B8C0E0" />
        </radialGradient>
        <linearGradient id={beak} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFC107" />
          <stop offset="100%" stopColor="#B86F00" />
        </linearGradient>
      </defs>
      {/* Head crest feather */}
      <path d="M 50 14 L 42 30 L 58 30 Z" fill="#2E2E6B" />
      <path d="M 50 14 L 50 30" stroke="#5759A6" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      {/* Face — indigo bird */}
      <path
        d="M 50 24 Q 80 28 76 66 Q 70 86 50 88 Q 30 86 24 66 Q 20 28 50 24 Z"
        fill={`url(#${face})`}
      />
      {/* Form shadow */}
      <path
        d="M 50 24 Q 80 28 76 66 Q 70 86 50 88 Q 50 56 50 24 Z"
        fill="#2E2E6B"
        opacity="0.20"
      />
      {/* White feather mask around eyes */}
      <path
        d="M 50 38 Q 72 42 70 62 Q 64 78 50 78 Q 36 78 30 62 Q 28 42 50 38 Z"
        fill={`url(#${mask})`}
      />
      {/* Eyes — sharp, gold iris */}
      <circle cx="38" cy="50" r="6" fill="#FFC107" />
      <circle cx="36.5" cy="48.5" r="2" fill="#FFE082" opacity="0.8" />
      <circle cx="62" cy="50" r="6" fill="#FFC107" />
      <circle cx="60.5" cy="48.5" r="2" fill="#FFE082" opacity="0.8" />
      <circle cx="38" cy="50" r="3" fill="#1B1208" />
      <circle cx="62" cy="50" r="3" fill="#1B1208" />
      <circle cx="37" cy="49" r="0.9" fill="#FFFFFF" />
      <circle cx="61" cy="49" r="0.9" fill="#FFFFFF" />
      {/* Brows */}
      <path d="M 28 42 L 44 46" stroke="#1B1208" strokeWidth="3" strokeLinecap="round" />
      <path d="M 72 42 L 56 46" stroke="#1B1208" strokeWidth="3" strokeLinecap="round" />
      {/* Beak — golden, hooked, gradient */}
      <path
        d="M 50 60 L 44 70 L 50 78 L 56 70 Z"
        fill={`url(#${beak})`}
      />
      <path
        d="M 50 68 L 47 74 L 50 76 L 53 74 Z"
        fill="#8C5800"
      />
      {/* Beak highlight */}
      <path d="M 50 60 L 47 68" stroke="#FFE082" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
    </>
  );
}

// ─── Chick (New / new) ─────────────────────────────────────────────────────
function Chick() {
  const id = useId();
  const body = `${id}-body`;
  const belly = `${id}-belly`;
  const beak = `${id}-beak`;
  return (
    <>
      <defs>
        <radialGradient id={body} cx="35%" cy="30%" r="85%">
          <stop offset="0%" stopColor="#FFF099" />
          <stop offset="55%" stopColor="#FFD93D" />
          <stop offset="100%" stopColor="#C99500" />
        </radialGradient>
        <radialGradient id={belly} cx="50%" cy="35%" r="80%">
          <stop offset="0%" stopColor="#FFFADC" />
          <stop offset="100%" stopColor="#FFE07A" />
        </radialGradient>
        <linearGradient id={beak} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFA826" />
          <stop offset="100%" stopColor="#C26200" />
        </linearGradient>
      </defs>
      {/* Egg shell remnant on top (cute) */}
      <path
        d="M 30 26 L 38 18 L 42 26 L 50 16 L 58 26 L 62 18 L 70 26 Z"
        fill="#FFF6E6"
        stroke="#C7B687"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Egg shading */}
      <path
        d="M 30 26 L 38 18 L 42 26 L 50 16 L 50 26 Z"
        fill="#FFFFFF"
        opacity="0.4"
      />
      {/* Round body */}
      <ellipse cx="50" cy="58" rx="30" ry="32" fill={`url(#${body})`} />
      {/* Form shadow */}
      <ellipse cx="58" cy="65" rx="20" ry="22" fill="#9C7400" opacity="0.18" />
      {/* Belly lighter */}
      <ellipse cx="50" cy="68" rx="18" ry="18" fill={`url(#${belly})`} />
      {/* Cheek blush */}
      <circle cx="30" cy="64" r="4.5" fill="#FF8FA8" opacity="0.7" />
      <circle cx="70" cy="64" r="4.5" fill="#FF8FA8" opacity="0.7" />
      {/* Eyes — big, innocent */}
      <circle cx="40" cy="52" r="6.5" fill="#FFFFFF" />
      <circle cx="60" cy="52" r="6.5" fill="#FFFFFF" />
      <circle cx="41" cy="53.5" r="4.2" fill="#1B1208" />
      <circle cx="61" cy="53.5" r="4.2" fill="#1B1208" />
      {/* Double specular — main + spark */}
      <circle cx="42.5" cy="51.5" r="1.6" fill="#FFFFFF" />
      <circle cx="62.5" cy="51.5" r="1.6" fill="#FFFFFF" />
      <circle cx="39.5" cy="55" r="0.7" fill="#FFFFFF" opacity="0.7" />
      <circle cx="59.5" cy="55" r="0.7" fill="#FFFFFF" opacity="0.7" />
      {/* Beak — tiny orange triangle, with gradient */}
      <path
        d="M 46 64 L 54 64 L 50 70 Z"
        fill={`url(#${beak})`}
      />
      <path
        d="M 47 64 L 53 64"
        stroke="#1B1208"
        strokeWidth="0.5"
        opacity="0.4"
      />
      {/* Beak shine */}
      <path d="M 48 65 L 49 67" stroke="#FFE082" strokeWidth="0.8" strokeLinecap="round" opacity="0.7" />
    </>
  );
}
