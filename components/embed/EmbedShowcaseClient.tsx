"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Code2,
  Copy,
  Github,
  Mail,
  Moon,
  Notebook,
  Sparkles,
  Sun,
} from "lucide-react";
import { TALENTS } from "@/lib/mock-talents";
import { track } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// EmbedShowcaseClient — page démo + générateur de snippets pour le widget SVG.
//
// Stratégie M-1 : démontrer le hook viral en 30 secondes.
// L'utilisateur arrive, choisit son slug, voit la preview, copie le code en
// 1 clic, le colle dans Gmail / Notion / GitHub. Done.
//
// 4 destinations couvertes :
//   - Signature email (HTML)
//   - Portfolio Notion (Markdown image)
//   - GitHub README (Markdown image)
//   - Site perso (HTML <img>)
// ─────────────────────────────────────────────────────────────────────────────

type Theme = "light" | "dark";
type Variant = "wide" | "square";

export function EmbedShowcaseClient() {
  const [slug, setSlug] = useState<string>(TALENTS[0]?.slug ?? "jean-onana");
  const [theme, setTheme] = useState<Theme>("light");
  const [variant, setVariant] = useState<Variant>("wide");
  const [origin, setOrigin] = useState<string>("");
  const [copiedTarget, setCopiedTarget] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  const embedUrl = useMemo(() => {
    const base = origin || "https://talentrank.io";
    const params = new URLSearchParams({ slug, theme, variant });
    return `${base}/api/embed/score?${params.toString()}`;
  }, [origin, slug, theme, variant]);

  const profileUrl = origin ? `${origin}/talent/${slug}` : `/talent/${slug}`;

  const handleCopy = async (text: string, targetId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTarget(targetId);
      // Track : on log le snippet_type (html/markdown/url/raw) pour savoir
      // quelle surface est la plus utilisée → orienter la doc future.
      const snippetType: "html" | "markdown" | "url" | "raw" =
        targetId === "html"
          ? "html"
          : targetId === "markdown"
            ? "markdown"
            : targetId === "notion"
              ? "url"
              : "raw";
      track("embed_copied", { variant, theme, snippet_type: snippetType });
      setTimeout(() => setCopiedTarget(null), 1800);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="container-page pt-12 pb-20">
      {/* Back */}
      <Link
        href="/dashboard/talent"
        className="inline-flex items-center gap-1.5 text-[12px] font-bold text-mist-400 hover:text-mist-50 transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.6} />
        Retour au dashboard
      </Link>

      {/* Header */}
      <div className="mt-6 max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-mist-400 inline-flex items-center gap-1.5">
          <Code2 className="h-3 w-3 text-amber-700" strokeWidth={2.8} />
          Embed ton score
        </p>
        <h1
          className="mt-3 font-display font-black tracking-tight text-mist-50"
          style={{
            fontSize: "clamp(2rem, 4.5vw, 3.2rem)",
            lineHeight: 1.02,
            letterSpacing: "-0.02em",
          }}
        >
          Affiche ton score{" "}
          <span className="relative inline-block">
            partout.
            <span
              aria-hidden
              className="absolute left-0 right-0 -bottom-1 sm:-bottom-1.5 h-[5px] sm:h-[6px] rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, rgba(255,200,0,0.30) 0%, rgba(255,200,0,0.60) 50%, rgba(255,200,0,0.30) 100%)",
              }}
            />
          </span>
        </h1>
        <p className="mt-4 text-[14.5px] text-mist-300 leading-relaxed">
          Signature email, portfolio Notion, README GitHub, site perso. Un
          snippet à coller, un score qui se met à jour automatiquement. Image
          SVG mise en cache CDN — zéro impact perf chez le destinataire.
        </p>
      </div>

      {/* Controls + Preview */}
      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* ── Controls ── */}
        <section className="card-white p-5 sm:p-6 space-y-5">
          <h2 className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400">
            Personnalise
          </h2>

          {/* Slug selector (demo : on choisit un talent existant) */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist-100">
              Profil
            </label>
            <p className="mt-0.5 text-[11px] text-mist-400">
              Demo : choisis un profil de la beta pour générer.
            </p>
            <select
              value={slug}
              onChange={(e) => setSlug(e.currentTarget.value)}
              className="mt-2 w-full h-11 rounded-xl bg-white ring-1 ring-inset ring-ink-700/10 focus:ring-2 focus:ring-amber-300/60 px-3 text-[13.5px] text-mist-50 outline-none transition"
            >
              {TALENTS.map((t) => (
                <option key={t.id} value={t.slug}>
                  {t.name} — {t.score}/100
                </option>
              ))}
            </select>
          </div>

          {/* Format */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist-100">
              Format
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <SegmentBtn
                active={variant === "wide"}
                onClick={() => setVariant("wide")}
                title="Large (signature email)"
              >
                Large 640×120
              </SegmentBtn>
              <SegmentBtn
                active={variant === "square"}
                onClick={() => setVariant("square")}
                title="Carré (portfolio, README)"
              >
                Carré 220×220
              </SegmentBtn>
            </div>
          </div>

          {/* Thème */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-mist-100">
              Thème
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <SegmentBtn
                active={theme === "light"}
                onClick={() => setTheme("light")}
              >
                <Sun className="h-3.5 w-3.5" strokeWidth={2.6} />
                Clair
              </SegmentBtn>
              <SegmentBtn
                active={theme === "dark"}
                onClick={() => setTheme("dark")}
              >
                <Moon className="h-3.5 w-3.5" strokeWidth={2.6} />
                Sombre
              </SegmentBtn>
            </div>
          </div>
        </section>

        {/* ── Preview ── */}
        <section className="card-white p-5 sm:p-6">
          <h2 className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400 mb-4">
            Aperçu live
          </h2>
          <div
            className={cn(
              "rounded-2xl p-6 flex items-center justify-center min-h-[260px]",
              theme === "dark" ? "bg-ink-900" : "bg-ink-50",
            )}
            style={{
              backgroundImage:
                "repeating-conic-gradient(rgba(0,0,0,0.04) 0% 25%, transparent 0% 50%)",
              backgroundSize: "20px 20px",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={embedUrl}
              alt="Preview du widget TalentRank"
              className={cn(
                "transition-opacity duration-200",
                variant === "wide" ? "max-w-full" : "h-[220px] w-[220px]",
              )}
            />
          </div>
        </section>
      </div>

      {/* Snippets */}
      <section className="mt-10">
        <h2 className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400 mb-4">
          Snippets prêts à coller
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SnippetCard
            id="html"
            Icon={Mail}
            title="Signature email (HTML)"
            description="Gmail · Outlook · Apple Mail. Colle dans tes paramètres de signature."
            code={`<a href="${profileUrl}">
  <img src="${embedUrl}" alt="Mon score TalentRank" width="${variant === "wide" ? 320 : 110}" />
</a>`}
            onCopy={handleCopy}
            copied={copiedTarget === "html"}
          />
          <SnippetCard
            id="markdown"
            Icon={Github}
            title="GitHub README"
            description="Colle dans ton README.md ou un projet épinglé pour montrer ton classement."
            code={`[![Mon score TalentRank](${embedUrl})](${profileUrl})`}
            onCopy={handleCopy}
            copied={copiedTarget === "markdown"}
          />
          <SnippetCard
            id="notion"
            Icon={Notebook}
            title="Portfolio Notion / Super.so"
            description="Bloc image Notion → URL externe. Le score se met à jour automatiquement."
            code={embedUrl}
            onCopy={handleCopy}
            copied={copiedTarget === "notion"}
          />
          <SnippetCard
            id="raw"
            Icon={Code2}
            title="URL directe du SVG"
            description="Pour ton site perso, ton portfolio Webflow, ou n'importe où qui accepte une URL."
            code={embedUrl}
            onCopy={handleCopy}
            copied={copiedTarget === "raw"}
          />
        </div>
      </section>

      {/* Marketing note */}
      <div className="mt-12 max-w-2xl mx-auto card-white p-5 text-center relative overflow-hidden">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-300/30 blur-3xl"
        />
        <p className="relative text-[10.5px] font-bold uppercase tracking-[0.18em] text-amber-800 inline-flex items-center gap-1.5">
          <Sparkles className="h-3 w-3" strokeWidth={2.8} />
          Bénéfice cumulé
        </p>
        <p className="relative mt-2 text-[13.5px] text-mist-100 leading-relaxed">
          Chaque embed = un backlink permanent vers ton profil. Plus ton score
          monte, plus tu reçois de visites. Plus tu reçois de visites, plus les
          studios te trouvent. Boucle vertueuse silencieuse.
        </p>
      </div>
    </div>
  );
}

// ─── SegmentBtn ────────────────────────────────────────────────────────────

function SegmentBtn({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-3 text-[11.5px] font-bold transition",
        active
          ? "bg-night-700 text-white shadow-card"
          : "bg-white ring-1 ring-inset ring-ink-700/10 text-mist-100 hover:bg-ink-50",
      )}
    >
      {children}
    </button>
  );
}

// ─── SnippetCard ───────────────────────────────────────────────────────────

function SnippetCard({
  id,
  Icon,
  title,
  description,
  code,
  onCopy,
  copied,
}: {
  id: string;
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
  code: string;
  onCopy: (text: string, id: string) => void;
  copied: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.3 }}
      className="card-white p-5 flex flex-col"
    >
      <div className="flex items-start gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-100 ring-1 ring-inset ring-amber-300/40 shrink-0">
          <Icon className="h-4 w-4 text-amber-700" strokeWidth={2.4} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[14px] font-black tracking-tight text-mist-50">
            {title}
          </h3>
          <p className="mt-0.5 text-[11.5px] text-mist-400 leading-snug">
            {description}
          </p>
        </div>
      </div>

      <pre className="mt-3 flex-1 rounded-xl bg-ink-50 ring-1 ring-inset ring-ink-700/10 p-3 text-[11px] font-mono text-mist-100 overflow-x-auto whitespace-pre-wrap break-all">
        {code}
      </pre>

      <button
        type="button"
        onClick={() => onCopy(code, id)}
        className={cn(
          "mt-3 inline-flex h-9 items-center justify-center gap-1.5 rounded-full text-[11.5px] font-bold uppercase tracking-[0.06em] transition",
          copied
            ? "bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-300/40"
            : "bg-night-700 hover:bg-night-600 text-white",
        )}
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
            Copié dans le presse-papier
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" strokeWidth={2.6} />
            Copier
          </>
        )}
      </button>
    </motion.div>
  );
}
