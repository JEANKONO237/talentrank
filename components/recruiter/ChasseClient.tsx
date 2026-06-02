"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  MessageSquarePlus,
  Pin,
  PinOff,
  Search,
  Target,
  X,
} from "lucide-react";
import { ClassPicker } from "./ClassPicker";
import { ProfessionPicker } from "./ProfessionPicker";
import { ProposeInterviewModal } from "./ProposeInterviewModal";
import { AvatarChip } from "@/components/ui/AvatarChip";
import { TierEmblem } from "@/components/ui/TierEmblem";
import { ExperienceBadge } from "@/components/ui/ExperienceBadge";
import { AvailabilityDot } from "@/components/ui/AvailabilityDot";
import { CanvasRevealEffect } from "@/components/ui/canvas-reveal";
import { Flag } from "@/components/ui/Flag";
import { SmartBackButton } from "@/components/ui/SmartBackButton";
import {
  EXPERIENCE_CLASSES,
  EXPERIENCE_ORDER,
  type ExperienceClassId,
  experienceClassForYears,
} from "@/lib/experience-class";
import { findCountry } from "@/lib/countries";
import { getDiscipline } from "@/lib/disciplines";
import {
  PROFESSIONS,
  PROFESSION_CATEGORIES,
  normalizeName,
  type ProfessionCategoryId,
} from "@/lib/professions";
import { iconForCategory } from "@/lib/profession-icons";
import { tierForPercentile } from "@/lib/tiers";
import { togglePin, usePinnedProfessions } from "@/lib/pinning/professions";
import {
  TALENTS,
  talentProfessionId,
  type Talent,
  type Availability,
  type WorkMode,
  type ContractType,
} from "@/lib/mock-talents";
import { cn } from "@/lib/utils";

interface Props {
  initialClass: ExperienceClassId | null;
  /** FIX-7 : métier pré-sélectionné depuis ?profession=X (search /studio). */
  initialProfession?: string | null;
}

type Step = "class" | "profession" | "class-for-profession" | "results";

