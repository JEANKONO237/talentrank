import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// /api/og?title=...&subtitle=...&audience=talent|studio
//
// Open Graph generic — pour les pages statiques (/about, /pricing, /welcome,
// /talent, /studio). Quand un user share une de ces pages sur LinkedIn/Twitter,
// le preview est une image branded généréee à la volée.
//
// Variantes :
//   ?audience=talent → ambre warm
//   ?audience=studio → bleu nuit autorité
//   (none)           → ambre par défaut
//
// Cache : edge + s-maxage 24h (re-generated si query change).
// ─────────────────────────────────────────────────────────────────────────────

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const title = (url.searchParams.get("title") ?? "TalentRank").slice(0, 60);
  const subtitle = (
    url.searchParams.get("subtitle") ?? "Un métier, un classement."
  ).slice(0, 100);
  const audience = url.searchParams.get("audience") === "studio" ? "studio" : "talent";

  const isStudio = audience === "studio";
  const accent = isStudio ? "#1CB0F6" : "#F59E0B";
  const bgGradient = isStudio
    ? "linear-gradient(135deg, #0A1018 0%, #1A2535 60%, #2C3E55 100%)"
    : "linear-gradient(135deg, #FFF8E1 0%, #FFE8B0 100%)";
  const textColor = isStudio ? "#FFFFFF" : "#1B1208";
  const subtitleColor = isStudio ? "rgba(255,255,255,0.7)" : "#3E2E1B";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          background: bgGradient,
          padding: "80px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Halo accent */}
        <div
          style={{
            position: "absolute",
            top: "-200px",
            right: "-200px",
            width: "600px",
            height: "600px",
            borderRadius: "9999px",
            background: accent,
            opacity: 0.25,
            filter: "blur(100px)",
          }}
        />

        {/* Brand mark top */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: "32px",
            fontWeight: 800,
            color: textColor,
            letterSpacing: "-0.01em",
          }}
        >
          {/* Podium SVG */}
          <svg width="44" height="44" viewBox="0 0 40 40">
            <circle cx="20" cy="6.5" r="2.6" fill={accent} />
            <rect x="3.5" y="20" width="9.5" height="14" rx="2" fill={accent} />
            <rect x="15.25" y="11" width="9.5" height="23" rx="2" fill={accent} />
            <rect x="27" y="25" width="9.5" height="9" rx="2" fill={accent} />
          </svg>
          <span>
            TalentRank<span style={{ color: accent, marginLeft: "4px" }}>·</span>
          </span>
        </div>

        {/* Big title centered */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: accent,
              letterSpacing: "0.20em",
              textTransform: "uppercase",
              marginBottom: "20px",
            }}
          >
            {isStudio ? "Pour les entreprises" : "Pour les talents"}
          </span>
          <span
            style={{
              fontSize: "92px",
              fontWeight: 900,
              color: textColor,
              lineHeight: 1.02,
              letterSpacing: "-0.03em",
              maxWidth: "1000px",
            }}
          >
            {title}
          </span>
          <span
            style={{
              fontSize: "32px",
              fontWeight: 600,
              color: subtitleColor,
              marginTop: "24px",
              maxWidth: "900px",
              lineHeight: 1.3,
            }}
          >
            {subtitle}
          </span>
        </div>

        {/* Footer brand line */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "22px",
            color: subtitleColor,
            fontWeight: 600,
          }}
        >
          <span>{isStudio ? "Chasse les meilleurs. Sans bruit." : "Sois trouvable."}</span>
          <span style={{ fontWeight: 800, color: textColor }}>talentrank.io</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
