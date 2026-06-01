import Link from "next/link";
import {
  ArrowUpRight,
  Crown,
  ExternalLink,
  Globe2,
  Share2,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { sitemapStats } from "@/app/sitemap";
import { TALENTS } from "@/lib/mock-talents";
import { PROFESSIONS } from "@/lib/professions";
import { getCities } from "@/lib/cities";

// Server-safe equivalent of isAnalyticsEnabled() — appel direct à process.env
// (le helper client-side de lib/analytics/posthog.ts n'est pas appelable
// depuis un Server Component).
const ANALYTICS_ON = Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);

export const metadata = { title: "NSM Dashboard — TalentRank Admin" };

// ─────────────────────────────────────────────────────────────────────────────
// /admin/nsm — North Star Metric dashboard (Eli #1).
//
// Définition du NSM TalentRank :
//   « Talents avec score officiel ≥ 50 partagés au moins 1 fois »
//
// Ce dashboard expose :
//   1. La SOURCE DE VÉRITÉ — un lien direct vers PostHog (où les events
//      arrivent en live). Pas d'agrégation custom server-side : on délègue.
//   2. Les "denominators" structurels — combien de pages indexées, combien
//      de talents seed, combien de métiers, combien de villes. Ça contextualise
//      les chiffres PostHog.
//   3. Le catalogue d'events trackés + les queries pré-conçues à coller dans
//      PostHog Insights.
//
// Cette page suit l'audit Erin G3-Erin-4 : transparence sur les chiffres. Les
// "denominators" sont des chiffres REELS issus de la codebase (pas de fake).
// ─────────────────────────────────────────────────────────────────────────────

const POSTHOG_URL = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.posthog.com";

interface EventDoc {
  name: string;
  description: string;
  phase: "discovery" | "qcm" | "profile" | "viral" | "studio";
}

const EVENT_CATALOGUE: EventDoc[] = [
  { name: "welcome_audience_chosen", phase: "discovery", description: "Choix initial sur /welcome. Top-of-funnel." },
  { name: "landing_cta_clicked", phase: "discovery", description: "Click sur un CTA de landing — granularité par cta." },
  { name: "qcm_started", phase: "qcm", description: "Démarrage d'un QCM (intent, avant async)." },
  { name: "qcm_completed", phase: "qcm", description: "Result page chargée. NSM input #1." },
  { name: "profile_published", phase: "profile", description: "Profil publié avec %complétion. NSM input #2." },
  { name: "score_shared", phase: "viral", description: "Partage du score via Twitter/LinkedIn/copy. NSM input #3." },
  { name: "embed_copied", phase: "viral", description: "Snippet embed copié — variant + theme + snippet_type." },
  { name: "referral_link_copied", phase: "viral", description: "Lien parrainage copié." },
  { name: "referral_invite_sent", phase: "viral", description: "Invitation envoyée — Twitter/WhatsApp/email." },
  { name: "profession_pinned", phase: "viral", description: "Métier épinglé — par audience." },
  { name: "talent_shortlisted", phase: "studio", description: "Studio ajoute un talent à sa file." },
  { name: "talent_followed", phase: "studio", description: "Studio suit un talent (veille)." },
  { name: "interview_proposal_sent", phase: "studio", description: "Proposition d'entretien envoyée." },
  { name: "waitlist_signup", phase: "discovery", description: "Inscription waitlist par feature_id." },
  { name: "custom_qcm_created", phase: "studio", description: "Nouveau QCM créé dans le builder." },
  { name: "custom_qcm_published", phase: "studio", description: "QCM custom publié (cosmetic flag local pour l'instant)." },
];

const PHASE_LABEL: Record<EventDoc["phase"], string> = {
  discovery: "Discovery",
  qcm: "QCM (cœur)",
  profile: "Profil",
  viral: "Viral",
  studio: "Studio",
};

const PHASE_COLOR: Record<EventDoc["phase"], string> = {
  discovery: "#6366F1",
  qcm: "#22D3EE",
  profile: "#10B981",
  viral: "#F59E0B",
  studio: "#A78BFA",
};

