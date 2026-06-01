import { ImageResponse } from "next/og";

// ─────────────────────────────────────────────────────────────────────────────
// /api/og/score — Open Graph image generator (audit Sasha G3-Sasha-5).
//
// Génère une image 1200×630 (standard OG/Twitter Card) avec le score + tier
// + nom du talent. Branded TalentRank. Edge runtime via next/og.
//
// Usage : <meta property="og:image" content="/api/og/score?name=Aya&score=94&tier=elite&profession=Animator">
//
// Params query :
//   - name (required)     ex: "Aya Tanaka"
//   - score (required)    0-100
//   - tier (required)     elite | senior | trending | rising | emerging | new
//   - profession (opt)    ex: "Character Animator"
//   - city (opt)          ex: "Paris"
//
// Le viral angle : un talent qui partage son score génère une preview
// LinkedIn/Twitter avec ses chiffres + la marque TalentRank visible.
// ─────────────────────────────────────────────────────────────────────────────

export const runtime = "edge";

const TIER_META: Record<
  string,
  { label: string; color: string; bg: string; tagline: string }
> = {
  elite: {
    label: "Diamant",
    color: "#22D3EE",
    bg: "radial-gradient(circle at 30% 25%, #A5F3FC, #22D3EE 60%, #0E7490 100%)",
    tagline: "Top 1% mondial",
  },
  senior: {
    label: "Or",
    color: "#F59E0B",
    bg: "radial-gradient(circle at 30% 25%, #FFE082, #F59E0B 60%, #B45309 100%)",
    tagline: "Top 5% mondial",
  },
  trending: {
    label: "Saphir",
    color: "#6366F1",
    bg: "radial-gradient(circle at 30% 25%, #A5B4FC, #6366F1 60%, #3F3F8A 100%)",
    tagline: "Top 10% mondial",
  },
  rising: {
    label: "Argent",
    color: "#94A3B8",
    bg: "radial-gradient(circle at 30% 25%, #E2E8F0, #94A3B8 60%, #475569 100%)",
    tagline: "Top 25% mondial",
  },
  emerging: {
    label: "Bronze",
    color: "#C97A3B",
    bg: "radial-gradient(circle at 30% 25%, #F4B26A, #C97A3B 60%, #8B5022 100%)",
    tagline: "Top 50% mondial",
  },
  new: {
    label: "Nouveau",
    color: "#A3A380",
    bg: "radial-gradient(circle at 30% 25%, #D9D6B0, #A3A380 60%, #6B6850 100%)",
    tagline: "L'aventure commence",
  },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name") ?? "Talent inconnu";
  const score = parseInt(searchParams.get("score") ?? "0", 10);
  const tierId = searchParams.get("tier") ?? "new";
  const profession = searchParams.get("profession") ?? "TalentRank";
  const city = searchParams.get("city") ?? "";

  const tier = TIER_META[tierId] ?? TIER_META.new;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #FFF8E1 0%, #FFE8B0 100%)",
          position: "relative",
          padding: "60px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Halo accent */}
        <div
          style={{
            position: "absolute",
            top: "-150px",
            right: "-150px",
            width: "500px",
            height: "500px",
            borderRadius: "9999px",
            background: tier.color,
            opacity: 0.25,
            filter: "blur(80px)",
          }}
        />

        {/* Header — brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: "28px",
            fontWeight: 800,
            color: "#1B1208",
            letterSpacing: "-0.01em",
          }}
        >
          {/* Mini podium SVG */}
          <svg width="36" height="36" viewBox="0 0 40 40">
            <circle cx="20" cy="6.5" r="2.6" fill="#FFC800" />
            <rect x="3.5" y="20" width="9.5" height="14" rx="2" fill="#FFC800" />
            <rect x="15.25" y="11" width="9.5" height="23" rx="2" fill="#FFC800" />
            <rect x="27" y="25" width="9.5" height="9" rx="2" fill="#FFC800" />
          </svg>
          <span>
            TalentRank<span style={{ color: "#FFC800" }}>·</span>
          </span>
        </div>

        {/* Main row : score orb + identity */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "60px",
            marginTop: "70px",
            flex: 1,
          }}
        >
          {/* Score orb */}
          <div
            style={{
              width: "300px",
              height: "300px",
              borderRadius: "9999px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              background: tier.bg,
              boxShadow: `0 30px 60px -12px ${tier.color}aa, inset 0 8px 0 rgba(255,255,255,0.55), inset 0 -30px 50px -16px rgba(0,0,0,0.3)`,
            }}
          >
            <span
              style={{
                fontSize: "150px",
                fontWeight: 900,
                color: "white",
                lineHeight: 1,
                textShadow: "0 4px 10px rgba(0,0,0,0.3)",
              }}
            >
              {score}
            </span>
            <span
              style={{
                fontSize: "20px",
                fontWeight: 800,
                color: "rgba(255,255,255,0.9)",
                marginTop: "8px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              {tier.label}
            </span>
          </div>

          {/* Identity */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <span
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "#B45309",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
              }}
            >
              {tier.tagline}
            </span>
            <span
              style={{
                fontSize: "80px",
                fontWeight: 900,
                color: "#1B1208",
                marginTop: "12px",
                lineHeight: 1,
                letterSpacing: "-0.025em",
              }}
            >
              {name}
            </span>
            <span
              style={{
                fontSize: "32px",
                fontWeight: 700,
                color: "#3E2E1B",
                marginTop: "20px",
              }}
            >
              {profession}
              {city ? ` · ${city}` : ""}
            </span>
          </div>
        </div>

        {/* Footer brand line */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "22px",
            color: "#6E5A3E",
            fontWeight: 600,
          }}
        >
          <span>Score officiel · Anti-cheat verrouillé 1 mois</span>
          <span style={{ fontWeight: 800, color: "#1B1208" }}>talentrank.io</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
