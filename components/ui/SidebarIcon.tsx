import Image from "next/image";
import { useId } from "react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar icons — illustrations 3D officielles (PNG) en priorité, SVG fallback.
//
// Décision design (Jean-Marie, validée) : les PNG 3D-rendered apportent la
// chaleur et l'éclairage que les SVG plats ne peuvent pas reproduire. On les
// garde sur les 5 entrées principales. Les autres icônes (ligues, settings,
// more, etc.) tombent sur les SVG hand-built ci-dessous.
//
// Note famille : les mascottes V2 (LeagueMascot) sont en SVG dimensionnel
// avec radial gradients pour s'approcher de la richesse visuelle des PNG.
// Le micro-décalage de famille est accepté — l'éclairage chaud des PNG vaut
// le compromis.
//
// Style rules (kept across the SVG fallback family):
//   - viewBox 64×64, icon takes ~48px of canvas, leaves breathing room
//   - Top-to-bottom gradient on every coloured surface (light top, deep bottom)
//   - Thin dark outline (1.5px) in a darker shade of the main hue
//   - Soft drop shadow under each form (SVG filter via useId — multi-instance safe)
//   - Bright accent highlights (small white shines) where the form catches light
// ─────────────────────────────────────────────────────────────────────────────

export type SidebarIconName =
  | "home"
  | "metiers"
  | "explorer"
  | "chasse"
  | "ranking"
  | "ligues"
  | "qcm"
  | "studios"
  | "profil"
  | "settings"
  | "more";

interface Props {
  name: SidebarIconName;
  size?: number;
  className?: string;
}

// Mapping nom→fichier PNG (illustrations 3D officielles, lumière chaude).
// Quand un nom est listé ici, on rend l'image au lieu du SVG hand-built.
const PNG_FOR: Partial<Record<SidebarIconName, { src: string; alt: string }>> = {
  home:     { src: "/images/banner/1.png", alt: "Pancarte Welcome" },
  explorer: { src: "/images/banner/5.png", alt: "Carte au trésor et boussole" },
  ranking:  { src: "/images/banner/3.png", alt: "Trophée doré sur podium" },
  qcm:      { src: "/images/banner/2.png", alt: "Clipboard A+ avec stylo" },
  chasse:   { src: "/images/banner/4.png", alt: "Affiche Wanted Dead or Alive" },
};

export function SidebarIcon({ name, size = 48, className }: Props) {
  // Hooks first (rules of hooks) — always called even si on retombe sur PNG.
  const dropId = useId();

  // Polished PNG illustration first — falls back to hand-built SVG.
  const png = PNG_FOR[name];
  if (png) {
    return (
      <Image
        src={png.src}
        alt={png.alt}
        width={size}
        height={size}
        className={cn(
          "block shrink-0 object-contain",
          "drop-shadow-[0_4px_8px_rgba(0,0,0,0.18)]",
          className,
        )}
        priority={name === "home"}
      />
    );
  }

  const Inner = ICONS[name] ?? Explorer;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={cn("block shrink-0", className)}
      role="img"
      aria-hidden
    >
      <defs>
        <filter id={dropId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.2" />
          <feOffset dx="0" dy="1.5" result="off" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.32" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter={`url(#${dropId})`}>
        <Inner />
      </g>
    </svg>
  );
}

const ICONS: Record<SidebarIconName, () => React.ReactElement> = {
  home: Home,
  metiers: Metiers,
  explorer: Explorer,
  chasse: Chasse,
  ranking: Ranking,
  ligues: Ligues,
  qcm: Qcm,
  studios: Studios,
  profil: Profil,
  settings: Settings,
  more: More,
};

