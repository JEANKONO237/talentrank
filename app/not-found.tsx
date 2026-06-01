import Link from "next/link";
import { ArrowRight, Compass, Home } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// 404 — migration cream + FR.
//
// Le ton reste léger (pas culpabilisant) et on propose 2 sorties claires :
// retourner à l'accueil ou explorer les métiers (point d'entrée naturel pour
// les visiteurs qui ne savent pas où aller).
// ─────────────────────────────────────────────────────────────────────────────

export default function NotFound() {
  return (
    <div className="container-page grid min-h-[80vh] place-items-center text-center">
      <div className="max-w-md">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-mist-400">
          404
        </p>
        <h1
          className="mt-4 font-display font-black tracking-tight text-mist-50"
          style={{
            fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
            lineHeight: 1.04,
            letterSpacing: "-0.025em",
          }}
        >
          Ce talent n&apos;est pas classé ici.
        </h1>
        <p className="mt-4 text-[14.5px] text-mist-300 leading-relaxed">
          La page que tu cherches n&apos;existe pas — soit elle a déménagé, soit
          on ne l&apos;a pas encore construite. Reviens à l&apos;accueil ou explore
          les métiers.
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <Link
            href="/"
            className="inline-flex h-11 items-center gap-1.5 rounded-full bg-night-700 hover:bg-night-600 text-white px-5 text-[12.5px] font-bold uppercase tracking-[0.04em] transition shadow-card"
          >
            <Home className="h-3.5 w-3.5" strokeWidth={2.6} />
            Retour à l&apos;accueil
          </Link>
          <Link
            href="/metiers"
            className="inline-flex h-11 items-center gap-1.5 rounded-full bg-white hover:bg-ink-50 ring-1 ring-inset ring-ink-700/10 text-mist-100 px-5 text-[12.5px] font-bold uppercase tracking-[0.04em] transition shadow-card"
          >
            <Compass className="h-3.5 w-3.5 text-amber-700" strokeWidth={2.6} />
            Explorer les métiers
            <ArrowRight className="h-3 w-3 text-mist-400" strokeWidth={2.6} />
          </Link>
        </div>
      </div>
    </div>
  );
}
