import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

// ─────────────────────────────────────────────────────────────────────────────
// Footer v2 — cream cohérent, FR, liens vers les nouvelles pages.
//
// Audit Sasha G3-Sasha-2/3 : /about, /pricing, /parrainage existent mais
// non linkés ailleurs que via URL directe. Ce footer les rend découvrables.
// ─────────────────────────────────────────────────────────────────────────────

const COLUMNS = [
  {
    label: "Plateforme",
    links: [
      { href: "/welcome", label: "Démarrer" },
      { href: "/metiers", label: "Explorer les métiers" },
      { href: "/ranking", label: "Classements" },
      { href: "/villes", label: "Talents par ville" },
      { href: "/pricing", label: "Tarifs" },
    ],
  },
  {
    label: "Talents",
    links: [
      { href: "/talent", label: "Espace Talent" },
      { href: "/qcm", label: "QCM officiels" },
      { href: "/dashboard/talent/profile", label: "Mon profil" },
      { href: "/parrainage", label: "Parrainage" },
    ],
  },
  {
    label: "Entreprises",
    links: [
      { href: "/studio", label: "Espace Entreprise" },
      { href: "/chasse", label: "Chasse de talents" },
      { href: "/qcm-builder", label: "QCM Builder" },
      { href: "/candidats", label: "Mes candidats" },
    ],
  },
  {
    label: "Maison",
    links: [
      { href: "/about", label: "À propos" },
      { href: "mailto:hello@talentrank.io", label: "Contact" },
      { href: "/parrainage", label: "Parrainer un ami" },
      { href: "/pricing", label: "FAQ" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-ink-700/8 bg-ink-850/40">
      <div className="container-page grid gap-12 py-14 md:grid-cols-[1.4fr_2fr]">
        {/* Brand block */}
        <div>
          <Logo size={36} withWordmark />
          <p className="mt-4 max-w-sm text-[13.5px] leading-relaxed text-mist-300">
            Le marché mondial des talents classés. Un métier, un classement.
            Pas de candidatures à lire. Le bounty hunter du recrutement.
          </p>
          <p className="mt-6 text-[11px] tracking-[0.16em] uppercase text-mist-400">
            © {new Date().getFullYear()} TalentRank · Conçu avec soin
          </p>
          <p className="mt-2 text-[11px] text-mist-400">
            Hébergement EU · RGPD compliant · Beta privée
          </p>
        </div>

        {/* 4 columns */}
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.label}>
              <h3 className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400">
                {col.label}
              </h3>
              <ul className="mt-4 space-y-2">
                {col.links.map((l) => (
                  <li key={`${col.label}-${l.label}`}>
                    <Link
                      href={l.href}
                      className="text-[13px] text-mist-200 hover:text-mist-50 transition"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom strip */}
      <div className="border-t border-ink-700/8">
        <div className="container-page py-5 flex flex-wrap items-center justify-between gap-3 text-[11px] text-mist-400">
          <div className="flex items-center gap-4">
            <Link href="/about" className="hover:text-mist-100 transition">
              À propos
            </Link>
            <span aria-hidden>·</span>
            <Link href="/pricing" className="hover:text-mist-100 transition">
              Tarifs
            </Link>
            <span aria-hidden>·</span>
            <Link href="/parrainage" className="hover:text-mist-100 transition">
              Parrainage
            </Link>
          </div>
          <p>
            Made with 🤠 by{" "}
            <a
              href="https://github.com/jeank"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold hover:text-mist-100 transition"
            >
              Jean-Marie Onana
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