// ─── ACCUEIL · wooden WELCOME sign with bushes ────────────────────────────
function Home() {
  return (
    <>
      <defs>
        <linearGradient id="welcome-wood-dark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A0522D" />
          <stop offset="100%" stopColor="#5D2F0F" />
        </linearGradient>
        <linearGradient id="welcome-wood-light" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E0AC78" />
          <stop offset="100%" stopColor="#A5703D" />
        </linearGradient>
        <linearGradient id="welcome-bush" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7CB342" />
          <stop offset="100%" stopColor="#2E7D32" />
        </linearGradient>
      </defs>

      {/* Nail at top */}
      <circle cx="32" cy="8" r="2.4" fill="#757575" stroke="#212121" strokeWidth="1" />
      <circle cx="31.5" cy="7.5" r="0.8" fill="#BDBDBD" />

      {/* Cords from nail to sign */}
      <line x1="32" y1="10" x2="16" y2="18" stroke="#3E2723" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="32" y1="10" x2="48" y2="18" stroke="#3E2723" strokeWidth="1.3" strokeLinecap="round" />

      {/* Outer dark wood frame */}
      <rect
        x="8"
        y="16"
        width="48"
        height="24"
        rx="2.5"
        fill="url(#welcome-wood-dark)"
        stroke="#2E1505"
        strokeWidth="1.8"
      />
      {/* Inner lighter wood panel */}
      <rect
        x="11"
        y="19"
        width="42"
        height="18"
        rx="1.5"
        fill="url(#welcome-wood-light)"
        stroke="#5D2F0F"
        strokeWidth="1"
      />
      {/* Wood grain hint */}
      <line x1="13" y1="24" x2="51" y2="24" stroke="#5D2F0F" strokeWidth="0.5" opacity="0.35" />
      <line x1="13" y1="32" x2="51" y2="32" stroke="#5D2F0F" strokeWidth="0.5" opacity="0.35" />

      {/* WELCOME text */}
      <text
        x="32"
        y="31"
        textAnchor="middle"
        fontFamily="Nunito, Arial, sans-serif"
        fontWeight="900"
        fontSize="7"
        fill="#3E1F0B"
        letterSpacing="0.5"
      >
        WELCOME
      </text>

      {/* Bushes left */}
      <circle cx="11" cy="50" r="7" fill="url(#welcome-bush)" stroke="#1B5E20" strokeWidth="1.2" />
      <circle cx="19" cy="52" r="5" fill="url(#welcome-bush)" stroke="#1B5E20" strokeWidth="1.2" />
      <circle cx="13" cy="48" r="2" fill="rgba(255,255,255,0.25)" />

      {/* Bushes right */}
      <circle cx="53" cy="50" r="7" fill="url(#welcome-bush)" stroke="#1B5E20" strokeWidth="1.2" />
      <circle cx="45" cy="52" r="5" fill="url(#welcome-bush)" stroke="#1B5E20" strokeWidth="1.2" />
      <circle cx="51" cy="48" r="2" fill="rgba(255,255,255,0.25)" />

      {/* Top sheen on the sign */}
      <rect x="11" y="19" width="42" height="3" rx="1.5" fill="rgba(255,255,255,0.25)" />
    </>
  );
}

// ─── MÉTIERS · stack of 3 books with a star ────────────────────────────────
function Metiers() {
  return (
    <>
      <defs>
        <linearGradient id="book-pink" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F8BBD0" />
          <stop offset="100%" stopColor="#EC407A" />
        </linearGradient>
        <linearGradient id="book-teal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#80CBC4" />
          <stop offset="100%" stopColor="#26A69A" />
        </linearGradient>
        <linearGradient id="book-yellow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF59D" />
          <stop offset="100%" stopColor="#FBC02D" />
        </linearGradient>
      </defs>
      {/* Bottom (pink) */}
      <rect x="12" y="42" width="40" height="10" rx="2" fill="url(#book-pink)" stroke="#8E1F4A" strokeWidth="1.4" />
      <rect x="14" y="46" width="20" height="1.5" rx="0.75" fill="rgba(255,255,255,0.45)" />
      {/* Middle (teal), slightly offset */}
      <rect x="15" y="31" width="36" height="10" rx="2" fill="url(#book-teal)" stroke="#1B5E5E" strokeWidth="1.4" />
      <rect x="17" y="35" width="18" height="1.5" rx="0.75" fill="rgba(255,255,255,0.45)" />
      {/* Top (yellow) */}
      <rect x="17" y="20" width="32" height="10" rx="2" fill="url(#book-yellow)" stroke="#9C7300" strokeWidth="1.4" />
      <rect x="19" y="24" width="14" height="1.5" rx="0.75" fill="rgba(255,255,255,0.5)" />
      {/* Star on the top book */}
      <path
        d="M 41 23 L 42.5 26 L 45.5 26.2 L 43.2 28.2 L 44 31.2 L 41 29.6 L 38 31.2 L 38.8 28.2 L 36.5 26.2 L 39.5 26 Z"
        fill="#FFD54F"
        stroke="#5E2F00"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
    </>
  );
}