export function ChasseClient({ initialClass, initialProfession = null }: Props) {
  const [pickedClass, setPickedClass] = useState<ExperienceClassId | null>(initialClass);
  // FIX-7 : si on arrive avec ?profession=X depuis la search studio, on
  // skip directement à l'étape "class-for-profession" (cartes de classes
  // avec compteurs pour ce métier). Plus de double recherche.
  const [pickedProfession, setPickedProfession] = useState<string | null>(
    initialProfession,
  );

  // Logique du flow :
  //  - QuickSearch (métier choisi en premier) → class-for-profession
  //    (cartes de classes avec compteurs de profils par niveau)
  //  - Flow guidé classique → class → profession → results
  const step: Step = !pickedClass
    ? pickedProfession
      ? "class-for-profession"
      : "class"
    : !pickedProfession
      ? "profession"
      : "results";

  return (
    <div className="relative isolate min-h-screen overflow-hidden">
      {/* Animated dot-matrix bg — changes colour per step.
          Plain div with `key={step}` to remount the canvas (and replay the
          intro animation) when the step changes. */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div key={step} className="absolute inset-0 animate-rise-in">
          <CanvasRevealEffect
            colors={
              step === "class"
                ? [[255, 138, 0], [255, 200, 0]]
                : step === "profession"
                ? [[28, 176, 246], [88, 204, 2]]
                : [[88, 204, 2], [28, 176, 246]]
            }
            dotSize={3}
            animationSpeed={0.7}
            showGradient
          />
        </div>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,251,241,0.4) 0%, rgba(255,251,241,0.65) 40%, rgba(255,251,241,0.9) 100%)",
          }}
        />
      </div>

      <div className="container-page relative pt-12 pb-20">
        {/* Retour intelligent — fallback vers le dashboard studio. */}
        <SmartBackButton fallbackHref="/studio" label="Retour" />

        {/* ─── Entrée (étape 1) : 3 façons d'arriver aux profils ─────────
            1. Exploration par rayon (FIX-8) — comme dans un supermarché
            2. Recherche rapide texte
            3. Métiers épinglés
            4. (Ou le flow guidé Classe → Métier juste en dessous) */}
        {step === "class" && (
          <div className="mt-6 mb-10 max-w-5xl mx-auto">
            <CategoryAisles
              onPickProfession={(professionId) => setPickedProfession(professionId)}
            />
            <div className="mt-8 max-w-3xl mx-auto">
              <QuickProfessionSearch
                onPick={(professionId) => {
                  // FIX-4 : on ne fixe PAS la classe — on laisse l'utilisateur
                  // choisir parmi les 6 niveaux, avec compteur par niveau pour
                  // ce métier (step "class-for-profession").
                  setPickedProfession(professionId);
                }}
              />
              <PinnedProfessionsSection
                onPick={(professionId) => {
                  setPickedProfession(professionId);
                }}
              />
            </div>
          </div>
        )}

        <Stepper current={step} />

        {/* Conditional rendering — no AnimatePresence (was causing the step-2
            content to be stuck at opacity 0 on transition). Each step uses
            the `animate-rise-in` Tailwind keyframe for a soft fade-up. */}
        {step === "class" && (
          <div key="class-step" className="animate-rise-in">
            <StepHeader
              eyebrow="Ou choisis pas à pas · Étape 1 sur 3"
              title="Quelle classe cherches-tu ?"
              subtitle="Du Junior au Maître absolu. Choisis le niveau d'expérience."
            />
            <div className="mt-12 flex justify-center">
              <ClassPicker onSelect={setPickedClass} />
            </div>
          </div>
        )}

        {/* ─── Step "class-for-profession" (FIX-4) ───────────────────────
            Métier choisi via QuickSearch ou Pin → on demande la classe avec
            un compteur de talents disponibles par niveau pour CE métier.
            Un seul clic sur une carte = avance direct aux résultats. */}
        {step === "class-for-profession" && pickedProfession && (
          <div key="class-for-profession-step" className="animate-rise-in">
            <div className="text-center mb-6">
              <button
                onClick={() => setPickedProfession(null)}
                className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-mist-300 hover:text-mist-50"
              >
                <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.4} />
                Métier :{" "}
                {PROFESSIONS.find((p) => p.id === pickedProfession)?.frLabel ??
                  "Inconnu"}{" "}
                — changer
              </button>
            </div>
            <StepHeader
              eyebrow="Quel niveau cherches-tu ?"
              title={`${
                PROFESSIONS.find((p) => p.id === pickedProfession)?.frLabel ??
                ""
              }`}
              subtitle="Clique sur un niveau — tu arrives directement sur les profils."
            />
            <div className="mt-10 max-w-5xl mx-auto">
              <ClassCardsGrid
                professionId={pickedProfession}
                onSelect={setPickedClass}
              />
            </div>
          </div>
        )}

        {step === "profession" && pickedClass && (
          <div key="profession-step" className="animate-rise-in">
            <div className="text-center mb-6">
              <button
                onClick={() => setPickedClass(null)}
                className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-mist-300 hover:text-mist-50"
              >
                <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.4} />
                Classe : {EXPERIENCE_CLASSES[pickedClass].seniority} — changer
              </button>
            </div>
            <StepHeader
              eyebrow="Étape 2 sur 3"
              title="Quel métier cherches-tu ?"
              subtitle="Une seule réponse. On ne te montrera QUE des profils de ce métier."
            />
            <div className="mt-10 flex justify-center">
              <ProfessionPicker onSelect={setPickedProfession} classId={pickedClass} />
            </div>
          </div>
        )}

        {step === "results" && pickedClass && pickedProfession && (
          <div key="results-step" className="animate-rise-in">
            <ResultsStep
              classId={pickedClass}
              professionId={pickedProfession}
              onChangeClass={() => {
                setPickedClass(null);
                setPickedProfession(null);
              }}
              onChangeProfession={() => setPickedProfession(null)}
              // FIX-5 : switch direct de classe sans revenir aux étapes
              onPickClass={(c) => setPickedClass(c)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Stepper ──────────────────────────────────────────────────────────────
function Stepper({ current }: { current: Step }) {
  // Le flow "class-for-profession" inverse Métier ↔ Classe.
  // On adapte les labels du Stepper en conséquence pour rester clair.
  const isProfFirst = current === "class-for-profession";
  const steps: { id: Step; label: string }[] = isProfFirst
    ? [
        { id: "class-for-profession", label: "Métier" },
        { id: "class-for-profession", label: "Niveau" },
        { id: "results", label: "Profils" },
      ]
    : [
        { id: "class", label: "Classe" },
        { id: "profession", label: "Métier" },
        { id: "results", label: "Profils" },
      ];
  // Pour le mode prof-first, on est toujours sur "Niveau" (étape 2)
  const currentIdx = isProfFirst
    ? 1
    : steps.findIndex((s) => s.id === current);

  return (
    <div className="mx-auto mb-8 flex max-w-md items-center gap-2">
      {steps.map((s, i) => {
        const isPast = i < currentIdx;
        const isActive = i === currentIdx;
        return (
          <div key={s.id} className="flex flex-1 items-center gap-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "grid h-7 w-7 place-items-center rounded-full font-display text-[12px] font-bold transition-colors",
                  isPast
                    ? "bg-duo-green text-white"
                    : isActive
                    ? "bg-duo-blue text-white"
                    : "bg-ink-850 text-mist-400 ring-1 ring-ink-700/40",
                )}
              >
                {isPast ? "✓" : i + 1}
              </span>
              <span
                className={cn(
                  "text-[11px] font-bold uppercase tracking-[0.14em] whitespace-nowrap",
                  isActive ? "text-mist-50" : isPast ? "text-duo-green-deep" : "text-mist-400",
                )}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span
                className={cn(
                  "h-0.5 flex-1 rounded-full transition-colors",
                  isPast ? "bg-duo-green" : "bg-ink-700/40",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-mist-400">{eyebrow}</p>
      <h1 className="mt-3 font-display text-[36px] sm:text-[44px] font-black tracking-tight text-mist-50">{title}</h1>
      {subtitle && <p className="mt-4 text-[15px] text-mist-300">{subtitle}</p>}
    </div>
  );
}

// ─── Step 3: results filtered EXACTLY by profession ───────────────────────
interface ResultsProps {
  classId: ExperienceClassId;
  professionId: string;
  onChangeClass: () => void;
  onChangeProfession: () => void;
  /** FIX-5 : switch direct vers une autre classe sans repasser par les étapes. */
  onPickClass: (classId: ExperienceClassId) => void;
}

function ResultsStep({
  classId,
  professionId,
  onChangeClass,
  onChangeProfession,
  onPickClass,
}: ResultsProps) {
  const cls = EXPERIENCE_CLASSES[classId];
  const profession = PROFESSIONS.find((p) => p.id === professionId);

  const [country, setCountry] = useState<string | "all">("all");
  const [city, setCity] = useState<string | "all">("all");
  const [availability, setAvailability] = useState<Availability | "all">("all");
  const [workMode, setWorkMode] = useState<WorkMode | "all">("all");
  const [contract, setContract] = useState<ContractType | "all">("all");
  const [minScore, setMinScore] = useState(0);
  const [showRefine, setShowRefine] = useState(false);

  const [proposeTalent, setProposeTalent] = useState<{
    id: string; name: string; roleLabel: string; initials: string; gradient: string;
  } | null>(null);

  const matching = useMemo(() => {
    return TALENTS.filter((t) => {
      // Strict: the canonical profession id MUST equal the picked one.
      if (talentProfessionId(t) !== professionId) return false;
      if (experienceClassForYears(t.yearsExperience).id !== classId) return false;
      if (country !== "all" && t.countryCode !== country) return false;
      if (city !== "all" && (t.city ? !t.city.toLowerCase().includes(city.toLowerCase()) : true)) return false;
      if (availability !== "all" && t.availability !== availability) return false;
      if (workMode !== "all" && t.workMode !== workMode) return false;
      if (contract !== "all" && t.contractType !== contract) return false;
      if (minScore > 0 && t.score < minScore) return false;
      return true;
    }).sort((a, b) => b.score - a.score);
  }, [classId, professionId, country, city, availability, workMode, contract, minScore]);

  const cities = useMemo(
    () =>
      Array.from(
        new Set(TALENTS.flatMap((t) => (t.city ? [t.city.split("/")[0].trim()] : []))),
      ).sort(),
    [],
  );

  const topCountries = useMemo(() => {
    const c = new Map<string, number>();
    TALENTS.forEach((t) => c.set(t.countryCode, (c.get(t.countryCode) ?? 0) + 1));
    return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k]) => k);
  }, []);

  if (!profession) {
    return (
      <div className="rounded-3xl bg-white/85 p-10 text-center max-w-xl mx-auto">
        <p className="font-display text-[18px] font-bold text-mist-50">Métier inconnu.</p>
        <button onClick={onChangeProfession} className="mt-4 text-duo-blue font-bold">
          Choisir un autre métier
        </button>
      </div>
    );
  }

  return (
    <>
      {/* FIX-5 : Switcher rapide entre classes — la RH voit en un coup d'œil
          combien de profils sont dispo dans chaque niveau, et clique pour
          changer instantanément sans repasser par les étapes. */}
      <ClassQuickSwitcher
        professionId={professionId}
        activeClass={classId}
        onPick={onPickClass}
      />

      <div className="mx-auto flex flex-wrap items-center justify-center gap-3 mb-6">
        <SummaryChip onClick={onChangeClass} color={cls.color} label={`Classe ${cls.id}`} sub={cls.seniority} />
        <span className="text-mist-400 text-[11px]">×</span>
        <SummaryChip onClick={onChangeProfession} color="#1CB0F6" label={profession.label} sub="Métier" />
      </div>

      <StepHeader
        eyebrow="Étape 3 sur 3"
        title={`${matching.length} ${profession.label.toLowerCase()}${matching.length === 1 ? "" : "s"}`}
        subtitle={`Classe ${cls.id} · ${cls.seniority}`}
      />

      <div className="mt-8 mx-auto max-w-3xl">
        <button
          onClick={() => setShowRefine((v) => !v)}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white ring-1 ring-ink-700/30 px-3 text-[12.5px] font-bold text-mist-200 hover:bg-ink-850"
        >
          Affiner les résultats
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showRefine && "rotate-180")} strokeWidth={2.4} />
        </button>

        {showRefine && (
          <div className="mt-3 rounded-2xl bg-white/95 ring-1 ring-ink-700/30 p-5 grid gap-4 md:grid-cols-3">
            <SelectField
              label="Ville"
              value={city}
              onChange={setCity}
              options={[{ v: "all", l: "Toutes" }, ...cities.map((c) => ({ v: c, l: c }))]}
            />
            <SelectField
              label="Pays"
              value={country}
              onChange={setCountry}
              options={[
                { v: "all", l: "Tous" },
                ...topCountries.map((c) => {
                  const co = findCountry(c);
                  return { v: c, l: `${co.flag} ${co.name}` };
                }),
              ]}
            />
            <SelectField
              label="Disponibilité"
              value={availability}
              onChange={(v) => setAvailability(v as Availability | "all")}
              options={[
                { v: "all", l: "Toute" },
                { v: "available", l: "Disponible" },
                { v: "open", l: "Ouvert aux entretiens" },
                { v: "on-mission", l: "En mission, visible" },
              ]}
            />
            <SelectField
              label="Mode de travail"
              value={workMode}
              onChange={(v) => setWorkMode(v as WorkMode | "all")}
              options={[
                { v: "all", l: "Tous" },
                { v: "remote", l: "Remote" },
                { v: "hybrid", l: "Hybride" },
                { v: "onsite", l: "Sur site" },
              ]}
            />
            <SelectField
              label="Contrat"
              value={contract}
              onChange={(v) => setContract(v as ContractType | "all")}
              options={[
                { v: "all", l: "Tous" },
                { v: "freelance", l: "Freelance" },
                { v: "fulltime", l: "CDI" },
                { v: "studio", l: "Studio" },
              ]}
            />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-mist-400">
                Score min · {minScore}
              </p>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={minScore}
                onChange={(e) => setMinScore(Number(e.currentTarget.value))}
                className="mt-3 w-full accent-duo-blue"
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-10 mx-auto max-w-3xl space-y-2.5">
        {matching.length === 0 ? (
          <div className="rounded-3xl bg-white/95 ring-1 ring-ink-700/30 p-12 text-center">
            <p className="font-display text-[20px] font-bold text-mist-50">
              Aucun {profession.label.toLowerCase()} dans cette classe.
            </p>
            <p className="mt-1 text-[13px] text-mist-400">
              Essaie une autre classe ou élargis les filtres.
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <button
                onClick={onChangeClass}
                className="rounded-2xl bg-ink-900 ring-1 ring-ink-700/60 px-4 py-2 text-[13px] font-bold text-mist-50"
              >
                Changer de classe
              </button>
              <button
                onClick={onChangeProfession}
                className="rounded-2xl bg-duo-blue text-white px-4 py-2 text-[13px] font-bold border-b-[3px] border-duo-blue-deep"
              >
                Changer de métier
              </button>
            </div>
          </div>
        ) : (
          matching.map((t, i) => (
            <TalentRow
              key={t.id}
              talent={t}
              index={i}
              onPropose={() => {
                const prof = t.professionId ? PROFESSIONS.find((p) => p.id === t.professionId) : undefined;
                const disc = getDiscipline(t.discipline);
                setProposeTalent({
                  id: t.id,
                  name: t.name,
                  roleLabel: prof?.short ?? disc.short,
                  initials: t.initials,
                  gradient: t.avatarGradient,
                });
              }}
            />
          ))
        )}
      </div>

      {proposeTalent && (
        <ProposeInterviewModal talent={proposeTalent} onClose={() => setProposeTalent(null)} />
      )}
    </>
  );
}

function SummaryChip({
  onClick,
  color,
  label,
  sub,
}: {
  onClick: () => void;
  color: string;
  label: string;
  sub: string;
}) {
  return (
    <button
      onClick={onClick}
      className="group inline-flex items-center gap-2 rounded-full bg-white/95 ring-1 ring-ink-700/30 px-3 py-1.5 text-left hover:bg-white"
    >
      <span
        className="grid h-7 w-7 place-items-center rounded-full font-display text-[12px] font-bold text-white"
        style={{ background: `linear-gradient(180deg, ${color}, ${color}cc)` }}
      >
        ↻
      </span>
      <span>
        <span className="block text-[12.5px] font-bold text-mist-50">{label}</span>
        <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-mist-400">{sub} · changer</span>
      </span>
    </button>
  );
}

function SelectField<V extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: V;
  onChange: (v: V) => void;
  options: { v: V; l: string }[];
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-mist-400">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.currentTarget.value as V)}
        className="mt-2 h-10 w-full rounded-xl bg-white ring-1 ring-ink-700/30 px-3 text-[13.5px] font-medium text-mist-50 outline-none focus:ring-duo-blue/50"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.l}
          </option>
        ))}
      </select>
    </label>
  );
}

