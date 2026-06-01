import { NextResponse } from "next/server";
import { TALENTS } from "@/lib/mock-talents";
import { PROFESSIONS } from "@/lib/professions";
import { tierForPercentile } from "@/lib/tiers";

// ─────────────────────────────────────────────────────────────────────────────
// /api/embed/score — SVG signature widget pour talents.
//
// Stratégie marketing M-1 (Tomás #2) : un talent qui colle son score dans sa
// signature email / portfolio Notion / README GitHub crée un viral hook
// permanent vers TalentRank. SVG car :
//   - scale parfaitement (impression, retina, dark/light)
//   - rendu nativement par GitHub README, Notion, signature email
//   - texte sélectionnable / accessible
//   - taille fichier minimale (~2-4 KB)
//
// Usage :
//   <img src="https://talentrank.io/api/embed/score?slug=jean-onana" />
//
// Paramètres :
//   - slug (required) : identifie le talent
//   - theme (opt) : "light" | "dark" — default light
//   - variant (opt) : "wide" (640x120) | "square" (220x220) — default wide
//
// Cache : 1h public + s-maxage 1j. Les scores sont verrouillés 1 mois donc
// pas besoin de fraîcheur temps réel.
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_HEADER =
  "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const theme = (searchParams.get("theme") ?? "light") as "light" | "dark";
  const variant = (searchParams.get("variant") ?? "wide") as "wide" | "square";

  if (!slug) {
    return new NextResponse("slug required", { status: 400 });
  }

  const talent = TALENTS.find((t) => t.slug === slug);
  if (!talent) {
    // Renvoie un SVG d'erreur élégant plutôt que 404 — pour ne pas casser les
    // signatures email quand un talent supprime son profil temporairement.
    return svgResponse(notFoundSvg(slug, variant, theme));
  }

  const tier = tierForPercentile(talent.percentile);
  const profession = talent.professionId
    ? PROFESSIONS.find((p) => p.id === talent.professionId)
    : undefined;
  const professionLabel = profession?.frLabel ?? talent.discipline;

  const svg =
    variant === "square"
      ? renderSquare({
          name: talent.name,
          score: talent.score,
          tier: tier.label,
          tierColor: tier.color,
          tierHighlight: tier.highlight,
          profession: professionLabel,
          city: talent.city ?? "",
          theme,
        })
      : renderWide({
          name: talent.name,
          score: talent.score,
          tier: tier.label,
          tierColor: tier.color,
          tierHighlight: tier.highlight,
          profession: professionLabel,
          city: talent.city ?? "",
          theme,
        });

  return svgResponse(svg);
}

function svgResponse(body: string) {
  return new NextResponse(body, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": CACHE_HEADER,
    },
  });
}

// ─── Theme tokens ───────────────────────────────────────────────────────────

interface ThemeTokens {
  bg: string;
  bgGradient: [string, string];
  textPrimary: string;
  textMuted: string;
  textBrand: string;
  border: string;
}

function tokens(theme: "light" | "dark"): ThemeTokens {
  if (theme === "dark") {
    return {
      bg: "#0F1118",
      bgGradient: ["#1A1E2E", "#0F1118"],
      textPrimary: "#F5F0E0",
      textMuted: "#9CA3AF",
      textBrand: "#FFC800",
      border: "#2A2F3E",
    };
  }
  return {
    bg: "#FFF8E1",
    bgGradient: ["#FFFBEA", "#FFEFC4"],
    textPrimary: "#1B1208",
    textMuted: "#6E5A3E",
    textBrand: "#B45309",
    border: "#E6D4A8",
  };
}

// ─── Wide variant (640x120) — signature email/portfolio ─────────────────────

