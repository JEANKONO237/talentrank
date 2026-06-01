"use client";

// ─────────────────────────────────────────────────────────────────────────────
// PortfolioCovers — illustrations SVG abstraites pour TalentShowcase.
//
// Audit Nadia (art-director) : un emoji 🎬💻🥖 XL comme "preview portfolio"
// sur une plateforme qui vend des créatifs = anti-pitch. Cette suite de
// covers donne un APERÇU visuel (low-fidelity mais riche) en attendant les
// vrais portfolios des talents inscrits.
//
// 3 covers thématiques :
//   - Animator3DCover : cubes 3D + lumière, palette dark blue/cyan
//   - FrontendDevCover : IDE-like avec gradient lines de code colorées
//   - BakerCover : texture grain + arche four chaud
//
// Toutes en viewBox 4:3 (matchent aspect-[4/3] de TalentCard).
// ─────────────────────────────────────────────────────────────────────────────

interface CoverProps {
  className?: string;
}

// ─── Animator 3D — cubes + lumière de scène ──────────────────────────────

export function Animator3DCover({ className }: CoverProps) {
  return (
    <svg
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-label="Aperçu portfolio Animation 3D"
    >
      <defs>
        <linearGradient id="anim3d-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0F2540" />
          <stop offset="100%" stopColor="#1A2535" />
        </linearGradient>
        <radialGradient id="anim3d-light" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="rgba(34,211,238,0.5)" />
          <stop offset="100%" stopColor="rgba(34,211,238,0)" />
        </radialGradient>
        <linearGradient id="cube-1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#0E7490" />
        </linearGradient>
        <linearGradient id="cube-2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#5B21B6" />
        </linearGradient>
        <linearGradient id="cube-3" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="100%" stopColor="#9D174D" />
        </linearGradient>
      </defs>

      <rect width="400" height="300" fill="url(#anim3d-bg)" />
      {/* Lumière studio */}
      <ellipse cx="200" cy="80" rx="280" ry="180" fill="url(#anim3d-light)" />

      {/* Grid plancher (perspective lignes) */}
      <g stroke="rgba(34,211,238,0.18)" strokeWidth="1" fill="none">
        <line x1="0" y1="220" x2="400" y2="220" />
        <line x1="0" y1="245" x2="400" y2="245" />
        <line x1="0" y1="270" x2="400" y2="270" />
        <line x1="60" y1="220" x2="-40" y2="300" />
        <line x1="140" y1="220" x2="100" y2="300" />
        <line x1="200" y1="220" x2="200" y2="300" />
        <line x1="260" y1="220" x2="300" y2="300" />
        <line x1="340" y1="220" x2="440" y2="300" />
      </g>

      {/* Cube isométrique central */}
      <g transform="translate(170 110)">
        {/* Top face */}
        <path d="M 0 30 L 30 12 L 60 30 L 30 48 Z" fill="url(#cube-1)" />
        {/* Right face */}
        <path d="M 30 48 L 60 30 L 60 80 L 30 98 Z" fill="#0E7490" />
        {/* Left face */}
        <path d="M 0 30 L 0 80 L 30 98 L 30 48 Z" fill="#155E75" />
      </g>

      {/* Cube secondaire gauche */}
      <g transform="translate(80 150)">
        <path d="M 0 18 L 18 7 L 36 18 L 18 29 Z" fill="url(#cube-2)" />
        <path d="M 18 29 L 36 18 L 36 50 L 18 60 Z" fill="#5B21B6" />
        <path d="M 0 18 L 0 50 L 18 60 L 18 29 Z" fill="#4C1D95" />
      </g>

      {/* Cube tertiaire droite */}
      <g transform="translate(280 170)">
        <path d="M 0 14 L 15 5 L 30 14 L 15 23 Z" fill="url(#cube-3)" />
        <path d="M 15 23 L 30 14 L 30 38 L 15 48 Z" fill="#9D174D" />
        <path d="M 0 14 L 0 38 L 15 48 L 15 23 Z" fill="#831843" />
      </g>

      {/* Particules de lumière */}
      <circle cx="100" cy="60" r="2" fill="#FFFFFF" opacity="0.7" />
      <circle cx="320" cy="90" r="1.5" fill="#22D3EE" opacity="0.6" />
      <circle cx="240" cy="50" r="1" fill="#FFFFFF" opacity="0.5" />
      <circle cx="50" cy="100" r="1.5" fill="#A78BFA" opacity="0.5" />
    </svg>
  );
}

// ─── Frontend Dev — IDE lines + gradient ──────────────────────────────────