function TalentRow({
  talent,
  index,
  onPropose,
}: {
  talent: Talent;
  index: number;
  onPropose: () => void;
}) {
  const country = findCountry(talent.countryCode);
  const profession = talent.professionId ? PROFESSIONS.find((p) => p.id === talent.professionId) : undefined;
  const disc = getDiscipline(talent.discipline);
  const roleLabel = profession?.short ?? disc.short;
  const category: ProfessionCategoryId = (profession?.category ?? "creative") as ProfessionCategoryId;
  const tier = tierForPercentile(talent.percentile);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4) }}
      className={cn(
        "row-squash group flex items-center gap-3 sm:gap-4 rounded-3xl bg-white ring-1 ring-ink-700/30 hover:ring-ink-700/60 px-3 sm:px-5 py-3.5",
        "shadow-card hover:shadow-card-hover",
        "border-b-[3px] border-ink-700/30 hover:border-ink-700/50",
      )}
    >
      <span className="font-display text-[18px] sm:text-[20px] font-black text-mist-500 tabular-nums w-7 sm:w-9 text-center">
        #{index + 1}
      </span>

      <Link href={`/talent/${talent.slug}`} className="shrink-0">
        <AvatarChip
          initials={talent.initials}
          gradient={`bg-gradient-to-br ${talent.avatarGradient}`}
          category={category}
          size="md"
        />
      </Link>

      <span
        className="hidden sm:inline-flex h-9 w-12 items-center justify-center rounded-xl bg-ink-850 ring-1 ring-ink-700/40 shrink-0 px-1.5"
        title={country.name}
      >
        <Flag code={country.code} size="md" />
      </span>

      <Link href={`/talent/${talent.slug}`} className="min-w-0 flex-1">
        <p className="truncate font-display text-[15px] font-bold tracking-tight text-mist-50 group-hover:text-duo-blue transition-colors">
          {talent.name}
        </p>
        <p className="truncate text-[11.5px] text-mist-400">
          {roleLabel} · {talent.city ?? country.name}
        </p>
      </Link>

      <ExperienceBadge years={talent.yearsExperience} size="sm" withYears />

      <span className="hidden md:inline-flex">
        <TierEmblem tier={tier.id} size="sm" />
      </span>

      <span
        className="inline-grid h-11 w-11 place-items-center rounded-xl font-display font-bold text-[14px] shrink-0"
        style={{
          background: `linear-gradient(180deg, ${tier.highlight}, ${tier.color})`,
          boxShadow: `0 3px 0 0 ${tier.color}aa, inset 0 1px 0 rgba(255,255,255,0.4)`,
          color: tier.id === "rising" || tier.id === "emerging" || tier.id === "new" ? "#1B1208" : "#FFFFFF",
        }}
      >
        {talent.score}
      </span>

      <span className="hidden lg:inline-flex">
        <AvailabilityDot status={talent.availability} />
      </span>

      <button
        onClick={onPropose}
        className={cn(
          "inline-flex h-10 items-center gap-1.5 rounded-2xl px-3 sm:px-4 shrink-0",
          "bg-gradient-to-b from-duo-blue to-[#1A9DDB] text-white font-bold uppercase tracking-[0.04em] text-[12px]",
          "border-b-[3px] border-duo-blue-deep transition-all duration-100",
          "hover:brightness-105 active:translate-y-[2px] active:border-b-[1px]",
        )}
      >
        <MessageSquarePlus className="h-3.5 w-3.5" strokeWidth={2.5} />
        <span className="hidden sm:inline">Entretien</span>
      </button>
    </motion.div>
  );
}