function renderWide({
  name,
  score,
  tier,
  tierColor,
  tierHighlight,
  profession,
  city,
  theme,
}: {
  name: string;
  score: number;
  tier: string;
  tierColor: string;
  tierHighlight: string;
  profession: string;
  city: string;
  theme: "light" | "dark";
}) {
  const t = tokens(theme);
  const W = 640;
  const H = 120;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escapeXml(name)} — Score ${score} sur TalentRank">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${t.bgGradient[0]}" />
      <stop offset="100%" stop-color="${t.bgGradient[1]}" />
    </linearGradient>
    <radialGradient id="orb" cx="0.3" cy="0.25">
      <stop offset="0%" stop-color="${tierHighlight}" />
      <stop offset="60%" stop-color="${tierColor}" />
      <stop offset="100%" stop-color="${tierColor}" stop-opacity="0.85" />
    </radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" rx="16" fill="url(#bg)" />
  <rect width="${W}" height="${H}" rx="16" fill="none" stroke="${t.border}" stroke-width="1" />

  <!-- Brand row top-left : mini podium SVG + wordmark -->
  <g transform="translate(20, 16)">
    <g transform="scale(0.7)">
      <circle cx="20" cy="6.5" r="2.6" fill="${t.textBrand}" />
      <rect x="3.5" y="20" width="9.5" height="14" rx="2" fill="${t.textBrand}" />
      <rect x="15.25" y="11" width="9.5" height="23" rx="2" fill="${t.textBrand}" />
      <rect x="27" y="25" width="9.5" height="9" rx="2" fill="${t.textBrand}" />
    </g>
    <text x="34" y="18" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="800" letter-spacing="0.04em" fill="${t.textPrimary}">TALENTRANK</text>
  </g>

  <!-- Score orb -->
  <g transform="translate(80, 60)">
    <circle r="42" fill="url(#orb)" />
    <text x="0" y="6" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="900" fill="#FFFFFF" style="text-shadow: 0 2px 4px rgba(0,0,0,0.3)">${score}</text>
    <text x="0" y="22" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="8" font-weight="800" fill="#FFFFFF" letter-spacing="0.2em" opacity="0.92">${escapeXml(tier.toUpperCase())}</text>
  </g>

  <!-- Identity block -->
  <g transform="translate(150, 0)">
    <text x="0" y="52" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="900" fill="${t.textPrimary}" letter-spacing="-0.01em">${escapeXml(truncate(name, 28))}</text>
    <text x="0" y="74" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" fill="${t.textBrand}">${escapeXml(truncate(profession, 36))}</text>
    <text x="0" y="94" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="500" fill="${t.textMuted}">${city ? `📍 ${escapeXml(truncate(city, 32))}  ·  ` : ""}Score officiel · Anti-cheat verrouillé</text>
  </g>

  <!-- "talentrank.io" footer signature -->
  <text x="${W - 20}" y="${H - 14}" text-anchor="end" font-family="ui-monospace, SF Mono, Menlo, monospace" font-size="9" font-weight="700" fill="${t.textMuted}" letter-spacing="0.08em">talentrank.io →</text>
</svg>`;
}

// ─── Square variant (220x220) — portfolio card / GitHub README ──────────────

function renderSquare({
  name,
  score,
  tier,
  tierColor,
  tierHighlight,
  profession,
  city,
  theme,
}: {
  name: string;
  score: number;
  tier: string;
  tierColor: string;
  tierHighlight: string;
  profession: string;
  city: string;
  theme: "light" | "dark";
}) {
  const t = tokens(theme);
  const S = 220;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}" role="img" aria-label="${escapeXml(name)} — Score ${score} sur TalentRank">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${t.bgGradient[0]}" />
      <stop offset="100%" stop-color="${t.bgGradient[1]}" />
    </linearGradient>
    <radialGradient id="orb" cx="0.3" cy="0.25">
      <stop offset="0%" stop-color="${tierHighlight}" />
      <stop offset="60%" stop-color="${tierColor}" />
      <stop offset="100%" stop-color="${tierColor}" stop-opacity="0.85" />
    </radialGradient>
  </defs>

  <rect width="${S}" height="${S}" rx="20" fill="url(#bg)" />
  <rect width="${S}" height="${S}" rx="20" fill="none" stroke="${t.border}" stroke-width="1" />

  <!-- Brand -->
  <text x="${S / 2}" y="22" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="9" font-weight="800" letter-spacing="0.22em" fill="${t.textBrand}">TALENTRANK</text>

  <!-- Score orb center -->
  <g transform="translate(${S / 2}, 100)">
    <circle r="48" fill="url(#orb)" />
    <text x="0" y="10" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="42" font-weight="900" fill="#FFFFFF">${score}</text>
    <text x="0" y="28" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="9" font-weight="800" fill="#FFFFFF" letter-spacing="0.22em" opacity="0.95">${escapeXml(tier.toUpperCase())}</text>
  </g>

  <!-- Identity -->
  <text x="${S / 2}" y="172" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="900" fill="${t.textPrimary}" letter-spacing="-0.01em">${escapeXml(truncate(name, 22))}</text>
  <text x="${S / 2}" y="190" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="700" fill="${t.textBrand}">${escapeXml(truncate(profession, 28))}</text>
  ${city ? `<text x="${S / 2}" y="204" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="9" font-weight="500" fill="${t.textMuted}">${escapeXml(truncate(city, 28))}</text>` : ""}
</svg>`;
}

// ─── Fallback when slug not found ───────────────────────────────────────────

function notFoundSvg(slug: string, variant: "wide" | "square", theme: "light" | "dark") {
  const t = tokens(theme);
  if (variant === "square") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220">
  <rect width="220" height="220" rx="20" fill="${t.bg}" stroke="${t.border}" />
  <text x="110" y="100" text-anchor="middle" font-family="system-ui" font-size="10" fill="${t.textMuted}">Profil indisponible</text>
  <text x="110" y="120" text-anchor="middle" font-family="ui-monospace, monospace" font-size="9" fill="${t.textBrand}">talentrank.io</text>
</svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="120" viewBox="0 0 640 120">
  <rect width="640" height="120" rx="16" fill="${t.bg}" stroke="${t.border}" />
  <text x="20" y="50" font-family="system-ui" font-size="14" font-weight="700" fill="${t.textPrimary}">Profil TalentRank indisponible</text>
  <text x="20" y="72" font-family="system-ui" font-size="11" fill="${t.textMuted}">${escapeXml(`slug : ${slug}`)}</text>
  <text x="620" y="105" text-anchor="end" font-family="ui-monospace, monospace" font-size="9" font-weight="700" fill="${t.textBrand}">talentrank.io →</text>
</svg>`;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}