// ─── EXPLORER · treasure map + compass + push pins ────────────────────────
function Explorer() {
  return (
    <>
      <defs>
        <linearGradient id="map-paper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F5DEB3" />
          <stop offset="100%" stopColor="#C8A573" />
        </linearGradient>
        <linearGradient id="compass-ring" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EEEEEE" />
          <stop offset="100%" stopColor="#9E9E9E" />
        </linearGradient>
      </defs>

      {/* Map — folded paper shape */}
      <path
        d="M 4 14 L 22 10 L 40 14 L 56 10 L 54 50 L 38 54 L 22 50 L 6 54 Z"
        fill="url(#map-paper)"
        stroke="#6E4C24"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Vertical fold lines */}
      <line x1="22" y1="10" x2="22" y2="50" stroke="#8B6F47" strokeWidth="0.8" opacity="0.55" />
      <line x1="40" y1="14" x2="38" y2="54" stroke="#8B6F47" strokeWidth="0.8" opacity="0.55" />

      {/* Dotted path */}
      <g fill="#3E2E1B">
        <circle cx="11" cy="22" r="0.9" />
        <circle cx="15" cy="20" r="0.9" />
        <circle cx="19" cy="22" r="0.9" />
        <circle cx="24" cy="24" r="0.9" />
        <circle cx="28" cy="28" r="0.9" />
        <circle cx="32" cy="30" r="0.9" />
      </g>

      {/* X marker (red, bold) */}
      <g stroke="#E53935" strokeWidth="2.8" strokeLinecap="round">
        <line x1="34" y1="22" x2="42" y2="30" />
        <line x1="42" y1="22" x2="34" y2="30" />
      </g>

      {/* Green push pin (top-left of map) */}
      <circle cx="10" cy="18" r="3" fill="#43A047" stroke="#1B5E20" strokeWidth="1.2" />
      <circle cx="9.2" cy="17.2" r="1" fill="#A5D6A7" />

      {/* Red push pin (top-right hint, near X) */}
      <circle cx="38" cy="18" r="2.6" fill="#E53935" stroke="#9C0F0F" strokeWidth="1.1" />
      <circle cx="37.3" cy="17.3" r="0.9" fill="#FFCDD2" />

      {/* Compass — sits over bottom-right */}
      <circle cx="46" cy="42" r="11" fill="url(#compass-ring)" stroke="#212121" strokeWidth="1.6" />
      <circle cx="46" cy="42" r="8" fill="#FAFAFA" stroke="#9E9E9E" strokeWidth="0.9" />
      {/* Needle — red north, white south */}
      <path d="M 46 34 L 49 42 L 46 42 Z" fill="#E53935" stroke="#9C0F0F" strokeWidth="0.6" />
      <path d="M 46 42 L 43 42 L 46 34 Z" fill="#EF5350" stroke="#9C0F0F" strokeWidth="0.6" />
      <path d="M 46 42 L 49 42 L 46 50 Z" fill="#FFFFFF" stroke="#9E9E9E" strokeWidth="0.6" />
      <path d="M 46 50 L 43 42 L 46 42 Z" fill="#F5F5F5" stroke="#9E9E9E" strokeWidth="0.6" />
      {/* Center pin */}
      <circle cx="46" cy="42" r="1.3" fill="#212121" />
      {/* N marker */}
      <text
        x="46"
        y="33"
        textAnchor="middle"
        fontFamily="Nunito, Arial, sans-serif"
        fontWeight="900"
        fontSize="4"
        fill="#212121"
      >
        N
      </text>
    </>
  );
}