export function FrontendDevCover({ className }: CoverProps) {
  return (
    <svg
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-label="Aperçu portfolio Frontend Engineer"
    >
      <defs>
        <linearGradient id="fe-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#1E293B" />
        </linearGradient>
        <linearGradient id="fe-glow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1CB0F6" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
      </defs>

      <rect width="400" height="300" fill="url(#fe-bg)" />

      {/* Window chrome (3 dots) */}
      <g transform="translate(20 20)">
        <circle cx="0" cy="0" r="5" fill="#EF4444" />
        <circle cx="16" cy="0" r="5" fill="#F59E0B" />
        <circle cx="32" cy="0" r="5" fill="#10B981" />
      </g>

      {/* Lignes de code abstraites — gradient stylé */}
      <g transform="translate(20 55)">
        {[
          { y: 0,   w: 80,  color: "#94A3B8", indent: 0 },
          { y: 22,  w: 180, color: "#1CB0F6", indent: 20 },
          { y: 44,  w: 140, color: "#A78BFA", indent: 40 },
          { y: 66,  w: 220, color: "#10B981", indent: 40 },
          { y: 88,  w: 110, color: "#F472B6", indent: 60 },
          { y: 110, w: 160, color: "#FFC800", indent: 40 },
          { y: 132, w: 90,  color: "#94A3B8", indent: 20 },
          { y: 154, w: 200, color: "#1CB0F6", indent: 0 },
          { y: 176, w: 130, color: "#A78BFA", indent: 20 },
          { y: 198, w: 80,  color: "#10B981", indent: 0 },
        ].map((line, i) => (
          <rect
            key={i}
            x={line.indent}
            y={line.y}
            width={line.w}
            height={8}
            rx={2}
            fill={line.color}
            opacity={0.85}
          />
        ))}
      </g>

      {/* Cursor block clignotant simulation */}
      <rect x={20 + 60} y={55 + 198} width="3" height="12" fill="#FFFFFF" opacity="0.9" />

      {/* Glow band en bas */}
      <rect x="0" y="265" width="400" height="2" fill="url(#fe-glow)" opacity="0.6" />
    </svg>
  );
}

// ─── Baker — four chaud + grain texture ──────────────────────────────────

export function BakerCover({ className }: CoverProps) {
  return (
    <svg
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-label="Aperçu portfolio Boulangerie"
    >
      <defs>
        <linearGradient id="baker-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3D1F0B" />
          <stop offset="50%" stopColor="#8B4513" />
          <stop offset="100%" stopColor="#A85A1C" />
        </linearGradient>
        <radialGradient id="baker-fire" cx="50%" cy="65%" r="40%">
          <stop offset="0%" stopColor="#FFE082" />
          <stop offset="40%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="rgba(180,83,9,0)" />
        </radialGradient>
        <radialGradient id="baker-bread" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#F4D7A1" />
          <stop offset="100%" stopColor="#8B5E2C" />
        </radialGradient>
      </defs>

      <rect width="400" height="300" fill="url(#baker-bg)" />

      {/* Arche du four */}
      <path
        d="M 70 290 L 70 180 Q 70 90 200 90 Q 330 90 330 180 L 330 290 Z"
        fill="#2A1408"
      />
      {/* Intérieur du four (lumière feu) */}
      <path
        d="M 100 290 L 100 195 Q 100 115 200 115 Q 300 115 300 195 L 300 290 Z"
        fill="url(#baker-fire)"
      />

      {/* Brique pattern subtile sur la voûte */}
      <g stroke="rgba(0,0,0,0.25)" strokeWidth="1" fill="none">
        <path d="M 100 180 Q 200 130 300 180" />
        <path d="M 100 160 Q 200 110 300 160" />
        <path d="M 100 140 Q 200 90 300 140" />
      </g>

      {/* Pain rond au centre */}
      <ellipse cx="200" cy="225" rx="60" ry="40" fill="url(#baker-bread)" />
      {/* Scarifications sur la pâte */}
      <g stroke="#5C3A1F" strokeWidth="2" fill="none" strokeLinecap="round">
        <path d="M 165 215 Q 200 210 235 215" />
        <path d="M 175 225 Q 200 220 225 225" />
      </g>
      {/* Highlight croûte */}
      <ellipse cx="185" cy="210" rx="20" ry="6" fill="#FFE082" opacity="0.5" />

      {/* Étincelles / vapeur */}
      <circle cx="160" cy="170" r="2" fill="#FFE082" opacity="0.8" />
      <circle cx="240" cy="160" r="2.5" fill="#FFE082" opacity="0.7" />
      <circle cx="195" cy="155" r="1.5" fill="#FFC800" opacity="0.8" />
      <circle cx="220" cy="180" r="1" fill="#FFFFFF" opacity="0.6" />

      {/* Grain texture haut */}
      {[...Array(20)].map((_, i) => (
        <circle
          key={i}
          cx={(i * 23 + 7) % 400}
          cy={(i * 17 + 3) % 80}
          r={Math.random() * 1 + 0.3}
          fill="#FFE082"
          opacity={0.15}
        />
      ))}
    </svg>
  );
}

// ─── Mapper helper ───────────────────────────────────────────────────────

export type PortfolioCoverKind = "animator-3d" | "frontend-dev" | "baker";

export function PortfolioCover({
  kind,
  className,
}: {
  kind: PortfolioCoverKind;
  className?: string;
}) {
  if (kind === "animator-3d") return <Animator3DCover className={className} />;
  if (kind === "frontend-dev") return <FrontendDevCover className={className} />;
  return <BakerCover className={className} />;
}