// ─── Quick profession search (FIX-2) ────────────────────────────────────────
// Search bar avec autocomplete précis. Quand l'utilisateur tape "Animateur 3D"
// on lui propose les métiers qui matchent. Le clic ouvre directement la liste
// des profils de ce métier (skip Classe + Métier picker).
function QuickProfessionSearch({
  onPick,
}: {
  onPick: (professionId: string) => void;
}) {
  const [query, setQuery] = useState("");

  // Compteur de talents par métier — pour mettre en avant les vivants.
  const talentCountByProfession = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of TALENTS) {
      const pid = talentProfessionId(t);
      if (pid) m.set(pid, (m.get(pid) ?? 0) + 1);
    }
    return m;
  }, []);

  const matches = useMemo(() => {
    const q = normalizeName(query.trim());
    if (!q) return [];
    return PROFESSIONS.filter((p) => {
      const hay = [p.label, p.frLabel, p.short, p.frShort, ...(p.synonyms ?? [])]
        .map((s) => normalizeName(s ?? ""))
        .join(" ");
      return hay.includes(q);
    })
      .sort((a, b) => {
        // Prioritise les métiers qui ont des talents.
        const cb = talentCountByProfession.get(b.id) ?? 0;
        const ca = talentCountByProfession.get(a.id) ?? 0;
        return cb - ca;
      })
      .slice(0, 6);
  }, [query, talentCountByProfession]);

  return (
    <div className="card-white p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-3">
        <Target className="h-3.5 w-3.5 text-amber-700" strokeWidth={2.8} />
        <h2 className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-amber-800">
          Recherche rapide · va direct aux profils
        </h2>
      </div>

      <div
        className="relative flex items-center gap-2 rounded-full bg-white ring-2 ring-ink-700/10 focus-within:ring-amber-300/60 transition-all duration-200 pl-5 pr-2 py-2"
        style={{
          boxShadow:
            "0 1px 0 rgba(255,255,255,0.85) inset, 0 8px 24px -12px rgba(0,0,0,0.12)",
        }}
      >
        <Search
          className="h-[18px] w-[18px] text-mist-400 shrink-0"
          strokeWidth={2.4}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          placeholder='Ex: "Animateur 3D", "Character Artist", "Frontend"…'
          className="h-11 flex-1 bg-transparent text-[15px] text-mist-50 placeholder:text-mist-400 outline-none"
          aria-label="Rechercher un métier précis"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Effacer la recherche"
            className="grid h-8 w-8 place-items-center rounded-full text-mist-400 hover:text-mist-100 hover:bg-ink-50 transition"
          >
            <X className="h-4 w-4" strokeWidth={2.4} />
          </button>
        )}
      </div>

      {query && (
        <div className="mt-3">
          {matches.length === 0 ? (
            <p className="text-[12.5px] text-mist-400 text-center py-3">
              Aucun métier ne matche &laquo;{query}&raquo;. Essaie un autre
              terme ou utilise le flow guidé ci-dessous.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {matches.map((p) => {
                const count = talentCountByProfession.get(p.id) ?? 0;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => onPick(p.id)}
                      className="w-full flex items-center gap-3 rounded-xl bg-ink-50 hover:bg-amber-50 ring-1 ring-inset ring-ink-700/10 hover:ring-amber-300/40 px-3.5 py-2.5 text-left transition group"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-[14px] font-black tracking-tight text-mist-50 truncate">
                          {p.frLabel}
                        </p>
                        <p className="text-[11.5px] text-mist-400">
                          {count > 0
                            ? `${count} profil${count > 1 ? "s" : ""} classé${count > 1 ? "s" : ""}`
                            : "Pas encore de profil"}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 group-hover:translate-x-0.5 transition">
                        Voir les profils
                        <ArrowRight className="h-3 w-3" strokeWidth={2.8} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {!query && (
        <p className="mt-3 text-[11.5px] text-mist-400 text-center">
          Trouve ton métier précis →{" "}
          <span className="font-bold text-mist-100">
            tu arrives sur les profils filtrés sans étape intermédiaire
          </span>
          .
        </p>
      )}
    </div>
  );
}

// ─── Pinned professions section (FIX-3) ─────────────────────────────────────
// Affiche les métiers que le studio a épinglés pour y revenir vite. Vide par
// défaut — pas de placeholder bruyant si rien n'est pinné.
function PinnedProfessionsSection({
  onPick,
}: {
  onPick: (professionId: string) => void;
}) {
  const { pinned } = usePinnedProfessions();

  // Compteur de talents
  const talentCountByProfession = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of TALENTS) {
      const pid = talentProfessionId(t);
      if (pid) m.set(pid, (m.get(pid) ?? 0) + 1);
    }
    return m;
  }, []);

  const pinnedProfessions = useMemo(() => {
    return pinned
      .map((id) => PROFESSIONS.find((p) => p.id === id))
      .filter((p): p is (typeof PROFESSIONS)[number] => p !== undefined);
  }, [pinned]);

  if (pinnedProfessions.length === 0) return null;

  return (
    <section className="mt-5">
      <div className="flex items-center gap-2 mb-3">
        <Pin className="h-3.5 w-3.5 text-amber-700" strokeWidth={2.8} />
        <h2 className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-amber-800">
          Métiers épinglés · {pinnedProfessions.length}
        </h2>
        <span className="h-px flex-1 bg-amber-200/60" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {pinnedProfessions.map((p) => {
          const count = talentCountByProfession.get(p.id) ?? 0;
          return (
            <div key={p.id} className="relative">
              <button
                type="button"
                onClick={() => onPick(p.id)}
                className="w-full flex items-center gap-3 rounded-2xl bg-white ring-1 ring-inset ring-amber-300/40 hover:ring-amber-400/60 hover:-translate-y-0.5 transition-all px-3.5 py-3 text-left shadow-card"
                style={{
                  boxShadow:
                    "0 6px 18px -8px rgba(180,83,9,0.20), inset 0 1px 0 rgba(255,255,255,0.5)",
                }}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[13.5px] font-black tracking-tight text-mist-50 truncate">
                    {p.frLabel}
                  </p>
                  <p className="text-[11px] text-mist-400">
                    {count > 0
                      ? `${count} profil${count > 1 ? "s" : ""}`
                      : "Aucun profil"}
                  </p>
                </div>
                <ArrowRight
                  className="h-4 w-4 text-amber-700 shrink-0"
                  strokeWidth={2.6}
                />
              </button>
              {/* Bouton désépingler — overlay top-right */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePin(p.id);
                }}
                aria-label={`Désépingler ${p.frLabel}`}
                className="absolute top-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-white/90 text-amber-700 hover:bg-amber-100 transition"
              >
                <PinOff className="h-3 w-3" strokeWidth={2.6} />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── ClassCardsGrid (FIX-4) ────────────────────────────────────────────────
// Grille des 6 niveaux S/A/B/C/D/E avec compteur de talents disponibles pour
// le métier sélectionné. Un seul clic = avance direct aux résultats.
// Différent de ClassPicker (carousel) : grille statique, lisible d'un coup.
function ClassCardsGrid({
  professionId,
  onSelect,
}: {
  professionId: string;
  onSelect: (classId: ExperienceClassId) => void;
}) {
  // Compte les talents pour ce métier par niveau (S/A/B/C/D/E)
  const countByClass = useMemo(() => {
    const m = new Map<ExperienceClassId, number>();
    for (const t of TALENTS) {
      if (talentProfessionId(t) !== professionId) continue;
      const cls = experienceClassForYears(t.yearsExperience).id;
      m.set(cls, (m.get(cls) ?? 0) + 1);
    }
    return m;
  }, [professionId]);

  const totalForProfession = useMemo(() => {
    return TALENTS.filter((t) => talentProfessionId(t) === professionId).length;
  }, [professionId]);

  return (
    <div>
      {/* Bandeau total */}
      <div className="text-center mb-6">
        <p className="text-[12.5px] text-mist-300">
          <strong className="text-mist-50 tabular-nums">{totalForProfession}</strong>{" "}
          profil{totalForProfession > 1 ? "s" : ""} classé
          {totalForProfession > 1 ? "s" : ""} au total · choisis le niveau
        </p>
      </div>

      {/* Grille 6 classes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {EXPERIENCE_ORDER.map((cls, i) => {
          const count = countByClass.get(cls.id) ?? 0;
          const hasProfiles = count > 0;
          return (
            <motion.button
              key={cls.id}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              onClick={() => onSelect(cls.id)}
              disabled={!hasProfiles}
              aria-label={`Niveau ${cls.id} (${cls.seniority}) · ${count} profils disponibles`}
              className={cn(
                "group relative overflow-hidden rounded-2xl p-5 text-left transition-all duration-200",
                "ring-2 ring-white/50",
                hasProfiles
                  ? "cursor-pointer hover:-translate-y-1 hover:shadow-card-hover active:translate-y-0"
                  : "cursor-not-allowed opacity-55",
              )}
              style={{
                background: `radial-gradient(120% 100% at 30% 0%, ${cls.highlight} 0%, ${cls.color} 60%, ${cls.color}dd 100%)`,
                boxShadow: hasProfiles
                  ? `0 12px 30px -10px ${cls.color}66, inset 0 1px 0 rgba(255,255,255,0.45)`
                  : `0 4px 12px -4px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.35)`,
              }}
            >
              <div className="flex items-start justify-between gap-2">
                {/* Big letter S/A/B/C/D/E + emoji */}
                <div>
                  <span
                    className="block font-display font-black tracking-tighter text-white"
                    style={{
                      fontSize: "56px",
                      lineHeight: 0.85,
                      textShadow: "0 4px 14px rgba(0,0,0,0.25), 0 1px 0 rgba(0,0,0,0.2)",
                    }}
                  >
                    {cls.id}
                  </span>
                  <span
                    className="block mt-1 text-[20px]"
                    aria-hidden
                  >
                    {cls.emoji}
                  </span>
                </div>

                {/* Compteur de profils dispo */}
                <div className="text-right">
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/80"
                    style={{ textShadow: "0 1px 2px rgba(0,0,0,0.25)" }}
                  >
                    {hasProfiles ? "Profils" : "Aucun"}
                  </p>
                  <p
                    className="font-display font-black tabular-nums text-white"
                    style={{
                      fontSize: hasProfiles ? "32px" : "24px",
                      lineHeight: 1,
                      textShadow: "0 2px 8px rgba(0,0,0,0.3)",
                    }}
                  >
                    {count}
                  </p>
                </div>
              </div>

              {/* Seniority label */}
              <p
                className="mt-3 font-display text-[16px] font-black tracking-tight text-white"
                style={{ textShadow: "0 2px 6px rgba(0,0,0,0.3)" }}
              >
                {cls.seniority}
              </p>
              <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white/85">
                {cls.description}
              </p>

              {/* CTA discret */}
              {hasProfiles && (
                <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-white ring-1 ring-inset ring-white/30 group-hover:bg-white/30 transition">
                  Voir
                  <ArrowRight
                    className="h-3 w-3 group-hover:translate-x-0.5 transition"
                    strokeWidth={2.8}
                  />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Hint en bas */}
      <p className="mt-6 text-center text-[11.5px] text-mist-400">
        Un seul clic suffit · les profils s&apos;affichent immédiatement
      </p>
    </div>
  );
}

// ─── ClassQuickSwitcher (FIX-5) ────────────────────────────────────────────
// Rangée de 6 pastilles S/A/B/C/D/E en haut de la vue Résultats, avec le
// compteur de profils par niveau pour le métier sélectionné. La pastille
// active est mise en évidence. Clic = switch instantané (sans repasser par
// les étapes précédentes).
function ClassQuickSwitcher({
  professionId,
  activeClass,
  onPick,
}: {
  professionId: string;
  activeClass: ExperienceClassId;
  onPick: (classId: ExperienceClassId) => void;
}) {
  const countByClass = useMemo(() => {
    const m = new Map<ExperienceClassId, number>();
    for (const t of TALENTS) {
      if (talentProfessionId(t) !== professionId) continue;
      const cls = experienceClassForYears(t.yearsExperience).id;
      m.set(cls, (m.get(cls) ?? 0) + 1);
    }
    return m;
  }, [professionId]);

  return (
    <div
      role="tablist"
      aria-label="Switcher de classe"
      className="mb-5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2"
    >
      {EXPERIENCE_ORDER.map((cls) => {
        const count = countByClass.get(cls.id) ?? 0;
        const isActive = cls.id === activeClass;
        const hasProfiles = count > 0;
        return (
          <button
            key={cls.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={`Classe ${cls.id} · ${cls.seniority} · ${count} profil${count > 1 ? "s" : ""}`}
            onClick={() => onPick(cls.id)}
            disabled={!hasProfiles && !isActive}
            className={cn(
              "group relative inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11.5px] font-bold transition-all duration-150",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60",
              isActive
                ? "text-white shadow-card scale-105"
                : hasProfiles
                  ? "bg-white ring-1 ring-inset ring-ink-700/10 hover:ring-ink-700/25 hover:-translate-y-0.5 text-mist-100"
                  : "bg-ink-50 ring-1 ring-inset ring-ink-700/10 text-mist-400 cursor-not-allowed opacity-60",
            )}
            style={
              isActive
                ? {
                    background: `linear-gradient(180deg, ${cls.highlight}, ${cls.color})`,
                    boxShadow: `0 4px 14px -4px ${cls.color}aa, inset 0 1px 0 rgba(255,255,255,0.4)`,
                  }
                : undefined
            }
            title={`${cls.seniority} · ${count} profil${count > 1 ? "s" : ""}`}
          >
            {/* Cercle avec lettre */}
            <span
              className={cn(
                "inline-grid h-6 w-6 place-items-center rounded-full font-display text-[11px] font-black tabular-nums shrink-0",
              )}
              style={{
                background: isActive ? "rgba(255,255,255,0.25)" : cls.color,
                color: isActive ? "#FFFFFF" : "#FFFFFF",
                textShadow: "0 1px 0 rgba(0,0,0,0.2)",
              }}
            >
              {cls.id}
            </span>
            {/* Compteur */}
            <span
              className={cn(
                "tabular-nums",
                isActive ? "text-white" : hasProfiles ? "text-mist-50" : "text-mist-400",
              )}
            >
              {count}
            </span>
            {/* Tooltip seniority label sur hover (caché par défaut) */}
            <span className="hidden sm:inline text-[10.5px] font-bold uppercase tracking-[0.06em] opacity-75">
              {cls.seniority.split(" ")[0]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── CategoryAisles (FIX-8) ────────────────────────────────────────────────
// Exploration par rayon, style supermarché. 19 catégories en grille de cards
// colorées. Clic sur une card → accordéon qui déplie la liste des métiers
// de cette catégorie avec compteur de candidats. Clic sur un métier →
// onPickProfession(id) → cartes de classes (step "class-for-profession").
function CategoryAisles({
  onPickProfession,
}: {
  onPickProfession: (professionId: string) => void;
}) {
  const [expandedCategory, setExpandedCategory] =
    useState<ProfessionCategoryId | null>(null);

  const talentCountByProfession = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of TALENTS) {
      const pid = talentProfessionId(t);
      if (pid) m.set(pid, (m.get(pid) ?? 0) + 1);
    }
    return m;
  }, []);

  const categoryStats = useMemo(() => {
    const m = new Map<
      ProfessionCategoryId,
      { professionCount: number; talentCount: number }
    >();
    for (const p of PROFESSIONS) {
      const existing = m.get(p.category) ?? {
        professionCount: 0,
        talentCount: 0,
      };
      existing.professionCount += 1;
      existing.talentCount += talentCountByProfession.get(p.id) ?? 0;
      m.set(p.category, existing);
    }
    return m;
  }, [talentCountByProfession]);

  const professionsInExpanded = useMemo(() => {
    if (!expandedCategory) return [];
    return PROFESSIONS.filter((p) => p.category === expandedCategory).sort(
      (a, b) => {
        const cb = talentCountByProfession.get(b.id) ?? 0;
        const ca = talentCountByProfession.get(a.id) ?? 0;
        return cb - ca;
      },
    );
  }, [expandedCategory, talentCountByProfession]);

  return (
    <section>
      <div className="text-center mb-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-800 inline-flex items-center gap-1.5">
          <Target className="h-3 w-3" strokeWidth={2.8} />
          Explorer par rayon
        </p>
        <p className="mt-1 text-[13px] text-mist-300">
          Comme dans un supermarché — choisis ton rayon, déplie les métiers,
          vois les candidats disponibles.
        </p>
      </div>

      {/* Grille des catégories */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {PROFESSION_CATEGORIES.map((cat) => {
          const stats = categoryStats.get(cat.id) ?? {
            professionCount: 0,
            talentCount: 0,
          };
          const isExpanded = expandedCategory === cat.id;
          const CatIcon = iconForCategory(cat.id);
          return (
            <motion.button
              key={cat.id}
              type="button"
              onClick={() =>
                setExpandedCategory(isExpanded ? null : cat.id)
              }
              aria-expanded={isExpanded}
              aria-label={`Rayon ${cat.frLabel} · ${stats.talentCount} candidats`}
              className={cn(
                "relative overflow-hidden rounded-2xl p-3.5 text-left transition-all duration-200",
                "ring-1 ring-inset",
                isExpanded
                  ? "ring-2 scale-[1.02]"
                  : "ring-ink-700/10 hover:ring-ink-700/25 hover:-translate-y-0.5",
              )}
              style={{
                background: isExpanded
                  ? `linear-gradient(135deg, ${cat.color}25, ${cat.color}10)`
                  : "white",
                boxShadow: isExpanded
                  ? `0 8px 20px -6px ${cat.color}55, inset 0 1px 0 rgba(255,255,255,0.6)`
                  : undefined,
              }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="flex items-start gap-2.5">
                <span
                  className="inline-grid h-9 w-9 place-items-center rounded-xl shrink-0"
                  style={{
                    background: `${cat.color}25`,
                    boxShadow: `inset 0 0 0 1px ${cat.color}40`,
                  }}
                >
                  <CatIcon
                    className="h-4 w-4"
                    strokeWidth={2.6}
                    style={{ color: cat.color }}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[12.5px] font-black tracking-tight text-mist-50 truncate leading-tight">
                    {cat.frLabel}
                  </p>
                  <p className="mt-1 text-[10.5px] text-mist-400 tabular-nums">
                    {stats.professionCount} métier
                    {stats.professionCount > 1 ? "s" : ""} ·{" "}
                    <strong
                      className="font-black"
                      style={{
                        color: stats.talentCount > 0 ? cat.color : undefined,
                      }}
                    >
                      {stats.talentCount}
                    </strong>{" "}
                    candidat{stats.talentCount > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Accordéon : liste des métiers de la catégorie expanded */}
      <AnimatePresence>
        {expandedCategory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-3 card-white p-4 sm:p-5">
              {(() => {
                const cat = PROFESSION_CATEGORIES.find(
                  (c) => c.id === expandedCategory,
                )!;
                return (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ background: cat.color }}
                      />
                      <h3
                        className="text-[11px] font-bold uppercase tracking-[0.18em]"
                        style={{ color: cat.color }}
                      >
                        {cat.frLabel} · {professionsInExpanded.length} métier
                        {professionsInExpanded.length > 1 ? "s" : ""}
                      </h3>
                      <span className="h-px flex-1 bg-ink-700/10" />
                      <button
                        type="button"
                        onClick={() => setExpandedCategory(null)}
                        aria-label="Fermer le rayon"
                        className="grid h-7 w-7 place-items-center rounded-full text-mist-400 hover:text-mist-50 hover:bg-ink-50 transition"
                      >
                        <X className="h-3.5 w-3.5" strokeWidth={2.4} />
                      </button>
                    </div>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {professionsInExpanded.map((p) => {
                        const count = talentCountByProfession.get(p.id) ?? 0;
                        const hasProfiles = count > 0;
                        return (
                          <li key={p.id}>
                            <button
                              type="button"
                              onClick={() => onPickProfession(p.id)}
                              className={cn(
                                "w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-left transition group",
                                hasProfiles
                                  ? "bg-ink-50 hover:bg-amber-50 ring-1 ring-inset ring-ink-700/10 hover:ring-amber-300/40"
                                  : "bg-ink-50 ring-1 ring-inset ring-ink-700/10 opacity-70 hover:opacity-100",
                              )}
                            >
                              <div className="min-w-0 flex-1">
                                <p className="font-display text-[13px] font-black tracking-tight text-mist-50 truncate">
                                  {p.frLabel}
                                </p>
                                <p className="text-[10.5px] text-mist-400">
                                  {hasProfiles
                                    ? `${count} candidat${count > 1 ? "s" : ""} disponible${count > 1 ? "s" : ""}`
                                    : "Pas encore de candidat"}
                                </p>
                              </div>
                              {hasProfiles && (
                                <span
                                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-black tabular-nums shrink-0"
                                  style={{
                                    background: `${cat.color}1f`,
                                    color: cat.color,
                                    boxShadow: `inset 0 0 0 1px ${cat.color}40`,
                                  }}
                                >
                                  {count}
                                </span>
                              )}
                              <ArrowRight
                                className="h-3 w-3 text-mist-400 group-hover:translate-x-0.5 transition shrink-0"
                                strokeWidth={2.6}
                              />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
