"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Pin, Search, Sparkles, Trophy } from "lucide-react";
import { useAudience } from "@/lib/audience/client";
import { usePinnedProfessions } from "@/lib/pinning/professions";
import { useTalentProfile } from "@/lib/profile/storage";
import { PinButton } from "./PinButton";
import { CrosshairOverlay } from "@/components/hunter/CrosshairOverlay";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// RankingDirectoryClient — l'annuaire complet.
//
// Layout :
//   1. Header   — "Un métier, un classement" + search bar
//   2. Pinned   — section "Tes métiers épinglés" (studio uniquement)
//   3. Liste    — toutes les professions, filtrables, tri pinned→popular
//
// Le studio voit le PinButton sur chaque card. Le talent voit la même liste
// mais sans pin button (il n'a pas besoin d'épingler — il a son métier).
// ─────────────────────────────────────────────────────────────────────────────

interface FlatProfession {
  id: string;
  label: string;
  frLabel: string;
  category: string;
  talentCount: number;
  topScore: number | null;
}

interface FlatCategory {
  id: string;
  frLabel: string;
  color: string;
}

interface Props {
  professions: FlatProfession[];
  categories: FlatCategory[];
}

export function RankingDirectoryClient({ professions, categories }: Props) {
  const { audience } = useAudience();
  const { pinned } = usePinnedProfessions();
  // Profil talent — pour afficher "Mon métier principal" en focus côté talent.
  // Côté studio, on garde l'exploration libre.
  const { profile } = useTalentProfile();
  const myProfessionId = audience !== "studio" ? profile.professionId : null;
  const myProfession = myProfessionId
    ? professions.find((p) => p.id === myProfessionId)
    : undefined;
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categoryById = useMemo(() => {
    const m = new Map<string, FlatCategory>();
    for (const c of categories) m.set(c.id, c);
    return m;
  }, [categories]);

  // Liste filtrée par search + catégorie
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return professions.filter((p) => {
      if (selectedCategory && p.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        p.frLabel.toLowerCase().includes(q) || p.label.toLowerCase().includes(q)
      );
    });
  }, [professions, query, selectedCategory]);

  // Pinned cards (extraction des objets correspondants)
  const pinnedCards = useMemo(() => {
    return pinned
      .map((id) => professions.find((p) => p.id === id))
      .filter((p): p is FlatProfession => p !== undefined);
  }, [pinned, professions]);

  // Tri : pinned d'abord, puis par talentCount desc
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aPinned = pinned.includes(a.id);
      const bPinned = pinned.includes(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return b.talentCount - a.talentCount;
    });
  }, [filtered, pinned]);

  return (
    <div className="container-page pt-12 pb-20">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-mist-400">
          Classements
        </p>
        <h1
          className="mt-3 font-display font-black tracking-tight text-mist-50"
          style={{
            fontSize: "clamp(2rem, 4.5vw, 3.2rem)",
            lineHeight: 1.02,
            letterSpacing: "-0.02em",
          }}
        >
          Un métier,{" "}
          <span className="relative inline-block">
            un classement.
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
        <p className="mt-5 text-[14.5px] text-mist-300 leading-relaxed">
          Pas d&apos;amalgame. Un développeur React n&apos;est jamais comparé à un
          animateur 3D — chaque métier a son podium.
          {audience === "studio" ? (
            <>
              {" "}
              <span className="font-bold text-mist-100">Épingle tes métiers cibles</span>{" "}
              pour les garder en tête.
            </>
          ) : (
            <>
              {" "}
              <span className="font-bold text-mist-100">Ton métier est en tête</span>.
              Tu peux en épingler d&apos;autres pour comparer.
            </>
          )}
        </p>

        {/* Cross-link vers la dimension ville — la 2e façon d'explorer (#51).
            Discret car le ranking par métier reste l'axe principal. */}
        <div className="mt-6 flex justify-center">
          <Link
            href="/villes"
            className="inline-flex items-center gap-1.5 rounded-full bg-white ring-1 ring-inset ring-ink-700/10 hover:ring-ink-700/25 px-3.5 py-1.5 text-[11.5px] font-bold text-mist-100 transition shadow-card hover:shadow-card-hover"
          >
            <MapPin className="h-3.5 w-3.5 text-amber-700" strokeWidth={2.6} />
            Voir aussi : talents par ville
            <ArrowRight className="h-3 w-3 text-mist-400" strokeWidth={2.6} />
          </Link>
        </div>
      </div>

      {/* Search bar */}
      <div className="mt-10 mx-auto max-w-xl">
        <div
          className="relative flex items-center gap-2 rounded-full bg-white ring-2 ring-ink-700/10 focus-within:ring-amber-300/60 transition-all duration-200 pl-5 pr-2 py-2"
          style={{
            boxShadow:
              "0 1px 0 rgba(255,255,255,0.85) inset, 0 12px 32px -16px rgba(0,0,0,0.18), 0 2px 6px -2px rgba(0,0,0,0.06)",
          }}
        >
          <Search className="h-[18px] w-[18px] text-mist-400 shrink-0" strokeWidth={2.4} />
          <input
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            placeholder="Filtrer parmi les métiers…"
            className="h-11 flex-1 bg-transparent text-[15px] text-mist-50 placeholder:text-mist-400 outline-none"
            aria-label="Filtrer les métiers"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-[11px] font-bold text-mist-400 hover:text-mist-100 px-2"
            >
              Effacer
            </button>
          )}
        </div>

        {/* Category chips */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
          <CategoryChip
            label="Toutes"
            color="#1A2535"
            active={selectedCategory === null}
            onClick={() => setSelectedCategory(null)}
          />
          {categories.map((c) => (
            <CategoryChip
              key={c.id}
              label={c.frLabel}
              color={c.color}
              active={selectedCategory === c.id}
              onClick={() => setSelectedCategory(c.id)}
            />
          ))}
        </div>
      </div>

      {/* Mon métier — talent uniquement. Demande user (#119) :
          "les talents doivent et peuvent uniquement voir le classement de leur
           metier par défaut, ils peuvent ajouter un autre metier".
          On affiche le métier principal du profil en focus, avec un CTA
          "Épingler un autre métier" qui scroll vers la liste complète. */}
      {audience !== "studio" && (
        <section className="mt-14 mx-auto max-w-3xl">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-3.5 w-3.5 text-amber-700" strokeWidth={2.6} />
            <h2 className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-amber-800">
              Mon classement métier
            </h2>
            <span className="h-px flex-1 bg-amber-200/60" />
          </div>

          {myProfession ? (
            <>
              <ProfessionCard
                profession={myProfession}
                category={categoryById.get(myProfession.category)}
                isPinned
              />
              <div className="mt-3 flex justify-center">
                <a
                  href="#tous-les-metiers"
                  className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-amber-800 hover:text-amber-900 transition"
                >
                  <Pin className="h-3 w-3" strokeWidth={2.6} />
                  Épingler un autre métier
                </a>
              </div>
            </>
          ) : (
            <div className="card-white p-6 text-center">
              <p className="text-[13.5px] text-mist-300">
                Tu n&apos;as pas encore choisi ton métier principal.
              </p>
              <Link
                href="/dashboard/talent/profile"
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-4 py-2 text-[12px] font-bold text-white hover:bg-amber-600 transition"
              >
                Choisir mon métier
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.6} />
              </Link>
            </div>
          )}
        </section>
      )}

      {/* Pinned section — visible aux 2 audiences si au moins 1 pinné.
          Studio = cibles à chasser. Talent = métiers connexes à comparer
          avec le sien (qui est déjà en focus dans la section "Mon classement
          métier" ci-dessus). */}
      {pinnedCards.length > 0 && (
        <section className="mt-14 mx-auto max-w-5xl">
          <div className="flex items-center gap-2 mb-4">
            <Pin className="h-3.5 w-3.5 text-amber-700" strokeWidth={2.6} />
            <h2 className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-amber-800">
              {audience === "studio" ? "Tes métiers épinglés" : "Mes métiers comparés"} · {pinnedCards.length}
            </h2>
            <span className="h-px flex-1 bg-amber-200/60" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pinnedCards.map((p) => (
              <ProfessionCard
                key={p.id}
                profession={p}
                category={categoryById.get(p.category)}
                isPinned
              />
            ))}
          </div>
        </section>
      )}

      {/* Full list */}
      <section id="tous-les-metiers" className="mt-14 mx-auto max-w-5xl scroll-mt-24">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-3.5 w-3.5 text-mist-400" strokeWidth={2.6} />
          <h2 className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-mist-400">
            {selectedCategory || query
              ? `${sorted.length} métier${sorted.length > 1 ? "s" : ""}`
              : audience === "studio"
                ? "Tous les métiers"
                : "Découvrir un autre métier"}
          </h2>
          <span className="h-px flex-1 bg-ink-700/10" />
        </div>

        {sorted.length === 0 ? (
          <div className="card-white p-12 text-center">
            <p className="text-[14px] text-mist-300">
              Aucun métier ne correspond à ta recherche.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sorted.map((p) => (
              <ProfessionCard
                key={p.id}
                profession={p}
                category={categoryById.get(p.category)}
                isPinned={pinned.includes(p.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Profession card ─────────────────────────────────────────────────────

function ProfessionCard({
  profession: p,
  category: cat,
  isPinned,
}: {
  profession: FlatProfession;
  category?: FlatCategory;
  isPinned: boolean;
}) {
  const color = cat?.color ?? "#94A3B8";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
      className="relative"
    >
      <Link
        href={`/ranking/${p.id}`}
        className={cn(
          "group card-white relative block overflow-hidden p-4 transition-all duration-300",
          "hover:-translate-y-0.5",
          isPinned && "ring-2 ring-amber-400/40",
        )}
        style={
          isPinned
            ? {
                boxShadow: `0 8px 24px -10px ${color}55, inset 0 1px 0 rgba(255,255,255,0.5), 0 0 0 2px ${color}30`,
              }
            : undefined
        }
      >
        {/* Crosshair viseur au hover — visible toutes audiences (bypass gate).
            Demande user : "ajoute mon cibleur sur les profiles lorsque la
            souris se place dessus". Variant minimal (juste les 4 brackets). */}
        <CrosshairOverlay accent={color} variant="minimal" bypassAudienceGate />

        {/* Halo accent */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full opacity-25 blur-2xl"
          style={{ background: color }}
        />

        <div className="relative flex items-start gap-3">
          {/* Color dot category */}
          <span
            className="mt-1 inline-grid h-9 w-9 place-items-center rounded-xl shrink-0"
            style={{
              background: `linear-gradient(160deg, ${color}30, ${color}15)`,
              color,
              boxShadow: `inset 0 0 0 1px ${color}30`,
            }}
            aria-hidden
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
          </span>

          {/* Title + meta */}
          <div className="min-w-0 flex-1">
            <p className="font-display text-[14.5px] font-black text-mist-50 leading-tight truncate">
              {p.frLabel}
            </p>
            <p className="mt-0.5 text-[11px] text-mist-400 truncate">
              <span style={{ color }}>{cat?.frLabel ?? "Autre"}</span>
              {p.talentCount > 0 && (
                <>
                  {" · "}
                  {p.talentCount} talent{p.talentCount > 1 ? "s" : ""}
                </>
              )}
            </p>
          </div>

          {/* Top score badge */}
          {p.topScore !== null && p.topScore > 0 && (
            <span
              className="inline-flex h-7 items-center gap-1 rounded-full px-2 text-[11px] font-black tabular-nums shrink-0"
              style={{
                background: "linear-gradient(180deg, #FFEAA0, #FFC800)",
                color: "#1B1208",
                boxShadow: "0 2px 0 0 rgba(201,154,0,0.6), inset 0 1px 0 rgba(255,255,255,0.5)",
              }}
              title="Top score actuel"
            >
              {p.topScore}
            </span>
          )}

          {/* Pin button (studio uniquement, géré par PinButton) */}
          <PinButton professionId={p.id} />

          {/* Arrow hint */}
          <span className="hidden sm:inline-flex text-mist-400 mt-1 shrink-0">
            <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Category chip ───────────────────────────────────────────────────────

function CategoryChip({
  label,
  color,
  active,
  onClick,
}: {
  label: string;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center rounded-full px-2.5 text-[11px] font-bold transition",
        active
          ? "text-white"
          : "bg-white text-mist-100 ring-1 ring-inset ring-ink-700/10 hover:bg-ink-850",
      )}
      style={
        active
          ? {
              background: color,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 12px -4px ${color}66`,
            }
          : undefined
      }
    >
      {label}
    </button>
  );
}