// ─── CHASSE · WANTED parchment poster with silhouette + stars ─────────────
function Chasse() {
  return (
    <>
      <defs>
        <linearGradient id="chasse-parch" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F5DEB3" />
          <stop offset="100%" stopColor="#C8A573" />
        </linearGradient>
      </defs>

      {/* Parchment with torn / wavy edges */}
      <path
        d="M 10 8
           Q 12 6 16 8
           Q 22 6 28 8
           Q 34 6 40 8
           Q 46 6 52 8
           Q 56 10 54 14
           L 56 56
           Q 54 58 50 56
           Q 44 58 38 56
           Q 32 58 26 56
           Q 20 58 14 56
           Q 8 58 10 54
           Z"
        fill="url(#chasse-parch)"
        stroke="#6E4C24"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Inner dashed-ish border */}
      <rect
        x="13"
        y="11"
        width="38"
        height="42"
        rx="1"
        fill="none"
        stroke="#7B5532"
        strokeWidth="0.8"
        strokeDasharray="2 1.5"
        opacity="0.55"
      />

      {/* WANTED title */}
      <text
        x="32"
        y="20"
        textAnchor="middle"
        fontFamily="Nunito, Arial, sans-serif"
        fontWeight="900"
        fontSize="8"
        fill="#3E1F0B"
        letterSpacing="0.8"
      >
        WANTED
      </text>

      {/* Silhouette portrait inside a soft frame */}
      <rect
        x="20"
        y="23"
        width="24"
        height="20"
        rx="1.5"
        fill="#E0C28B"
        stroke="#6E4C24"
        strokeWidth="1"
      />
      {/* Silhouette body */}
      <path
        d="M 32 27
           Q 28 27 28 31
           Q 28 33 30 34
           L 22 42
           L 42 42
           L 34 34
           Q 36 33 36 31
           Q 36 27 32 27 Z"
        fill="#3E1F0B"
      />
      {/* Pirate hat hint */}
      <path
        d="M 25 27 L 32 23 L 39 27 Q 36 26 32 26 Q 28 26 25 27 Z"
        fill="#3E1F0B"
      />

      {/* DEAD OR ALIVE bottom */}
      <text
        x="32"
        y="49"
        textAnchor="middle"
        fontFamily="Nunito, Arial, sans-serif"
        fontWeight="900"
        fontSize="4.2"
        fill="#3E1F0B"
        letterSpacing="0.4"
      >
        DEAD OR ALIVE
      </text>

      {/* Five small stars */}
      <g fill="#9C7400" stroke="#5E3700" strokeWidth="0.4">
        {[18, 24, 30, 36, 42].map((cx) => (
          <path
            key={cx}
            d={`M ${cx} 53 L ${cx + 0.9} 54.8 L ${cx + 2.8} 55 L ${cx + 1.4} 56.3 L ${cx + 1.8} 58 L ${cx} 57.1 L ${cx - 1.8} 58 L ${cx - 1.4} 56.3 L ${cx - 2.8} 55 L ${cx - 0.9} 54.8 Z`}
          />
        ))}
      </g>

      {/* Top shine on parchment */}
      <path
        d="M 14 10 Q 32 6 50 10 L 50 12 Q 32 9 14 12 Z"
        fill="rgba(255,255,255,0.35)"
      />
    </>
  );
}

