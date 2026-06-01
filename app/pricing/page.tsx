import Link from "next/link";
import { ArrowRight, Check, Sparkles, Zap } from "lucide-react";

export const metadata = {
  title: "Tarifs — TalentRank",
  description:
    "Plans Découverte (gratuit), Pro (199€/mois), Custom (sur devis). Tarifs transparents. Aucune commission sur les recrutements.",
  openGraph: {
    title: "TalentRank — Tarifs transparents.",
    description:
      "Pas de commission sur les hires. Tu paies l'outil, pas chaque recrutement.",
    images: [
      {
        url: "/api/og?audience=studio&title=Tarifs%20transparents.&subtitle=Pas%20de%20commission%20sur%20les%20hires.",
        width: 1200,
        height: 630,
        alt: "TalentRank Tarifs",
      },
    ],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "TalentRank — Tarifs transparents.",
    description: "Pas de commission. Pas de surprise.",
    images: [
      "/api/og?audience=studio&title=Tarifs%20transparents.&subtitle=Pas%20de%20commission%20sur%20les%20hires.",
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// /pricing — page dédiée tarifs (audit Sasha G3-Sasha-3).
//
// Va plus loin que le teaser de /studio :
//   - 3 plans en grille avec features détaillées
//   - Tableau comparatif features
//   - FAQ collapsible (HTML <details> — pure CSS, pas de JS state)
//   - CTAs "Démarrer gratuitement" / "Parler à l'équipe"
//
// Audience principale : studios. Mais accessible aussi aux talents (qui ont
// leur propre plan gratuit). Theme cream cohérent avec le reste de la landing.
// ─────────────────────────────────────────────────────────────────────────────

const PLANS = [
  {
    name: "Talent",
    audience: "Tu es candidat",
    price: "Gratuit",
    sub: "À vie, sans CB",
    features: [
      "Profil enrichi (photos, CV, vidéos)",
      "QCM officiel par métier",
      "Classement national + ville",
      "Badges + niveaux 1→50",
      "Tu reçois les invitations directes",
    ],
    cta: "Créer mon profil",
    href: "/welcome",
    highlight: false,
    accent: "#F59E0B",
  },
  {
    name: "Découverte",
    audience: "Tu recrutes ponctuellement",
    price: "Gratuit",
    sub: "Pour essayer",
    features: [
      "5 recherches / mois",
      "Top 10 par métier visibles",
      "1 shortlist active",
      "5 demandes d'entretien / mois",
    ],
    cta: "Démarrer gratuitement",
    href: "/welcome",
    highlight: false,
    accent: "#22D3EE",
  },
  {
    name: "Pro",
    audience: "Tu recrutes régulièrement",
    price: "199 €",
    priceSub: "/ mois",
    sub: "L'usage quotidien",
    features: [
      "Recherches illimitées",
      "17 filtres avancés",
      "QCM Builder personnalisé",
      "Shortlists, comparaisons, exports",
      "Garantie réponse < 48 h",
      "Account manager dédié",
    ],
    cta: "Essayer Pro 14 jours",
    href: "/welcome",
    highlight: true,
    accent: "#1A2535",
  },
  {
    name: "Custom",
    audience: "Studios, agences, gros volumes",
    price: "Sur devis",
    sub: "À partir de 10 hires/an",
    features: [
      "QCM custom illimités",
      "API + intégrations ATS",
      "Onboarding équipe (3-15 users)",
      "SLA dédié + support priority",
      "Branding co-marqué",
    ],
    cta: "Parler à l'équipe",
    href: "mailto:hello@talentrank.io?subject=Plan%20Custom",
    highlight: false,
    accent: "#A78BFA",
  },
] as const;

const FAQ = [
  {
    q: "Est-ce qu'il y a une commission sur les recrutements ?",
    a: "Non. Tu paies l'outil (mensuel), pas chaque hire. Pas de fee de placement. Pas de % sur le salaire. C'est ce qui nous différencie des chasseurs de têtes classiques.",
  },
  {
    q: "Comment fonctionne le QCM officiel ?",
    a: "Chaque métier a son QCM (ex : Animation 3D, Frontend React, Boulangerie). 10-15 questions calibrées sur l'expérience déclarée. Anti-cheat sérieux : verrouillé 1 mois entre deux passages, browser fingerprinting, lockout IP. Le score qui en sort détermine ta ligue (Diamant, Or, Saphir, Argent, Bronze, Nouveau).",
  },
  {
    q: "Puis-je essayer Pro sans donner ma CB ?",
    a: "Oui. 14 jours d'essai gratuit, sans CB. Si tu n'es pas convaincu, ne renseigne rien. À l'inverse, on n'envoie pas de mail de relance agressif. C'est nul.",
  },
  {
    q: "Comment vous comparez à LinkedIn ?",
    a: "LinkedIn t'oblige à lire 80 candidatures pour trouver 1 bon profil. TalentRank te montre directement les 10 meilleurs du métier, classés par un score réel anti-cheat. Pas de spam, pas de candidatures, juste la chasse.",
  },
  {
    q: "Mes données talents/recrutements sont-elles privées ?",
    a: "Oui. Le score d'un talent est public dans son classement métier, mais aucun studio ne voit qui d'autre l'a shortlisté. Côté studio, tes shortlists et recherches sont privées. RGPD-compliant, hébergement EU.",
  },
  {
    q: "C'est en beta ? C'est stable ?",
    a: "Beta privée — ce qui veut dire : on rode encore certaines features (custom QCM builder, classement par ville). Mais le cœur (QCM officiel, profils, classement par métier) est testé en interne. On annonce les changements transparente sur /about.",
  },
];

export default function PricingPage() {
  return (
    <div className="container-page pt-12 pb-20">
      {/* Header */}
      <header className="max-w-3xl mx-auto text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-mist-400">
          Tarifs · Transparence totale
        </p>
        <h1
          className="mt-4 font-display font-black tracking-tight text-mist-50"
          style={{
            fontSize: "clamp(2.4rem, 5.5vw, 4rem)",
            lineHeight: 1.02,
            letterSpacing: "-0.025em",
          }}
        >
          Pas de surprise.{" "}
          <span className="relative inline-block">
            Pas de commission.
            <span
              aria-hidden
              className="absolute left-0 right-0 -bottom-1 sm:-bottom-1.5 h-[6px] rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, rgba(28,176,246,0.3) 0%, rgba(28,176,246,0.65) 50%, rgba(28,176,246,0.3) 100%)",
              }}
            />
          </span>
        </h1>
        <p className="mt-7 text-[15px] sm:text-[16px] text-mist-300 leading-relaxed">
          Le talent reste <strong>gratuit à vie</strong>. Le studio paie
          l&apos;outil (mensuel), pas chaque hire.
          <br />
          Engagement zéro, annulation 1 clic.
        </p>
      </header>

      {/* Plans grid */}
      <section className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
        {PLANS.map((plan, i) => (
          <article
            key={plan.name}
            className={
              plan.highlight
                ? "relative rounded-[24px] p-6 ring-2 bg-white overflow-hidden"
                : "card-white p-6"
            }
            style={
              plan.highlight
                ? {
                    boxShadow:
                      "0 24px 60px -16px rgba(26,37,53,0.4), inset 0 1px 0 rgba(255,255,255,0.55), 0 0 0 2px #1A2535",
                  }
                : undefined
            }
          >
            {plan.highlight && (
              <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-night-700 px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.18em] text-white">
                <Zap className="h-3 w-3" strokeWidth={2.8} />
                Recommandé
              </span>
            )}

            <p
              className="text-[10.5px] font-bold uppercase tracking-[0.18em]"
              style={{ color: plan.accent }}
            >
              {plan.name}
            </p>
            <p className="mt-0.5 text-[11px] text-mist-400 italic">{plan.audience}</p>

            <div className="mt-3 flex items-baseline gap-1">
              <span
                className="font-display text-[28px] font-black leading-none tabular-nums"
                style={{ color: plan.highlight ? "#1A2535" : "#1B1208" }}
              >
                {plan.price}
              </span>
              {"priceSub" in plan && plan.priceSub && (
                <span className="text-[12px] text-mist-400 font-medium">{plan.priceSub}</span>
              )}
            </div>
            <p className="mt-0.5 text-[11.5px] text-mist-400 italic">{plan.sub}</p>

            <ul className="mt-4 space-y-1.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[12px] text-mist-100 leading-snug">
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
                    <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                  </span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Link
              href={plan.href}
              className={
                plan.highlight
                  ? "btn-night mt-5 w-full"
                  : "btn-glass mt-5 w-full"
              }
              style={
                plan.highlight
                  ? undefined
                  : {
                      color: plan.accent,
                      boxShadow: `inset 0 0 0 1px ${plan.accent}33`,
                    }
              }
            >
              {plan.cta}
            </Link>
          </article>
        ))}
      </section>

      {/* Comparison summary */}
      <section className="mt-20 max-w-3xl mx-auto card-white p-7">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400 text-center">
          Comparaison rapide
        </p>
        <h2 className="mt-2 font-display text-[20px] font-black text-mist-50 text-center">
          Découverte vs Pro
        </h2>
        <table className="mt-6 w-full text-[13px]">
          <thead>
            <tr className="border-b border-ink-700/10">
              <th className="text-left font-bold text-mist-400 text-[10.5px] uppercase tracking-[0.14em] pb-2">
                Feature
              </th>
              <th className="text-center font-bold text-mist-400 text-[10.5px] uppercase tracking-[0.14em] pb-2">
                Découverte
              </th>
              <th className="text-center font-bold text-night-700 text-[10.5px] uppercase tracking-[0.14em] pb-2">
                Pro
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-700/8">
            {[
              ["Recherches / mois", "5", "Illimité"],
              ["Top par métier", "Top 10", "Tout"],
              ["Shortlists actives", "1", "Illimité"],
              ["Filtres avancés", "❌", "17 filtres"],
              ["QCM Builder", "❌", "✅"],
              ["Comparaison talents", "❌", "✅"],
              ["Garantie réponse", "Standard", "< 48 h"],
              ["Account manager", "❌", "✅"],
            ].map(([feat, free, pro]) => (
              <tr key={feat}>
                <td className="py-2.5 text-mist-100">{feat}</td>
                <td className="py-2.5 text-center text-mist-400">{free}</td>
                <td className="py-2.5 text-center font-bold text-mist-50">{pro}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* FAQ */}
      <section className="mt-20 max-w-2xl mx-auto">
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.22em] text-mist-400">
          Questions fréquentes
        </p>
        <h2 className="mt-3 text-center font-display text-[24px] sm:text-[28px] font-black text-mist-50 tracking-tight">
          On t&apos;a vu venir.
        </h2>

        <div className="mt-8 space-y-2">
          {FAQ.map((item, i) => (
            <details
              key={i}
              className="group card-white p-5 cursor-pointer"
            >
              <summary className="flex items-start justify-between gap-3 list-none">
                <span className="font-display text-[14.5px] font-black text-mist-50 leading-tight">
                  {item.q}
                </span>
                <span
                  aria-hidden
                  className="grid h-6 w-6 place-items-center rounded-full bg-ink-850 text-mist-400 text-[14px] font-bold leading-none shrink-0 transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-[13px] text-mist-300 leading-relaxed">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mt-20 max-w-2xl mx-auto text-center">
        <h2
          className="font-display font-black tracking-tight text-mist-50"
          style={{
            fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}
        >
          Une question ?
        </h2>
        <p className="mt-3 text-[14px] text-mist-300">
          Écris-nous directement :{" "}
          <a
            href="mailto:hello@talentrank.io"
            className="font-bold text-night-700 underline decoration-amber-300 decoration-2 underline-offset-4"
          >
            hello@talentrank.io
          </a>
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/welcome" className="btn-night group">
            Démarrer maintenant
            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
              strokeWidth={2.6}
            />
          </Link>
          <Link href="/about" className="btn-glass" style={{ color: "#1A2535" }}>
            Qui est derrière ?
          </Link>
        </div>
        <p className="mt-5 text-[11px] text-mist-400">
          <Sparkles className="inline-block h-3 w-3 -mt-0.5 mr-1 text-amber-600" strokeWidth={2.6} />
          Aucune commission · Aucun engagement · Annulation 1 clic
        </p>
      </section>
    </div>
  );
}

// Note: `cn`, `Pill`, `ButtonLink` plus utilisés depuis le rewrite cream
