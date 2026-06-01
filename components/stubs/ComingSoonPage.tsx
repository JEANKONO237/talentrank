"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Briefcase,
  CreditCard,
  Inbox,
  Sparkles,
  Users,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// ComingSoonPage — stub réutilisable pour les routes qui apparaissent dans
// la sidebar mais dont la vraie page n'est pas encore implémentée.
//
// Évite les 404 sans tricher : on dit clairement que c'est en construction,
// avec un teasing de ce qui arrive, et un lien retour pour ne pas piéger l'user.
// ─────────────────────────────────────────────────────────────────────────────

// Mapping interne : RSC ne permet pas de passer un composant React en prop
// depuis un Server Component. On passe une string et on résout ici.
const ICON_MAP = {
  inbox: Inbox,
  users: Users,
  briefcase: Briefcase,
  "credit-card": CreditCard,
} as const;

export type ComingSoonIcon = keyof typeof ICON_MAP;

interface Props {
  title: string;
  description: string;
  features: string[];
  /** Couleur d'accent thématique. */
  accent: string;
  /** Nom de l'icône à afficher dans l'orb central (mappé en interne). */
  icon: ComingSoonIcon;
  /** Route à laquelle retourner. */
  backHref: string;
  backLabel: string;
}

export function ComingSoonPage({
  title,
  description,
  features,
  accent,
  icon,
  backHref,
  backLabel,
}: Props) {
  const Icon = ICON_MAP[icon];
  return (
    <div className="container-page pt-12 pb-20">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-[12px] font-bold text-mist-400 hover:text-mist-50 transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.6} />
        {backLabel}
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
        className="mt-10 mx-auto max-w-2xl text-center"
      >
        {/* Orb */}
        <div
          className="mx-auto grid place-items-center rounded-full"
          style={{
            width: 110,
            height: 110,
            background: `radial-gradient(circle at 30% 25%, ${accent}, ${accent}cc 60%, ${accent}88 100%)`,
            boxShadow: `0 20px 40px -10px ${accent}88, inset 0 3px 0 rgba(255,255,255,0.45), inset 0 -16px 28px -8px rgba(0,0,0,0.25)`,
          }}
        >
          <Icon className="h-14 w-14 text-white" strokeWidth={1.6} />
        </div>

        <p className="mt-7 inline-flex items-center gap-1.5 rounded-full bg-amber-100 ring-1 ring-inset ring-amber-300/40 px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.18em] text-amber-800">
          <Sparkles className="h-3 w-3" strokeWidth={2.8} />
          Bientôt disponible
        </p>

        <h1
          className="mt-5 font-display font-black tracking-tight text-mist-50"
          style={{
            fontSize: "clamp(2rem, 4.5vw, 3rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h1>
        <p className="mt-5 text-[15px] text-mist-300 leading-relaxed max-w-xl mx-auto">
          {description}
        </p>

        <div className="mt-10 card-white p-6 text-left max-w-md mx-auto">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400">
            Ce qui arrive
          </p>
          <ul className="mt-3 space-y-2">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[13px] text-mist-200">
                <span
                  className="mt-1 h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ background: accent, boxShadow: `0 0 6px ${accent}` }}
                />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <Link
          href={backHref}
          className="mt-8 inline-flex h-11 items-center gap-1.5 rounded-full bg-night-700 hover:bg-night-600 px-5 text-[12.5px] font-bold uppercase tracking-[0.06em] text-white transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.6} />
          Retour {backLabel.toLowerCase()}
        </Link>
      </motion.div>
    </div>
  );
}