// ─── CLASSEMENTS · gold trophy with star + 1-2-3 podium + confetti ────────
function Ranking() {
  return (
    <>
      <defs>
        <linearGradient id="rank-1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE082" />
          <stop offset="100%" stopColor="#F9A825" />
        </linearGradient>
        <linearGradient id="rank-2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ECEFF1" />
          <stop offset="100%" stopColor="#90A4AE" />
        </linearGradient>
        <linearGradient id="rank-3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFAB91" />
          <stop offset="100%" stopColor="#8D4030" />
        </linearGradient>
        <linearGradient id="rank-crown" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFEB3B" />
          <stop offset="100%" stopColor="#F57C00" />
        </linearGradient>
        <radialGradient id="rank-glow" cx="0.5" cy="0.5">
          <stop offset="0%" stopColor="#FFEB3B" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FFEB3B" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Confetti pieces around */}
      <rect x="6" y="14" width="3" height="1.5" rx="0.6" fill="#42A5F5" transform="rotate(20 7.5 14.75)" />
      <rect x="54" y="10" width="3.5" height="1.5" rx="0.6" fill="#E53935" transform="rotate(-30 55.75 10.75)" />
      <circle cx="10" cy="24" r="1" fill="#FFD54F" />
      <circle cx="55" cy="26" r="1.2" fill="#7E57C2" />
      <rect x="49" y="20" width="2.5" height="1.4" rx="0.5" fill="#43A047" transform="rotate(40 50.25 20.7)" />

      {/* Podium 2 (left, silver) */}
      <rect x="4" y="40" width="16" height="16" rx="2" fill="url(#rank-2)" stroke="#37474F" strokeWidth="1.5" />
      <rect x="4" y="40" width="16" height="3" rx="1" fill="rgba(255,255,255,0.5)" />
      <text x="12" y="52" textAnchor="middle" fontFamily="Nunito, Arial, sans-serif" fontWeight="900" fontSize="11" fill="#263238">2</text>

      {/* Podium 1 (center, gold) — tallest */}
      <rect x="20" y="32" width="20" height="24" rx="2" fill="url(#rank-1)" stroke="#7B5800" strokeWidth="1.6" />
      <rect x="20" y="32" width="20" height="3" rx="1" fill="rgba(255,255,255,0.55)" />
      <text x="30" y="50" textAnchor="middle" fontFamily="Nunito, Arial, sans-serif" fontWeight="900" fontSize="13" fill="#3D2200">1</text>

      {/* Podium 3 (right, bronze) — shortest */}
      <rect x="40" y="44" width="16" height="12" rx="2" fill="url(#rank-3)" stroke="#5C2814" strokeWidth="1.5" />
      <rect x="40" y="44" width="16" height="3" rx="1" fill="rgba(255,255,255,0.45)" />
      <text x="48" y="54" textAnchor="middle" fontFamily="Nunito, Arial, sans-serif" fontWeight="900" fontSize="10" fill="#3D1100">3</text>

      {/* Trophy cup (sits on podium 1) */}
      {/* Handles */}
      <path d="M 22 18 Q 17 18 17 24 Q 17 28 21 30" stroke="#7B5800" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M 38 18 Q 43 18 43 24 Q 43 28 39 30" stroke="#7B5800" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      {/* Cup body */}
      <path
        d="M 22 14 L 38 14 L 37 28 Q 36 32 30 32 Q 24 32 23 28 Z"
        fill="url(#rank-1)"
        stroke="#7B5800"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      {/* Cup rim */}
      <rect x="21" y="13" width="18" height="3" rx="1" fill="#FFE082" stroke="#7B5800" strokeWidth="1.3" />
      {/* Star on cup */}
      <path
        d="M 30 18 L 31.5 21.5 L 35.2 21.7 L 32.4 23.8 L 33.4 27.3 L 30 25.4 L 26.6 27.3 L 27.6 23.8 L 24.8 21.7 L 28.5 21.5 Z"
        fill="#FFFFFF"
        stroke="#7B5800"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
      {/* Trophy neck + base */}
      <rect x="27" y="30" width="6" height="3" fill="#F9A825" stroke="#7B5800" strokeWidth="1.2" />
      <rect x="24" y="31" width="12" height="3" rx="0.6" fill="#FFE082" stroke="#7B5800" strokeWidth="1.3" />
      {/* Cup shine */}
      <path d="M 24 15 Q 23 22 25 28" stroke="rgba(255,255,255,0.65)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </>
  );
}

// ─── ÉVALUATION · clipboard with checkmarks + A+ grade + pen ──────────────
function Qcm() {
  return (
    <>
      <defs>
        <linearGradient id="qcm-board" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C28247" />
          <stop offset="100%" stopColor="#7B4A22" />
        </linearGradient>
        <linearGradient id="qcm-paper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F0F0F0" />
        </linearGradient>
        <linearGradient id="qcm-pen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#42A5F5" />
          <stop offset="100%" stopColor="#1976D2" />
        </linearGradient>
      </defs>

      {/* Clipboard back (brown wood) */}
      <rect
        x="14"
        y="12"
        width="36"
        height="44"
        rx="3"
        fill="url(#qcm-board)"
        stroke="#3E1F0B"
        strokeWidth="1.6"
      />

      {/* White paper attached */}
      <rect
        x="17"
        y="18"
        width="30"
        height="34"
        rx="1.5"
        fill="url(#qcm-paper)"
        stroke="#9E9E9E"
        strokeWidth="1"
      />

      {/* Clip (metal) at top */}
      <rect
        x="24"
        y="9"
        width="16"
        height="8"
        rx="1.5"
        fill="#CFD8DC"
        stroke="#37474F"
        strokeWidth="1.4"
      />
      <rect x="26" y="10.5" width="12" height="2" rx="0.6" fill="#90A4AE" />
      <rect x="28" y="14" width="8" height="2" rx="0.5" fill="#37474F" />

      {/* Checkmarks rows */}
      <g stroke="#43A047" strokeWidth="1.6" strokeLinecap="round" fill="none">
        <path d="M 20 24 L 22 26 L 26 22" />
        <path d="M 20 30 L 22 32 L 26 28" />
        <path d="M 20 36 L 22 38 L 26 34" />
      </g>
      {/* Lines next to each check */}
      <line x1="29" y1="25" x2="40" y2="25" stroke="#9E9E9E" strokeWidth="1" strokeLinecap="round" />
      <line x1="29" y1="31" x2="40" y2="31" stroke="#9E9E9E" strokeWidth="1" strokeLinecap="round" />
      <line x1="29" y1="37" x2="38" y2="37" stroke="#9E9E9E" strokeWidth="1" strokeLinecap="round" />

      {/* A+ red circle */}
      <circle
        cx="36"
        cy="44"
        r="6.5"
        fill="none"
        stroke="#E53935"
        strokeWidth="2"
      />
      <text
        x="36"
        y="46.5"
        textAnchor="middle"
        fontFamily="Nunito, Arial, sans-serif"
        fontWeight="900"
        fontSize="7"
        fill="#E53935"
      >
        A+
      </text>

      {/* Pen — leaning, blue */}
      <g transform="rotate(35 50 44)">
        <rect
          x="46"
          y="32"
          width="3.6"
          height="22"
          rx="1.5"
          fill="url(#qcm-pen)"
          stroke="#0D47A1"
          strokeWidth="1"
        />
        {/* Pen tip */}
        <path
          d="M 46 54 L 47.8 58 L 49.6 54 Z"
          fill="#37474F"
          stroke="#212121"
          strokeWidth="0.8"
        />
        {/* Pen clip ring */}
        <rect x="45.5" y="36" width="4.6" height="1.4" fill="#0D47A1" />
      </g>

      {/* Paper highlight */}
      <rect x="17" y="18" width="30" height="2" rx="1" fill="rgba(255,255,255,0.6)" />
    </>
  );
}

