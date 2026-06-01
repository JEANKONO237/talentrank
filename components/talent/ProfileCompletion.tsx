"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  Briefcase,
  Camera,
  Check,
  Clock,
  FileText,
  Image as ImageIcon,
  type LucideIcon,
  Sparkles,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// ProfileCompletion — barre "Profil complété à X %" + check-list des sections
// manquantes avec lien direct vers édition.
//
// Spec user :
//   "Les champs non remplis doivent simplement apparaître comme
//    'Profil complété à 45 %' afin d'encourager la complétion progressive."
//
// Logique :
//   - 8 sections évaluées (photo, bio, CV, portfolio, expériences, skills,
//     dispo, certifications)
//   - chaque section = 12.5 % du profil
//   - on affiche pct global + liste des manquantes (max 4 visibles, expand)
//   - tier color + Lion mascot peek quand 100 % → "Profil légendaire"
//
// Le composant est PURE — il consomme un objet `completion` (vrai data
// quand auth/profile sera branché). Pour la démo, on passe des mocks.
// ─────────────────────────────────────────────────────────────────────────────

export interface ProfileSection {
  id: string;
  label: string;
  icon: LucideIcon;
  done: boolean;
  href: string;
  /** Petit teaser pour expliquer ce qui manque. */
  emptyHint?: string;
}

export const DEFAULT_SECTIONS: Omit<ProfileSection, "done">[] = [
  { id: "photo",         label: "Photo de profil",   icon: Camera,      href: "/dashboard/talent/profile",         emptyHint: "Augmente la confiance de +40%" },
  { id: "bio",           label: "Bio courte",        icon: FileText,    href: "/dashboard/talent/profile",         emptyHint: "Ce qui te rend différent en 2 lignes" },
  { id: "cv",            label: "CV / résumé",       icon: FileText,    href: "/dashboard/talent/profile",         emptyHint: "PDF ou texte structuré" },
  { id: "portfolio",     label: "Portfolio",         icon: ImageIcon,   href: "/dashboard/talent/portfolio",       emptyHint: "Tes 5 meilleurs projets" },
  { id: "experiences",   label: "Expériences",       icon: Briefcase,   href: "/dashboard/talent/profile",         emptyHint: "Studios, missions, années" },
  { id: "skills",        label: "Compétences",       icon: Wrench,      href: "/dashboard/talent/profile",         emptyHint: "Software, langues, frameworks" },
  { id: "availability",  label: "Disponibilité",     icon: Clock,       href: "/dashboard/talent/profile",         emptyHint: "Maintenant · 30j · 90j" },
  { id: "certifications", label: "Certifications",   icon: Award,       href: "/dashboard/talent/profile",         emptyHint: "Diplômes, formations validantes" },
];

interface Props {
  /** Liste de section ids déjà complétées (pour computer le % et l'état). */
  completed: string[];
  /** Si true → affiche toutes les sections, sinon 4 prochaines max. */
  expanded?: boolean;
  /** Override des sections (pour tests). */
  sections?: Omit<ProfileSection, "done">[];
}

