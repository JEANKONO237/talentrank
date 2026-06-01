import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  Filter,
  Mail,
  MapPin,
  MessageSquare,
  Search,
  Sparkles,
  Target,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { ScorePill } from "@/components/ui/ScorePill";
import { AvailabilityDot } from "@/components/ui/AvailabilityDot";
import { CrosshairOverlay } from "@/components/hunter/CrosshairOverlay";
import { findCountry } from "@/lib/countries";
import { getDiscipline } from "@/lib/disciplines";
import { tierForPercentile } from "@/lib/tiers";
import { TALENTS, getTopTalents, getAvailableTalents } from "@/lib/mock-talents";

export const metadata = { title: "Dashboard recruteur — TalentRank" };

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard recruteur — version cream (refactor #38).
//
// Anciennement dark+glass+Aurora+anglais ; passée à la grammaire visuelle
// cream cohérente avec /chasse, /ranking, /villes. Garde la même structure
// pédagogique : KPI strip → brief input → talents disponibles → curated.
//
// Note : `/chasse` est la page principale studio (sidebar v3). Cette page
// reste pour back-compat des liens directs (StudioCTA, NavbarClient, etc.).
// ─────────────────────────────────────────────────────────────────────────────

export default function RecruiterDashboard() {
  const shortlist = TALENTS.slice(0, 4);
  const featured = getTopTalents(6);
  const available = getAvailableTalents().slice(0, 5);

  return (
    <div className="container-page pt-12 pb-20">
      {/* ─── Header ────────────────────────────────────────────────────── */}
      <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-mist-400 inline-flex items-center gap-1.5">
            <Target className="h-3 w-3 text-amber-700" strokeWidth={2.8} />
            Recruteur · Aurora Studios
          </p>
          <h1
            className="mt-3 font-display font-black tracking-tight text-mist-50"
            style={{
              fontSize: "clamp(1.6rem, 3.2vw, 2.2rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
            }}
          >
            Sourcer des talents classés.
          </h1>
          <p className="mt-2 text-[14px] text-mist-300">
            Construis tes shortlists, message des profils vérifiés, recrute plus vite.
          </p>
        </div>
        <Link
          href="/chasse"
          className="inline-flex h-11 items-center gap-1.5 self-start rounded-full bg-night-700 hover:bg-night-600 text-white px-5 text-[12.5px] font-bold uppercase tracking-[0.04em] transition shadow-card"
        >
          <Search className="h-4 w-4" strokeWidth={2.4} />
          Ouvrir la chasse
        </Link>
      </header>

      {/* ─── KPI row ───────────────────────────────────────────────────── */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Briefs ouverts" value="3" delta="2 en review" />
        <Kpi label="Talents sauvegardés" value="48" delta="+6 cette semaine" tone="amber" />
        <Kpi label="Shortlists" value="7" delta="2 actives" />
        <Kpi label="Temps réponse moyen" value="3.2h" delta="−12% vs mois dernier" />
      </div>

      {/* ─── Quick brief ───────────────────────────────────────────────── */}
      <section className="mt-10 card-white p-3">
        <div className="flex items-center gap-2 px-2">
          <Search className="h-[18px] w-[18px] text-mist-400 shrink-0" strokeWidth={2.4} />
          <input
            className="h-11 flex-1 bg-transparent text-[14.5px] text-mist-50 placeholder:text-mist-400 outline-none"
            placeholder="Brief en une ligne — « Senior Unreal artist, dispo, France ou remote »…"
            aria-label="Décrire le brief"
          />
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white ring-1 ring-inset ring-ink-700/10 hover:bg-ink-50 text-mist-100 px-3 text-[11.5px] font-bold transition"
          >
            <Filter className="h-3.5 w-3.5" strokeWidth={2.6} />
            Filtres
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-night-700 hover:bg-night-600 text-white px-4 text-[11.5px] font-bold transition"
          >
            Chercher
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.6} />
          </button>
        </div>
      </section>

      {/* ─── Available now ─────────────────────────────────────────────── */}
      <section className="mt-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-mist-400 inline-flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-amber-700" strokeWidth={2.8} />
              Disponibles maintenant
            </p>
            <h2 className="mt-2 font-display text-[20px] font-black tracking-tight text-mist-50">
              Prennent un brief aujourd&apos;hui.
            </h2>
          </div>
          <Link
            href="/chasse"
            className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-amber-800 hover:text-amber-900 transition"
          >
            Tout voir →
          </Link>
        </div>

        <ul className="mt-5 card-white divide-y divide-ink-700/10 overflow-hidden">
          {available.map((t) => (
            <RecruiterRow key={t.id} talent={t} />
          ))}
        </ul>
      </section>

      {/* ─── Two columns : curated + shortlist ─────────────────────────── */}
      <div className="mt-12 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-mist-400">
            Curated pour ton studio
          </p>
          <h2 className="mt-2 font-display text-[20px] font-black tracking-tight text-mist-50">
            Talents qui matchent ton dernier brief.
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {featured.slice(0, 4).map((t) => {
              const country = findCountry(t.countryCode);
              const discipline = getDiscipline(t.discipline);
              const tier = tierForPercentile(t.percentile);
              return (
                <Link
                  key={t.id}
                  href={`/talent/${t.slug}`}
                  className="group card-white relative overflow-hidden flex items-center gap-3 p-3 transition-all hover:-translate-y-0.5"
                >
                  {/* Crosshair viseur — audience studio confirme via callsite */}
                  <CrosshairOverlay accent={tier.color} variant="minimal" />
                  <Avatar
                    initials={t.initials}
                    gradient={`bg-gradient-to-br ${t.avatarGradient}`}
                    countryCode={country.code}
                    size="md"
                  />
                  <div className="min-w-0 flex-1 relative">
                    <p className="truncate font-display text-[13.5px] font-bold tracking-tight text-mist-50">
                      {t.name}
                    </p>
                    <p className="truncate text-[11.5px] text-mist-400">
                      {discipline.short} · {tier.range}
                    </p>
                  </div>
                  <ScorePill
                    score={t.score}
                    percentile={t.percentile}
                    size="sm"
                    showLabel={false}
                  />
                </Link>
              );
            })}
          </div>
        </section>

        <section>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-mist-400">
            Ta shortlist · &quot;Court cinématique — Q3&quot;
          </p>
          <h2 className="mt-2 font-display text-[20px] font-black tracking-tight text-mist-50">
            4 talents classés
          </h2>
          <ul className="mt-5 card-white divide-y divide-ink-700/10 overflow-hidden">
            {shortlist.map((t) => {
              const country = findCountry(t.countryCode);
              const discipline = getDiscipline(t.discipline);
              return (
                <li
                  key={t.id}
                  className="flex items-center gap-3 px-3 py-2.5"
                >
                  <Avatar
                    initials={t.initials}
                    gradient={`bg-gradient-to-br ${t.avatarGradient}`}
                    countryCode={country.code}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/talent/${t.slug}`}
                      className="truncate font-display text-[12.5px] font-bold text-mist-50 hover:text-amber-800 transition"
                    >
                      {t.name}
                    </Link>
                    <p className="truncate text-[10.5px] text-mist-400">
                      {discipline.short}
                    </p>
                  </div>
                  <AvailabilityDot status={t.availability} showLabel={false} />
                  <button
                    type="button"
                    aria-label={`Envoyer un message à ${t.name}`}
                    className="grid h-8 w-8 place-items-center rounded-full bg-white ring-1 ring-inset ring-ink-700/10 text-mist-300 hover:text-mist-50 hover:bg-ink-50 transition"
                  >
                    <MessageSquare className="h-3.5 w-3.5" strokeWidth={2.4} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Retirer ${t.name} de la shortlist`}
                    className="grid h-8 w-8 place-items-center rounded-full bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-300/40 hover:bg-amber-200 transition"
                  >
                    <Bookmark className="h-3.5 w-3.5" strokeWidth={2.4} fill="currentColor" />
                  </button>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            className="mt-4 w-full inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-white ring-1 ring-inset ring-ink-700/10 hover:bg-ink-50 text-mist-100 text-[11.5px] font-bold uppercase tracking-[0.04em] transition shadow-card"
          >
            <Mail className="h-3.5 w-3.5" strokeWidth={2.6} />
            Envoyer à l&apos;équipe
          </button>
        </section>
      </div>

      {/* ─── Footer hint ───────────────────────────────────────────────── */}
      <p className="mt-12 text-center text-[12px] text-mist-400 max-w-md mx-auto">
        <Sparkles className="inline-block h-3 w-3 -mt-0.5 mr-1 text-amber-600" strokeWidth={2.6} />
        Les données affichées sont des seeds beta. Quand la prod sera live, ce
        sera tes vrais briefs, ta vraie shortlist.
      </p>
    </div>
  );
}

// ─── Subcomponents ───────────────────────────────────────────────────────

function Kpi({
  label,
  value,
  delta,
  tone = "neutral",
}: {
  label: string;
  value: string;
  delta: string;
  tone?: "neutral" | "amber";
}) {
  return (
    <div className="card-white p-5 relative overflow-hidden">
      {tone === "amber" && (
        <span
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-amber-300/30 blur-2xl"
        />
      )}
      <p className="relative text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400">
        {label}
      </p>
      <p
        className="relative mt-2 font-display text-[26px] font-black tracking-tight tabular-nums"
        style={{
          color: tone === "amber" ? "#B45309" : "var(--color-mist-50, #1A2535)",
        }}
      >
        {value}
      </p>
      <p className="relative mt-1 text-[11.5px] text-mist-400">{delta}</p>
    </div>
  );
}

function RecruiterRow({ talent }: { talent: typeof TALENTS[number] }) {
  const country = findCountry(talent.countryCode);
  const discipline = getDiscipline(talent.discipline);
  const tier = tierForPercentile(talent.percentile);
  return (
    <li className="group relative grid items-center gap-3 px-4 py-3 sm:grid-cols-[auto_1.4fr_1fr_auto_auto] sm:gap-4">
      <CrosshairOverlay accent={tier.color} variant="minimal" />
      <Avatar
        initials={talent.initials}
        gradient={`bg-gradient-to-br ${talent.avatarGradient}`}
        countryCode={country.code}
        size="sm"
      />
      <div className="min-w-0 relative">
        <Link
          href={`/talent/${talent.slug}`}
          className="truncate font-display text-[13.5px] font-bold text-mist-50 hover:text-amber-800 transition"
        >
          {talent.name}
        </Link>
        <p className="truncate text-[11px] text-mist-400 inline-flex items-center gap-1">
          <span>{discipline.short}</span>
          <span aria-hidden>·</span>
          {talent.city && (
            <>
              <MapPin className="h-2.5 w-2.5" strokeWidth={2.6} />
              <span>{talent.city}</span>
            </>
          )}
          {!talent.city && <span>{country.name}</span>}
        </p>
      </div>
      <div className="hidden sm:flex items-center gap-1.5 relative">
        {talent.badges.slice(0, 2).map((b) => (
          <Badge key={b} id={b} />
        ))}
        <AvailabilityDot status={talent.availability} showLabel={false} />
      </div>
      <ScorePill
        score={talent.score}
        percentile={talent.percentile}
        size="sm"
        showLabel={false}
      />
      <div className="flex items-center gap-1.5 justify-self-end relative">
        <button
          type="button"
          aria-label={`Ajouter ${talent.name} à la shortlist`}
          className="grid h-8 w-8 place-items-center rounded-full bg-white ring-1 ring-inset ring-ink-700/10 text-mist-400 hover:text-amber-700 hover:bg-amber-50 transition"
        >
          <Bookmark className="h-3.5 w-3.5" strokeWidth={2.4} />
        </button>
        <button
          type="button"
          aria-label={`Envoyer un message à ${talent.name}`}
          className="grid h-8 w-8 place-items-center rounded-full bg-night-700 text-white hover:bg-night-600 transition"
        >
          <MessageSquare className="h-3.5 w-3.5" strokeWidth={2.4} />
        </button>
      </div>
    </li>
  );
}