// ─── ENTREPRISES · blue building with star sign + bushes ──────────────────
function Studios() {
  return (
    <>
      <defs>
        <linearGradient id="studio-bldg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#64B5F6" />
          <stop offset="100%" stopColor="#1976D2" />
        </linearGradient>
        <linearGradient id="studio-bush" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A5D6A7" />
          <stop offset="100%" stopColor="#43A047" />
        </linearGradient>
        <linearGradient id="studio-sign" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#90CAF9" />
          <stop offset="100%" stopColor="#1976D2" />
        </linearGradient>
      </defs>
      {/* Building body */}
      <rect x="18" y="20" width="28" height="32" rx="2" fill="url(#studio-bldg)" stroke="#0D47A1" strokeWidth="1.6" />
      {/* Star sign on top */}
      <rect x="25" y="14" width="14" height="10" rx="2" fill="url(#studio-sign)" stroke="#0D47A1" strokeWidth="1.4" />
      <path
        d="M 32 16 L 33.2 18.4 L 35.8 18.6 L 33.8 20.2 L 34.6 22.6 L 32 21.4 L 29.4 22.6 L 30.2 20.2 L 28.2 18.6 L 30.8 18.4 Z"
        fill="#FFD54F"
        stroke="#5E2F00"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
      {/* Windows — grid */}
      <rect x="22" y="28" width="5" height="5" rx="1" fill="#BBDEFB" stroke="#0D47A1" strokeWidth="0.6" />
      <rect x="29.5" y="28" width="5" height="5" rx="1" fill="#BBDEFB" stroke="#0D47A1" strokeWidth="0.6" />
      <rect x="37" y="28" width="5" height="5" rx="1" fill="#BBDEFB" stroke="#0D47A1" strokeWidth="0.6" />
      <rect x="22" y="35" width="5" height="5" rx="1" fill="#BBDEFB" stroke="#0D47A1" strokeWidth="0.6" />
      <rect x="29.5" y="35" width="5" height="5" rx="1" fill="#BBDEFB" stroke="#0D47A1" strokeWidth="0.6" />
      <rect x="37" y="35" width="5" height="5" rx="1" fill="#BBDEFB" stroke="#0D47A1" strokeWidth="0.6" />
      {/* Door */}
      <rect x="29.5" y="44" width="5" height="8" rx="0.8" fill="#0D47A1" />
      {/* Building highlight */}
      <rect x="20" y="22" width="4" height="28" fill="rgba(255,255,255,0.18)" />
      {/* Bushes left */}
      <circle cx="14" cy="50" r="5" fill="url(#studio-bush)" stroke="#1B5E20" strokeWidth="1.2" />
      <circle cx="18" cy="52" r="4" fill="url(#studio-bush)" stroke="#1B5E20" strokeWidth="1.2" />
      {/* Bushes right */}
      <circle cx="50" cy="50" r="5" fill="url(#studio-bush)" stroke="#1B5E20" strokeWidth="1.2" />
      <circle cx="46" cy="52" r="4" fill="url(#studio-bush)" stroke="#1B5E20" strokeWidth="1.2" />
    </>
  );
}