export default function NsmDashboardPage() {
  const stats = sitemapStats();
  const cities = getCities();
  const analyticsOn = ANALYTICS_ON;

  const grouped = EVENT_CATALOGUE.reduce<Record<EventDoc["phase"], EventDoc[]>>(
    (acc, e) => {
      (acc[e.phase] ??= []).push(e);
      return acc;
    },
    {} as Record<EventDoc["phase"], EventDoc[]>,
  );

  return (
    <div className="container-page pt-12 pb-20 max-w-5xl">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-mist-400 inline-flex items-center gap-1.5">
        <Target className="h-3 w-3 text-amber-700" strokeWidth={2.8} />
        Admin · NSM Dashboard
      </p>
      <h1
        className="mt-3 font-display font-black tracking-tight text-mist-50"
        style={{
          fontSize: "clamp(2rem, 4.5vw, 3rem)",
          lineHeight: 1.02,
          letterSpacing: "-0.025em",
        }}
      >
        North Star Metric
      </h1>
      <div className="mt-4 card-white p-5 relative overflow-hidden">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-300/30 blur-3xl"
        />
        <p className="relative text-[10.5px] font-bold uppercase tracking-[0.18em] text-amber-800 inline-flex items-center gap-1.5">
          <Crown className="h-3 w-3" strokeWidth={2.8} />
          Définition (Eli)
        </p>
        <p className="relative mt-2 font-display text-[18px] font-black text-mist-50 leading-snug">
          « Talents avec score officiel ≥ 50 partagés au moins 1 fois »
        </p>
        <p className="relative mt-2 text-[13px] text-mist-300 leading-relaxed">
          Mesure la <strong>traction réelle</strong> du produit : QCM passé +
          score honorable + viralité activée. Si ce chiffre ne monte pas, le
          reste est du bruit.
        </p>
      </div>

      {/* PostHog access */}
      <section className="mt-8">
        <h2 className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400 mb-4">
          Source de vérité
        </h2>
        {analyticsOn ? (
          <a
            href={POSTHOG_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="card-white block p-5 hover:-translate-y-0.5 transition-all relative overflow-hidden"
          >
            <div className="flex items-center gap-4">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100 ring-1 ring-inset ring-emerald-300/40 shrink-0">
                <Sparkles className="h-5 w-5 text-emerald-700" strokeWidth={2.4} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-emerald-800">
                  PostHog · Activé
                </p>
                <p className="mt-0.5 font-display text-[15px] font-black tracking-tight text-mist-50">
                  Ouvrir le dashboard live
                </p>
                <p className="mt-0.5 text-[12px] text-mist-400">
                  Funnels, retention cohorts, raw events. Tous les chiffres
                  réels sont là.
                </p>
              </div>
              <ExternalLink className="h-4 w-4 text-mist-400 shrink-0" strokeWidth={2.6} />
            </div>
          </a>
        ) : (
          <div className="card-white p-5">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400">
              PostHog · Non configuré
            </p>
            <p className="mt-2 text-[13px] text-mist-300">
              Ajoute <code className="font-mono text-[11.5px] bg-ink-50 ring-1 ring-inset ring-ink-700/10 rounded px-1.5 py-0.5">NEXT_PUBLIC_POSTHOG_KEY</code>{" "}
              dans <code className="font-mono text-[11.5px] bg-ink-50 ring-1 ring-inset ring-ink-700/10 rounded px-1.5 py-0.5">.env.local</code>{" "}
              et installe le SDK : <code className="font-mono text-[11.5px] bg-ink-50 ring-1 ring-inset ring-ink-700/10 rounded px-1.5 py-0.5">npm i posthog-js</code>
            </p>
          </div>
        )}
      </section>

      {/* Structural stats */}
      <section className="mt-10">
        <h2 className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400 mb-4">
          Denominators structurels
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat
            icon={Globe2}
            label="URLs indexables"
            value={stats.totalUrls}
            sub={`dont ${stats.cityProfessionCombos} pages SEO long-tail`}
          />
          <Stat
            icon={Trophy}
            label="Talents seed"
            value={TALENTS.length}
            sub="profils beta avec score réel"
          />
          <Stat
            icon={Target}
            label="Métiers couverts"
            value={PROFESSIONS.length}
            sub="chacun avec son ranking"
          />
          <Stat
            icon={Share2}
            label="Villes recensées"
            value={cities.length}
            sub="dimension géo activée"
          />
        </div>
      </section>

      {/* Event catalogue */}
      <section className="mt-10">
        <h2 className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400 mb-4">
          Catalogue d&apos;events trackés
        </h2>
        <div className="space-y-4">
          {(["discovery", "qcm", "profile", "viral", "studio"] as const).map(
            (phase) => (
              <div key={phase}>
                <p
                  className="text-[10.5px] font-bold uppercase tracking-[0.14em] mb-2"
                  style={{ color: PHASE_COLOR[phase] }}
                >
                  {PHASE_LABEL[phase]}
                </p>
                <ul className="card-white divide-y divide-ink-700/10 overflow-hidden">
                  {(grouped[phase] ?? []).map((e) => (
                    <li
                      key={e.name}
                      className="flex items-start gap-3 px-4 py-3"
                    >
                      <span
                        className="mt-0.5 inline-block h-2 w-2 rounded-full shrink-0"
                        style={{ background: PHASE_COLOR[phase] }}
                      />
                      <div className="min-w-0 flex-1">
                        <code className="font-mono text-[12.5px] font-bold text-mist-50">
                          {e.name}
                        </code>
                        <p className="mt-0.5 text-[12px] text-mist-300 leading-snug">
                          {e.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ),
          )}
        </div>
      </section>

      {/* PostHog query examples */}
      <section className="mt-10">
        <h2 className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400 mb-4">
          Queries pré-conçues (à coller dans PostHog Insights)
        </h2>
        <div className="space-y-3">
          <QueryCard
            title="NSM hebdo"
            description="Talents distincts avec un qcm_completed (score ≥ 50) ET un score_shared dans les 7 derniers jours."
            query={`Funnel:
  Step 1 → qcm_completed where score >= 50
  Step 2 → score_shared

Time : Last 7 days
Group by : distinct_id`}
          />
          <QueryCard
            title="Funnel d'entrée"
            description="Du welcome au QCM completed. Mesure le drop-off de l'onboarding."
            query={`Funnel:
  Step 1 → welcome_audience_chosen
  Step 2 → qcm_started
  Step 3 → qcm_completed

Time : Last 30 days`}
          />
          <QueryCard
            title="Distribution des canaux de share"
            description="Quel canal (Twitter/LinkedIn/copy) génère le plus de partages ?"
            query={`Event : score_shared
Breakdown : channel
Time : Last 30 days
Display : Bar chart`}
          />
          <QueryCard
            title="Adoption de l'embed"
            description="Quel snippet est le plus copié — orientera la doc future."
            query={`Event : embed_copied
Breakdown : snippet_type
Time : Last 30 days`}
          />
        </div>
      </section>

      {/* Hint */}
      <p className="mt-12 text-center text-[11.5px] text-mist-400 max-w-md mx-auto">
        <Sparkles className="inline-block h-3 w-3 -mt-0.5 mr-1 text-amber-600" strokeWidth={2.6} />
        Cette page est statique côté serveur — elle ne fait pas de query PostHog
        en live. Pour les chiffres temps réel, utilise PostHog directement.
      </p>

      {/* Back */}
      <div className="mt-8 text-center">
        <Link
          href="/admin/flags"
          className="inline-flex items-center gap-1.5 text-[12px] font-bold text-mist-400 hover:text-mist-50 transition"
        >
          ← Admin flags
          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.6} />
        </Link>
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function Stat({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: number | string;
  sub: string;
}) {
  return (
    <div className="card-white p-4">
      <div className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-mist-400">
        <Icon className="h-3 w-3" strokeWidth={2.6} />
        {label}
      </div>
      <p className="mt-2 font-display text-[26px] font-black tracking-tight text-mist-50 tabular-nums">
        {value}
      </p>
      <p className="mt-0.5 text-[11px] text-mist-400 leading-snug">{sub}</p>
    </div>
  );
}

function QueryCard({
  title,
  description,
  query,
}: {
  title: string;
  description: string;
  query: string;
}) {
  return (
    <div className="card-white p-5">
      <p className="font-display text-[14px] font-black text-mist-50">{title}</p>
      <p className="mt-1 text-[12.5px] text-mist-300 leading-snug">{description}</p>
      <pre className="mt-3 rounded-xl bg-ink-50 ring-1 ring-inset ring-ink-700/10 p-3 text-[11.5px] font-mono text-mist-100 whitespace-pre-wrap">
        {query}
      </pre>
    </div>
  );
}
