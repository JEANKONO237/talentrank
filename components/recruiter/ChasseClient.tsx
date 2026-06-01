"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronDown, MessageSquarePlus } from "lucide-react";
import { ClassPicker } from "./ClassPicker";
import { ProfessionPicker } from "./ProfessionPicker";
import { ProposeInterviewModal } from "./ProposeInterviewModal";
import { AvatarChip } from "@/components/ui/AvatarChip";
import { TierEmblem } from "@/components/ui/TierEmblem";
import { ExperienceBadge } from "@/components/ui/ExperienceBadge";
import { AvailabilityDot } from "@/components/ui/AvailabilityDot";
import { CanvasRevealEffect } from "@/components/ui/canvas-reveal";
import { Flag } from "@/components/ui/Flag";
import {
  EXPERIENCE_CLASSES,
  type ExperienceClassId,
  experienceClassForYears,
} from "@/lib/experience-class";
import { findCountry } from "@/lib/countries";
import { getDiscipline } from "@/lib/disciplines";
import { PROFESSIONS, type ProfessionCategoryId } from "@/lib/professions";
import { tierForPercentile } from "@/lib/tiers";
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
}

type Step = "class" | "profession" | "results";

export function ChasseClient({ initialClass }: Props) {
  const [pickedClass, setPickedClass] = useState<ExperienceClassId | null>(initialClass);
  const [pickedProfession, setPickedProfession] = useState<string | null>(null);

  const step: Step = !pickedClass ? "class" : !pickedProfession ? "profession" : "results";

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

      <div className="container-page relative pt-28 pb-20">
        <Stepper current={step} />

        {/* Conditional rendering — no AnimatePresence (was causing the step-2
            content to be stuck at opacity 0 on transition). Each step uses
            the `animate-rise-in` Tailwind keyframe for a soft fade-up. */}
        {step === "class" && (
          <div key="class-step" className="animate-rise-in">
            <StepHeader
              eyebrow="Étape 1 sur 3"
              title="Quelle classe cherches-tu ?"
              subtitle="Du Junior au Maître absolu. Choisis le niveau d'expérience."
            />
            <div className="mt-12 flex justify-center">
              <ClassPicker onSelect={setPickedClass} />
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
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Stepper ──────────────────────────────────────────────────────────────
function Stepper({ current }: { current: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: "class", label: "Classe" },
    { id: "profession", label: "Métier" },
    { id: "results", label: "Profils" },
  ];
  const currentIdx = steps.findIndex((s) => s.id === current);

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
}

function ResultsStep({ classId, professionId, onChangeClass, onChangeProfession }: ResultsProps) {
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
