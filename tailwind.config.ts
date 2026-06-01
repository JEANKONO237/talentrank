import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ─── Surfaces (the "paper" scale) ────────────────────────────────
        // We kept the `ink-*` token names for backward compatibility, but
        // they now describe a LIGHT surface ramp: 950 = cream background,
        // 900 = pure white cards, higher numbers = darker dividers.
        ink: {
          950: "#FFFFFF",   // app background — pure white now
          900: "#FFFFFF",   // card surface
          875: "#FFFFFF",
          850: "#F7F7F7",   // alt card / strip (neutral gray, no yellow)
          800: "#EFEFEF",   // hover
          750: "#E0E0E0",
          700: "#CCCCCC",   // border / divider
          600: "#999999",
          500: "#666666",
        },
        // ─── Text scale (the "ink-on-paper" scale) ───────────────────────
        // Kept `mist-*` for compatibility but flipped: 50 = darkest text,
        // 600 = lightest hint. Read it as "shadow weight".
        mist: {
          50: "#1B1208",    // strongest titles
          100: "#2A1F12",
          200: "#3E2E1B",   // strong body
          300: "#5A4528",   // body
          400: "#6E5A3E",   // muted — bumped from #7D6A4B to clear AA 4.5:1 on white
          500: "#A39074",   // hint
          600: "#C9B998",   // disabled
        },
        // ─── Brand cyan (kept, slightly punchier) ────────────────────────
        cyan: {
          200: "#BFF6FF",
          300: "#7CE6FA",
          400: "#1CB0F6",   // Duolingo "Macaw" blue — playful
          500: "#0E89C7",
          600: "#076A9D",
        },
        amber: {
          200: "#FFE99B",
          300: "#FFD86A",
          400: "#FFC800",   // Duolingo "Bee" yellow
          500: "#E0A800",
          600: "#AD8400",
        },
        // ─── Brand 2nd : NIGHT (bleu nuit profond, autorité/sérieux) ─────
        // Existait déjà comme valeur ad-hoc dans les CTA #1A2535. Officialisé.
        // Usage : boutons primaires, badges level, gradients d'autorité.
        // Pendant de l'ambre (qui signale prestige/réussite).
        night: {
          50:  "#E7EAEF",
          100: "#C6CCD6",
          200: "#9AA3B0",
          300: "#6F7B8A",
          400: "#4D5A6B",
          500: "#2C3E55",   // base CTA gradient haut
          600: "#1F3045",
          700: "#1A2535",   // base CTA gradient bas — la "vraie" couleur brand
          800: "#121A28",
          900: "#0A1018",
        },
        // ─── Brand alias : PRESTIGE (ambre or, sémantique brand) ─────────
        // Pointe vers les mêmes valeurs que amber mais avec une intention
        // brand explicite. À utiliser pour TOUT ce qui signale réussite/or.
        prestige: {
          50:  "#FFF8E1",
          100: "#FFEAA0",
          200: "#FFD86A",
          400: "#FFC800",
          500: "#F59E0B",
          700: "#B45309",
          900: "#7C3B05",
        },
        // ─── Bright friendly accents ─────────────────────────────────────
        signal: {
          green: "#58CC02",
          red: "#FF4B4B",
          purple: "#CE82FF",
          pink: "#FF86C8",
        },
        duo: {
          green: "#58CC02",
          "green-deep": "#3DA106",
          yellow: "#FFC800",
          "yellow-deep": "#D9A800",
          blue: "#1CB0F6",
          "blue-deep": "#0E89C7",
          red: "#FF4B4B",
          "red-deep": "#CC3535",
          purple: "#CE82FF",
          "purple-deep": "#A05BD9",
          orange: "#FF9600",
          "orange-deep": "#CC7800",
          cream: "#FFFBF1",
          "cream-2": "#FAF6EA",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        // `font-display` uses Hornes Regular for large headlines.
        // Falls back to next/font Fredoka if the local Hornes file isn't
        // installed (cf. public/fonts/Hornes-Regular.ttf).
        display: ["var(--font-headline)", "var(--font-display)", "var(--font-sans)", "sans-serif"],
        // `font-menu` uses Talina for the sidebar — chunky friendly display.
        menu: ["var(--font-menu)", "var(--font-display)", "var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        "display-xl": ["clamp(2.75rem, 6.5vw, 5.5rem)", { lineHeight: "1.02", letterSpacing: "-0.025em" }],
        "display-lg": ["clamp(2.25rem, 5vw, 4rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "display-md": ["clamp(1.75rem, 3.5vw, 2.75rem)", { lineHeight: "1.1", letterSpacing: "-0.015em" }],
      },
      boxShadow: {
        // Duolingo-style solid drop shadow for the "weighty" 3D feel
        "duo-green":         "0 4px 0 0 #3DA106",
        "duo-green-active":  "0 1px 0 0 #3DA106",
        "duo-blue":          "0 4px 0 0 #0E89C7",
        "duo-blue-active":   "0 1px 0 0 #0E89C7",
        "duo-yellow":        "0 4px 0 0 #D9A800",
        "duo-yellow-active": "0 1px 0 0 #D9A800",
        "duo-red":           "0 4px 0 0 #CC3535",
        "duo-purple":        "0 4px 0 0 #A05BD9",
        "duo-orange":        "0 4px 0 0 #CC7800",
        "duo-cream":         "0 2px 0 0 #E5E5E5",
        // Card shadow — neutral gray solid drop (was sand-tinted before).
        // Pronounced enough to read on a pure-white bg.
        card: "0 6px 0 0 rgb(0 0 0 / 0.06), 0 16px 36px -14px rgb(0 0 0 / 0.10), 0 2px 6px -2px rgb(0 0 0 / 0.05)",
        "card-hover": "0 12px 0 0 rgb(0 0 0 / 0.07), 0 28px 60px -18px rgb(0 0 0 / 0.14), 0 4px 10px -3px rgb(0 0 0 / 0.06)",
        "card-press": "0 2px 0 0 rgb(0 0 0 / 0.06), 0 8px 20px -10px rgb(0 0 0 / 0.08)",
        glow: "0 0 40px -8px rgb(28 176 246 / 0.35)",
        "glow-amber": "0 0 40px -8px rgb(255 200 0 / 0.4)",
        "glow-green": "0 0 40px -8px rgb(88 204 2 / 0.45)",
        "glow-sm": "0 0 18px -4px rgb(28 176 246 / 0.4)",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(rgb(27 18 8 / 0.04) 1px, transparent 1px), linear-gradient(90deg, rgb(27 18 8 / 0.04) 1px, transparent 1px)",
        "radial-glow":
          "radial-gradient(ellipse 70% 50% at 50% 0%, rgb(28 176 246 / 0.12), transparent 60%)",
        "radial-amber":
          "radial-gradient(ellipse 60% 50% at 80% 10%, rgb(255 200 0 / 0.12), transparent 60%)",
        // ─── Brand gradients (utilisés via var() en CSS aussi) ───────────
        "gradient-night":
          "linear-gradient(180deg, #2C3E55 0%, #1A2535 100%)",
        "gradient-prestige":
          "linear-gradient(135deg, #FFF8E1 0%, #FFE8B0 100%)",
        "gradient-prestige-orb":
          "radial-gradient(circle at 30% 25%, #FFE082, #F59E0B 60%, #B45309 100%)",
        "gradient-cream-soft":
          "linear-gradient(180deg, #FEFCF6 0%, #FAF6EA 100%)",
      },
      // Border-radius scale locked — art-director request.
      // 5 tokens, no improvisation:
      //   - sm  12px (tiny chips, input edges)
      //   - md  16px (default buttons, small cards)
      //   - lg  20px (medium cards)
      //   - xl  24px (large cards, panels)
      //   - 2xl 28px (hero cards, signature surfaces)
      borderRadius: {
        sm: "12px",
        DEFAULT: "12px",
        md: "16px",
        lg: "20px",
        xl: "24px",
        "2xl": "28px",
      },
      animation: {
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
        "float-slow": "float 8s ease-in-out infinite",
        marquee: "marquee 50s linear infinite",
        "marquee-reverse": "marquee 60s linear infinite reverse",
        shimmer: "shimmer 2.4s linear infinite",
        "rise-in": "riseIn 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both",
        "squash-tap": "squashTap 0.18s ease-out",
        "bounce-soft": "bounceSoft 2.2s ease-in-out infinite",
        wiggle: "wiggle 0.6s ease-in-out",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "0.7", filter: "blur(20px)" },
          "50%": { opacity: "1", filter: "blur(28px)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        riseIn: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        squashTap: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(0.92) translateY(3px)" },
          "100%": { transform: "scale(1)" },
        },
        bounceSoft: {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "30%": { transform: "translateY(-6px) scale(1.02, 0.98)" },
          "60%": { transform: "translateY(0) scale(0.98, 1.02)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-4deg)" },
          "75%": { transform: "rotate(4deg)" },
        },
      },
      backgroundSize: {
        grid: "44px 44px",
        "grid-lg": "88px 88px",
      },
    },
  },
  plugins: [],
};

export default config;
