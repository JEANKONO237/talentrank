import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Brain, Lock, Shield, Sparkles, Trophy } from "lucide-react";
import { listBanks } from "@/lib/qcm/registry";
import { getProfession, getCategory, professionLabel } from "@/lib/professions";
import { iconForCategory } from "@/lib/profession-icons";

export const metadata: Metadata = {
  title: "Évaluation — TalentRank",
  description:
    "Passe l'évaluation TalentRank de ton métier. Score multi-dimensions, classement crédible, anti-cheat intégré.",
};

export default function QcmIndexPage() {
  const banks = listBanks();

  return (
    <div className="container-page pt-28 pb-24">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-ink-875/70 ring-1 ring-inset ring-ink-700/40 px-3 py-1">
          <Brain className="h-3.5 w-3.5 text-cyan-300" strokeWidth={2.6} />
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-mist-300">
            Évaluation TalentRank
          </span>
        </div>
        <h1 className="mt-5 font-display text-display-md font-bold tracking-tight text-mist-50">
          Prouve ton niveau.{" "}
          <span className="text-gradient-cyan">Monte au classement.</span>
        </h1>
        <p className="mt-5 text-[15px] leading-relaxed text-mist-300">
          Un QCM par métier. 10-12 questions adaptées à ton expérience.
          Six dimensions de score, anti-cheat intégré, résultat instantané.
          Pas un questionnaire — un vrai test crédible.
        </p>
      </div>

      {/* Three trust pillars */}
      <div className="mt-12 mx-auto max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-3">
        <TrustPillar
          icon={<Sparkles className="h-4 w-4" strokeWidth={2.6} />}
          title="Adaptatif"
          body="Junior ou sénior, le mix de difficulté s'adapte à tes années déclarées."
          color="#1CB0F6"
        />
        <TrustPillar
          icon={<Shield className="h-4 w-4" strokeWidth={2.6} />}
          title="Anti-cheat"
          body="Détection paste, temps anormaux, incohérence CV vs réponses, profils gonflés."
          color="#58CC02"
        />
        <TrustPillar
          icon={<Trophy className="h-4 w-4" strokeWidth={2.6} />}
          title="Six dimensions"
          body="Technique · Expérience · Fiabilité · Spécialisation · Communication · Cohérence."
          color="#FFC800"
        />
      </div>

      {/* Bank grid */}
      <div className="mt-16 mx-auto max-w-5xl">
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.22em] text-mist-400">
          Évaluations disponibles
        </p>
        <h2 className="mt-3 text-center font-display text-[22px] font-bold text-mist-50">
          Choisis ton métier
        </h2>
        <p className="mt-2 text-center text-[13px] text-mist-400">
          {banks.length} évaluation{banks.length > 1 ? "s" : ""} déployée
          {banks.length > 1 ? "s" : ""} · d&apos;autres arrivent
        </p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {banks.map((b) => {
            const profession = getProfession(b.professionId);
            const category = profession ? getCategory(profession.category) : undefined;
            const Icon = category ? iconForCategory(category.id) : Sparkles;
            return (
              <Link
                key={b.professionId}
                href={`/qcm/${b.professionId}`}
                className="card-squash group relative overflow-hidden rounded-3xl border border-ink-700/40 hover:border-ink-700/70 bg-ink-875 p-6 shadow-card hover:shadow-card-hover"
              >
                {category && (
                  <div
                    className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-25 blur-3xl transition-opacity group-hover:opacity-60"
                    style={{ background: category.color }}
                  />
                )}
                <div className="relative">
                  <span
                    className="inline-grid h-11 w-11 place-items-center rounded-2xl ring-1 ring-inset ring-ink-700/40"
                    style={{
                      background: category
                        ? `linear-gradient(160deg, ${category.color}30, ${category.color}10)`
                        : undefined,
                    }}
                  >
                    <Icon
                      className="h-5 w-5"
                      strokeWidth={2.5}
                      style={{ color: category?.color ?? "#22D3EE" }}
                    />
                  </span>
                  <h3 className="mt-5 font-display text-[20px] font-bold text-mist-50">
                    {profession ? professionLabel(profession, "fr") : b.frLabel}
                  </h3>
                  <p className="mt-1 text-[12px] text-mist-400">
                    {b.axes.length} axes · {b.questions.length} questions au total
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1">
                    {b.axes.slice(0, 6).map((a) => (
                      <span
                        key={a.id}
                        className="inline-flex items-center rounded-full bg-ink-850 ring-1 ring-inset ring-ink-700/40 px-2 py-0.5 text-[10.5px] font-medium text-mist-300"
                      >
                        {a.frLabel}
                      </span>
                    ))}
                  </div>
                  <span className="mt-5 inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-[0.14em] text-cyan-300 group-hover:text-cyan-200">
                    Commencer <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.8} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Privacy note */}
      <p className="mt-12 text-center text-[12px] text-mist-400 max-w-xl mx-auto">
        <Lock className="inline-block h-3 w-3 mr-1 -mt-0.5" strokeWidth={2.6} />
        Tes réponses restent privées. Seul le score final + les drapeaux d&apos;audit
        sont stockés. Le QCM est rejouable : ton meilleur score compte.
      </p>
    </div>
  );
}

function TrustPillar({
  icon,
  title,
  body,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl bg-ink-875/60 ring-1 ring-inset ring-ink-700/40 p-4">
      <span
        className="inline-grid h-8 w-8 place-items-center rounded-full"
        style={{ background: `${color}22`, color }}
      >
        {icon}
      </span>
      <p className="mt-3 font-display text-[14px] font-bold text-mist-50">{title}</p>
      <p className="mt-1 text-[12.5px] leading-relaxed text-mist-400">{body}</p>
    </div>
  );
}
