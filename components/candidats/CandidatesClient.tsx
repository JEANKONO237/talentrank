"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  Inbox,
  Users,
  X,
} from "lucide-react";
import { useTalentActions } from "@/lib/talent-actions/storage";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// CandidatesClient — la page /candidats côté studio.
//
// Deux sections :
//   1. Ma file (queued)     — talents que tu vises pour recrutement
//   2. Talents suivis       — talents que tu surveilles sans démarche active
//
// État vide → message + lien vers /chasse pour commencer.
// Storage : localStorage via useTalentActions.
// ─────────────────────────────────────────────────────────────────────────────

export function CandidatesClient() {
  const { queued, followed, toggleQueue, toggleFollow } = useTalentActions();
  const total = queued.length + followed.length;

  return (
    <div className="container-page pt-12 pb-20">
      {/* Breadcrumb */}
      <Link
        href="/studio"
        className="inline-flex items-center gap-1.5 text-[12px] font-bold text-mist-400 hover:text-mist-50 transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.6} />
        Tableau studio
      </Link>

      {/* Header */}
      <div className="mt-6 mb-8">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400">
          Mes candidats
        </p>
        <h1
          className="mt-2 font-display font-black tracking-tight text-mist-50"
          style={{
            fontSize: "clamp(2rem, 4.5vw, 3rem)",
            lineHeight: 1.02,
            letterSpacing: "-0.02em",
          }}
        >
          Ta file de recrutement.
        </h1>
        <p className="mt-3 text-[14px] text-mist-300 max-w-xl">
          Les talents que tu as ajoutés à ta file et ceux que tu suis pour
          surveiller leurs évolutions (score, dispo, montées de ligue).
        </p>
      </div>

      {/* Empty state global */}
      {total === 0 ? (
        <div className="card-white p-12 text-center max-w-lg mx-auto">
          <div
            className="mx-auto mb-5 grid place-items-center rounded-full"
            style={{
              width: 80,
              height: 80,
              background: "radial-gradient(circle at 30% 25%, #22D3EE, #0E7490 70%)",
              boxShadow: "0 16px 32px -8px rgba(34,211,238,0.4), inset 0 3px 0 rgba(255,255,255,0.45)",
            }}
          >
            <Users className="h-10 w-10 text-white" strokeWidth={1.8} />
          </div>
          <h2 className="font-display text-[20px] font-black text-mist-50">
            Pas encore de candidats.
          </h2>
          <p className="mt-3 text-[13.5px] text-mist-300 leading-relaxed">
            Va dans <span className="font-bold">Chasse</span>, ouvre des profils
            qui t&apos;intéressent, et utilise les boutons{" "}
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[11px] font-bold">
              <Inbox className="h-3 w-3" strokeWidth={2.6} />
              Ajouter à ma file
            </span>{" "}
            ou{" "}
            <span className="inline-flex items-center gap-1 rounded-full bg-cyan-100 text-cyan-800 px-2 py-0.5 text-[11px] font-bold">
              <Eye className="h-3 w-3" strokeWidth={2.6} />
              Suivre
            </span>
            .
          </p>
          <Link
            href="/chasse"
            className="mt-6 inline-flex h-11 items-center gap-1.5 rounded-full bg-night-700 hover:bg-night-600 px-5 text-[12.5px] font-bold uppercase tracking-[0.06em] text-white transition"
          >
            Aller chasser
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.6} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section queue */}
          <Section
            title="Ma file"
            subtitle={`${queued.length} talent${queued.length > 1 ? "s" : ""} à recruter`}
            icon={<Inbox className="h-5 w-5" strokeWidth={2.4} />}
            accent="#F59E0B"
            accentBg="#FFF8E1"
            slugs={queued}
            onRemove={(slug) => toggleQueue(slug)}
            emptyLabel="Aucun talent dans ta file."
          />

          {/* Section follow */}
          <Section
            title="Talents suivis"
            subtitle={`${followed.length} talent${followed.length > 1 ? "s" : ""} en veille`}
            icon={<Eye className="h-5 w-5" strokeWidth={2.4} />}
            accent="#22D3EE"
            accentBg="#ECFEFF"
            slugs={followed}
            onRemove={(slug) => toggleFollow(slug)}
            emptyLabel="Aucun talent suivi."
          />
        </div>
      )}
    </div>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────