export function ProfileCompletion({
  completed,
  expanded = false,
  sections = DEFAULT_SECTIONS,
}: Props) {
  const enriched: ProfileSection[] = sections.map((s) => ({
    ...s,
    done: completed.includes(s.id),
  }));
  const total = enriched.length;
  const doneCount = enriched.filter((s) => s.done).length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const missing = enriched.filter((s) => !s.done);
  const visible = expanded ? missing : missing.slice(0, 4);

  // Couleur dynamique selon le %
  const accent =
    pct === 100
      ? "#10B981"
      : pct >= 75
        ? "#22C55E"
        : pct >= 50
          ? "#F59E0B"
          : "#EF4444";

  const motivation =
    pct === 100
      ? "Profil légendaire. Les studios te trouvent en premier."
      : pct >= 75
        ? "Presque parfait. Encore quelques sections."
        : pct >= 50
          ? "Bonne base. Continue pour gagner en visibilité."
          : pct >= 25
            ? "C'est un début. Chaque section ajoutée booste ton ranking."
            : "Complète ton profil pour être trouvé par les studios.";

  return (
    <article
      className="relative overflow-hidden rounded-[24px] p-5 sm:p-6"
      style={{
        background: "linear-gradient(135deg, #FFFFFF 0%, #FAF6EA 100%)",
        boxShadow:
          "0 16px 40px -14px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.55), inset 0 0 0 1px rgba(0,0,0,0.04)",
      }}
    >
      {/* Halo accent */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full opacity-30 blur-3xl"
        style={{ background: accent }}
      />

      {/* Header */}
      <div className="relative flex items-start gap-3">
        <div
          className="grid place-items-center rounded-2xl shrink-0"
          style={{
            width: 52,
            height: 52,
            background: `${accent}1A`,
            color: accent,
          }}
        >
          <Sparkles className="h-6 w-6" strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400">
            Ton profil
          </p>
          <h3 className="mt-1 font-display text-[20px] font-black tracking-tight text-mist-50 leading-tight">
            Profil complété à{" "}
            <span className="tabular-nums" style={{ color: accent }}>
              {pct} %
            </span>
          </h3>
          <p className="mt-1 text-[12.5px] text-mist-300">{motivation}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative mt-5">
        <div
          className="relative h-2.5 w-full overflow-hidden rounded-full bg-ink-800"
          style={{ boxShadow: "inset 0 1px 2px rgba(0,0,0,0.10)" }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
            className="relative h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${accent}, ${accent}cc)`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.5), 0 0 8px ${accent}66`,
            }}
          >
            <span
              aria-hidden
              className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full"
              style={{
                background: "#FFFFFF",
                boxShadow: `0 0 8px ${accent}, 0 0 4px #FFFFFF`,
                opacity: pct > 0 ? 1 : 0,
              }}
            />
          </motion.div>
        </div>
        <p className="mt-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-mist-400 tabular-nums">
          {doneCount} / {total} sections complétées
        </p>
      </div>

      {/* Missing sections list — chaque ligne montre +X% gain (audit Marco G2-Marco-4) */}
      {visible.length > 0 && (
        <ul className="relative mt-5 space-y-1.5">
          {visible.map((s, i) => (
            <SectionRow
              key={s.id}
              section={s}
              delay={i * 0.04}
              gainPct={total > 0 ? Math.round(100 / total) : 0}
            />
          ))}
        </ul>
      )}

      {missing.length > visible.length && (
        <p className="relative mt-3 text-[11.5px] text-mist-400">
          + {missing.length - visible.length} autres sections à compléter
        </p>
      )}

      {pct === 100 && (
        <div className="relative mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-100 ring-1 ring-inset ring-emerald-400/40 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-800">
          <Check className="h-3 w-3" strokeWidth={3} />
          Profil complet · Tu es prioritaire dans les classements
        </div>
      )}
    </article>
  );
}

// ─── Row d'une section manquante ─────────────────────────────────────────

function SectionRow({
  section,
  delay,
  gainPct,
}: {
  section: ProfileSection;
  delay: number;
  gainPct: number;
}) {
  const Icon = section.icon;
  return (
    <motion.li
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.2, 0.7, 0.2, 1] }}
    >
      <Link
        href={section.href}
        className={cn(
          "group flex items-center gap-3 rounded-xl px-3 py-2.5",
          "bg-white ring-1 ring-inset ring-ink-700/8 hover:ring-ink-700/15",
          "transition-all hover:-translate-y-px",
        )}
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-ink-850 text-mist-300 shrink-0">
          <Icon className="h-3.5 w-3.5" strokeWidth={2.4} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[12.5px] font-bold text-mist-50 leading-tight">
            {section.label}
          </span>
          {section.emptyHint && (
            <span className="block text-[10.5px] text-mist-400 leading-tight">
              {section.emptyHint}
            </span>
          )}
        </span>
        {/* Gain potentiel — audit Marco G2-Marco-4 : le user voit clairement
            ce que cette section ajoute en % au compteur global. */}
        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-black tabular-nums shrink-0 bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-300/40"
          title={`Compléter cette section apporte +${gainPct}% au profil`}
        >
          +{gainPct}%
        </span>
        <ArrowRight
          className="h-3.5 w-3.5 text-mist-400 group-hover:text-mist-100 group-hover:translate-x-0.5 transition shrink-0"
          strokeWidth={2.4}
        />
      </Link>
    </motion.li>
  );
}
