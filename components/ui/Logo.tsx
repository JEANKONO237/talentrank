import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  withWordmark?: boolean;
  className?: string;
  /** "default" = mark in amber gradient (works on light cream bg);
   *  "light" = mark in white (for use on dark surfaces);
   *  "mono-dark" = mark in deep ink (for favicons / monochrome). */
  variant?: "default" | "light" | "mono-dark";
  /** Audience contextuelle — change la couleur du dot signature wordmark.
   *  talent → ambre (warm/prestige) · studio → cyan (autorité/recrutement)
   *  null/undefined → ambre par défaut. Audit Charlotte G1-Charlotte-2. */
  audience?: "talent" | "studio" | null;
}

// TalentRank logo — "Le sommet et son étoile".
// Two shapes: a chunky upward chevron (the climb / the peak) and a single
// dot floating just above its tip (the goal / the #1). Distinctive enough
// to read at favicon size, calm enough to live in a navbar without shouting.
//
// We deliberately ship NO background plate so the mark sits on whatever the
// surface is — that's what makes it look native everywhere (navbar, profile
// card, score badge, favicon).
export function Logo({
  size = 40,
  withWordmark = true,
  className,
  variant = "default",
  audience = null,
}: LogoProps) {
  const gradId = `tr-mark-${variant}`;
  // Audit Charlotte G1-Charlotte-2 : le dot signature change de couleur selon
  // l'audience pour signaler le contexte. Surcharge la couleur du dot
  // (qui était ambre fixe en variant default).
  const dotColor =
    variant === "light"
      ? "#FFFFFF"
      : audience === "studio"
        ? "#1CB0F6" // cyan brand secondaire — autorité studio
        : "#FFC800"; // ambre — prestige talent (default)
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        aria-hidden
        className="shrink-0"
      >
        <defs>
          {variant === "default" && (
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFC800" />
              <stop offset="100%" stopColor="#C99A00" />
            </linearGradient>
          )}
          {variant === "light" && (
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#F1F5F9" />
            </linearGradient>
          )}
          {variant === "mono-dark" && (
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1B1208" />
              <stop offset="100%" stopColor="#1B1208" />
            </linearGradient>
          )}
        </defs>

        {/* Champion star — small dot floating above the tallest podium bar. */}
        <circle cx="20" cy="6.5" r="2.6" fill={`url(#${gradId})`} />

        {/* Podium silhouette — three ascending rounded bars (2nd · 1st · 3rd).
            Universal rank symbol: cannot be read as anything else. The middle
            bar is tallest (le sommet), the left bar 2nd height (silver), the
            right bar shortest (bronze). All in amber gradient. */}

        {/* 2nd place — left, medium height */}
        <rect
          x="3.5"
          y="20"
          width="9.5"
          height="14"
          rx="2"
          fill={`url(#${gradId})`}
        />

        {/* 1st place — middle, tallest, with subtle inner highlight via stroke */}
        <rect
          x="15.25"
          y="11"
          width="9.5"
          height="23"
          rx="2"
          fill={`url(#${gradId})`}
        />

        {/* 3rd place — right, shortest */}
        <rect
          x="27"
          y="25"
          width="9.5"
          height="9"
          rx="2"
          fill={`url(#${gradId})`}
        />
      </svg>

      {withWordmark && (
        <span
          className={cn(
            "relative font-display font-bold tracking-tight inline-flex items-baseline",
            variant === "light" ? "text-white" : "text-mist-50",
          )}
          style={{ fontSize: Math.round(size * 0.46), letterSpacing: "-0.01em" }}
        >
          TalentRank
          {/* Signature point — petite touche distinctive façon Linear / Notion.
              Couleur amber qui rappelle l'or du podium dans le mark. */}
          <span
            aria-hidden
            className="inline-block ml-[2px] align-baseline rounded-full"
            style={{
              width: Math.max(3, Math.round(size * 0.09)),
              height: Math.max(3, Math.round(size * 0.09)),
              background: dotColor,
              transform: `translateY(${Math.round(size * 0.02)}px)`,
            }}
          />
        </span>
      )}
    </span>
  );
}