// ─── PROFIL · mini affiche WANTED avec silhouette ─────────────────────────
// Concept Chasseur/Chassé : le talent EST la prime recherchée. Son profil
// est représenté comme une mini affiche Wanted (parchemin + portrait
// silhouette + étoiles). Le studio "chasse" cette affiche.
function Profil() {
  return (
    <>
      <defs>
        <linearGradient id="wanted-parch" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F5DEB3" />
          <stop offset="100%" stopColor="#C8A573" />
        </linearGradient>
        <linearGradient id="wanted-portrait-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E0C28B" />
          <stop offset="100%" stopColor="#B89A6A" />
        </linearGradient>
      </defs>

      {/* Parchemin avec coins légèrement repliés */}
      <path
        d="M 10 8
           Q 14 6 18 8
           Q 26 6 32 8
           Q 38 6 46 8
           Q 50 6 54 8
           Q 58 10 56 14
           L 56 50
           Q 58 54 54 56
           Q 46 58 38 56
           Q 32 58 26 56
           Q 18 58 10 56
           Q 6 54 8 50
           L 8 14
           Q 6 10 10 8 Z"
        fill="url(#wanted-parch)"
        stroke="#6E4C24"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      {/* WANTED top */}
      <text
        x="32"
        y="17"
        textAnchor="middle"
        fontFamily="Nunito, Arial, sans-serif"
        fontWeight="900"
        fontSize="6.5"
        fill="#3E1F0B"
        letterSpacing="0.8"
      >
        WANTED
      </text>

      {/* Cadre intérieur du portrait */}
      <rect
        x="14"
        y="20"
        width="36"
        height="26"
        rx="1.5"
        fill="url(#wanted-portrait-bg)"
        stroke="#6E4C24"
        strokeWidth="1"
      />

      {/* Mini-mascotte Lion Or — audit Yuki G1-Yuki-2 : remplace silhouette
          anonyme par mascotte de la ligue (signature TalentRank). Par défaut
          Lion Or ; quand auth est branché on lit le tier du user. */}
      {/* Crinière externe */}
      <g>
        {[...Array(8)].map((_, i) => {
          const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
          const cx = 32 + Math.cos(angle) * 7;
          const cy = 33 + Math.sin(angle) * 7;
          return <circle key={i} cx={cx} cy={cy} r="3.2" fill="#C97A3B" />;
        })}
      </g>
      {/* Face dorée */}
      <circle cx="32" cy="33" r="5.5" fill="#FFC880" />
      {/* Inner highlight */}
      <ellipse cx="32" cy="35" rx="3.8" ry="3.2" fill="#FFE4B5" />
      {/* Oreilles */}
      <circle cx="28" cy="29" r="1.5" fill="#FFC880" />
      <circle cx="36" cy="29" r="1.5" fill="#FFC880" />
      {/* Eyes */}
      <circle cx="30" cy="32.5" r="1.2" fill="#1B1208" />
      <circle cx="34" cy="32.5" r="1.2" fill="#1B1208" />
      <circle cx="30.2" cy="32.2" r="0.4" fill="#FFFFFF" />
      <circle cx="34.2" cy="32.2" r="0.4" fill="#FFFFFF" />
      {/* Nez triangle */}
      <path d="M 31 35 L 33 35 L 32 36.2 Z" fill="#1B1208" />
      {/* Smile */}
      <path
        d="M 30.5 37 Q 32 38 33.5 37"
        stroke="#1B1208"
        strokeWidth="0.7"
        strokeLinecap="round"
        fill="none"
      />

      {/* DEAD OR ALIVE micro-line (en réalité on adoucit en "ON THE RUN") */}
      <text
        x="32"
        y="52"
        textAnchor="middle"
        fontFamily="Nunito, Arial, sans-serif"
        fontWeight="900"
        fontSize="3.6"
        fill="#3E1F0B"
        letterSpacing="0.35"
      >
        TALENT
      </text>

      {/* Mini étoiles en bas */}
      <g fill="#9C7400" stroke="#5E3700" strokeWidth="0.4">
        {[22, 28, 34, 40].map((cx) => (
          <path
            key={cx}
            d={`M ${cx} 54 L ${cx + 0.7} 55.4 L ${cx + 2} 55.5 L ${cx + 1} 56.4 L ${cx + 1.4} 57.7 L ${cx} 57 L ${cx - 1.4} 57.7 L ${cx - 1} 56.4 L ${cx - 2} 55.5 L ${cx - 0.7} 55.4 Z`}
          />
        ))}
      </g>

      {/* Top sheen */}
      <path
        d="M 12 10 Q 32 7 52 10 L 52 12 Q 32 9 12 12 Z"
        fill="rgba(255,255,255,0.4)"
      />
    </>
  );
}