function Section({
  title,
  subtitle,
  icon,
  accent,
  accentBg,
  slugs,
  onRemove,
  emptyLabel,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accent: string;
  accentBg: string;
  slugs: string[];
  onRemove: (slug: string) => void;
  emptyLabel: string;
}) {
  return (
    <article className="card-white p-5">
      <header className="flex items-start gap-3 mb-4">
        <span
          className="grid h-10 w-10 place-items-center rounded-xl shrink-0"
          style={{ background: accentBg, color: accent }}
        >
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-[16px] font-black text-mist-50 leading-tight">
            {title}
          </h2>
          <p className="text-[11.5px] text-mist-400">{subtitle}</p>
        </div>
      </header>

      {slugs.length === 0 ? (
        <p className="text-[13px] text-mist-400 text-center py-6">{emptyLabel}</p>
      ) : (
        <ul className="space-y-2">
          {slugs.map((slug) => (
            <CandidateRow
              key={slug}
              slug={slug}
              accent={accent}
              onRemove={() => onRemove(slug)}
            />
          ))}
        </ul>
      )}
    </article>
  );
}

// ─── Candidate row ───────────────────────────────────────────────────────

function CandidateRow({
  slug,
  accent,
  onRemove,
}: {
  slug: string;
  accent: string;
  onRemove: () => void;
}) {
  // Stub : on n'a pas le détail du talent ici sans fetch. On affiche le slug
  // comme placeholder visuel et un lien vers /talent/[slug] pour aller voir.
  // Quand Supabase sera branché, on remplacera par les vraies data (avatar +
  // score + tier + dispo).
  const displayName = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="group flex items-center gap-3 rounded-xl bg-white ring-1 ring-inset ring-ink-700/8 p-3 hover:ring-ink-700/15 hover:-translate-y-px transition-all"
    >
      <span
        className="inline-grid h-9 w-9 place-items-center rounded-full font-display text-[12px] font-black text-white shrink-0"
        style={{
          background: "linear-gradient(160deg, #4D7EA8, #1F3A57)",
          boxShadow: "inset 0 2px 0 rgba(255,255,255,0.3)",
        }}
      >
        {slug.charAt(0).toUpperCase() + slug.charAt(1).toUpperCase()}
      </span>
      <div className="flex-1 min-w-0">
        <Link
          href={`/talent/${slug}`}
          className="block font-display text-[13.5px] font-black text-mist-50 leading-tight truncate hover:text-night-700 transition"
        >
          {displayName}
        </Link>
        <p className="text-[10.5px] text-mist-400 truncate">@{slug}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Link
          href={`/talent/${slug}`}
          className="inline-flex h-8 items-center gap-1 rounded-full bg-ink-850 hover:bg-ink-800 text-mist-100 px-3 text-[11px] font-bold uppercase tracking-[0.06em] transition"
        >
          Voir
          <ArrowRight className="h-3 w-3" strokeWidth={2.6} />
        </Link>
        <button
          type="button"
          onClick={onRemove}
          className={cn(
            "grid h-8 w-8 place-items-center rounded-full transition opacity-0 group-hover:opacity-100",
            "text-mist-400 hover:bg-rose-100 hover:text-rose-700",
          )}
          aria-label={`Retirer ${displayName}`}
          title="Retirer"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.4} />
        </button>
      </div>
      {/* Accent dot (subtle indicator of the section) */}
      <span
        aria-hidden
        className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded-full opacity-0"
        style={{ background: accent }}
      />
    </motion.li>
  );
}
