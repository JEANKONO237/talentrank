"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Zap } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// PricingTeaser — modèle économique transparent côté studio.
//
// 3 plans : Découverte (free, 5 recherches), Pro (mensuel), Custom (Enterprise).
// Sobriété : pas de "GROS PROMO LIMITED OFFER", juste les faits.
// ─────────────────────────────────────────────────────────────────────────────

const PLANS = [
  {
    name: "Découverte",
    price: "Gratuit",
    sub: "Pour essayer le moteur",
    features: [
      "5 recherches par mois",
      "Voir les Top 10 par métier",
      "Demandes d'entretien limitées",
    ],
    cta: "Démarrer gratuitement",
    href: "/auth/sign-up?role=studio&plan=free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "199 €",
    priceSub: "/ mois",
    sub: "L'usage quotidien",
    features: [
      "Recherches illimitées",
      "Tous les filtres avancés",
      "QCM Builder personnalisé",
      "Shortlists, comparaisons, exports",
      "Garantie réponse < 48 h",
    ],
    cta: "Essayer Pro 14 jours",
    href: "/auth/sign-up?role=studio&plan=pro",
    highlight: true,
  },
  {
    name: "Custom",
    price: "Sur devis",
    sub: "Studios, agences, gros volumes",
    features: [
      "QCM custom illimités",
      "API + intégrations ATS",
      "Account manager dédié",
      "Onboarding équipe",
    ],
    cta: "Parler à l'équipe",
    href: "/contact?plan=custom",
    highlight: false,
  },
];

export function PricingTeaser() {
  return (
    <section className="relative py-24 sm:py-28 bg-ink-850">
      <div className="container-page">
        <div className="text-center max-w-2xl mx-auto">
          <h2
            className="font-display font-black tracking-tight text-mist-50"
            style={{
              fontSize: "clamp(2rem, 4.5vw, 3.2rem)",
              lineHeight: 1.02,
              letterSpacing: "-0.02em",
            }}
          >
            Tarifs transparents.{" "}
            <span className="relative inline-block">
              Pas de surprise.
              <span
                aria-hidden
                className="absolute left-0 right-0 -bottom-1 sm:-bottom-1.5 h-[4px] sm:h-[5px] rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(26,37,53,0.28) 0%, rgba(26,37,53,0.55) 50%, rgba(26,37,53,0.28) 100%)",
                }}
              />
            </span>
          </h2>
          <p className="mt-6 text-[14.5px] text-mist-300 max-w-xl mx-auto">
            Commence gratuitement. Passe Pro quand tu en as besoin. Aucun
            engagement long.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan, i) => (
            <motion.article
              key={plan.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.2, 0.7, 0.2, 1] }}
              className={
                plan.highlight
                  ? "relative rounded-[24px] p-7 ring-2 ring-night-700 bg-white shadow-card overflow-hidden"
                  : "card-white p-7"
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
                  Le plus choisi
                </span>
              )}

              <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400">
                {plan.name}
              </p>
              <div className="mt-2 flex items-baseline gap-1">
                <span
                  className="font-display text-[36px] font-black leading-none tabular-nums"
                  style={{ color: plan.highlight ? "#1A2535" : "#1B1208" }}
                >
                  {plan.price}
                </span>
                {plan.priceSub && (
                  <span className="text-[12.5px] text-mist-400 font-medium">
                    {plan.priceSub}
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-[12.5px] text-mist-400 italic">{plan.sub}</p>

              <ul className="mt-5 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[12.5px] text-mist-100">
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
                    ? "btn-night mt-7 w-full"
                    : "btn-glass mt-7 w-full"
                }
                style={
                  plan.highlight
                    ? undefined
                    : { color: "#1A2535", boxShadow: "inset 0 0 0 1px rgba(26,37,53,0.25)" }
                }
              >
                {plan.cta}
              </Link>
            </motion.article>
          ))}
        </div>

        <p className="mt-10 text-center text-[11.5px] text-mist-400 max-w-md mx-auto">
          Aucune commission sur les recrutements. Tu paies l&apos;outil, pas
          chaque hire.
        </p>
      </div>
    </section>
  );
}