// ─── LIGUES · gold shield with star ────────────────────────────────────────
function Ligues() {
  return (
    <>
      <defs>
        <linearGradient id="ligues-shield" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE082" />
          <stop offset="100%" stopColor="#F9A825" />
        </linearGradient>
      </defs>
      {/* Shield silhouette */}
      <path
        d="M 32 10
           L 50 16
           Q 50 36 46 44
           Q 40 54 32 56
           Q 24 54 18 44
           Q 14 36 14 16
           Z"
        fill="url(#ligues-shield)"
        stroke="#5E3700"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Inner band darker */}
      <path
        d="M 32 16
           L 46 20
           Q 46 35 43 42
           Q 38 50 32 52
           Q 26 50 21 42
           Q 18 35 18 20
           Z"
        fill="#FFB300"
        opacity="0.55"
      />
      {/* Star centered */}
      <path
        d="M 32 22 L 34.6 28.4 L 41.4 28.8 L 36 33 L 37.8 39.6 L 32 36 L 26.2 39.6 L 28 33 L 22.6 28.8 L 29.4 28.4 Z"
        fill="#FFFFFF"
        stroke="#5E3700"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      {/* Top highlight */}
      <path
        d="M 18 16 Q 24 12 32 11 L 32 14 Q 24 15 18 18 Z"
        fill="rgba(255,255,255,0.45)"
      />
    </>
  );
}

// ─── PARAMÈTRES · cog wheel ────────────────────────────────────────────────
function Settings() {
  return (
    <>
      <defs>
        <linearGradient id="settings-cog" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#90A4AE" />
          <stop offset="100%" stopColor="#455A64" />
        </linearGradient>
      </defs>
      {/* 8 teeth around the cog — drawn as a star-ish shape */}
      <g transform="translate(32 32)">
        {[...Array(8)].map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const cx = Math.cos(angle) * 18;
          const cy = Math.sin(angle) * 18;
          return (
            <rect
              key={i}
              x={-5}
              y={-5}
              width={10}
              height={10}
              rx={2}
              fill="url(#settings-cog)"
              stroke="#1C313A"
              strokeWidth="1"
              transform={`translate(${cx} ${cy}) rotate(${(angle * 180) / Math.PI})`}
            />
          );
        })}
      </g>
      {/* Main disc */}
      <circle cx="32" cy="32" r="14" fill="url(#settings-cog)" stroke="#1C313A" strokeWidth="1.8" />
      {/* Inner hole */}
      <circle cx="32" cy="32" r="6" fill="#FFFFFF" stroke="#1C313A" strokeWidth="1.4" />
      <circle cx="32" cy="32" r="3" fill="#90A4AE" />
      {/* Top-left highlight */}
      <path
        d="M 22 26 Q 19 31 21 36"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </>
  );
}

// ─── PLUS · purple disc with three white dots ─────────────────────────────
function More() {
  return (
    <>
      <defs>
        <linearGradient id="more-disc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#B084F0" />
          <stop offset="100%" stopColor="#7E57C2" />
        </linearGradient>
      </defs>
      {/* Disc */}
      <circle cx="32" cy="34" r="22" fill="url(#more-disc)" stroke="#3F1C84" strokeWidth="1.8" />
      {/* Top-left highlight */}
      <path
        d="M 18 22 Q 14 28 16 36"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Three dots */}
      <circle cx="22" cy="34" r="3" fill="#FFFFFF" />
      <circle cx="32" cy="34" r="3" fill="#FFFFFF" />
      <circle cx="42" cy="34" r="3" fill="#FFFFFF" />
    </>
  );
}
