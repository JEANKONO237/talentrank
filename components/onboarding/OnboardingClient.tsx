"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Sparkles,
} from "lucide-react";
import { LeagueMascot } from "@/components/ui/LeagueMascot";
import { Logo } from "@/components/ui/Logo";
import {
  completeOnboarding,
  type OnboardingPayload,
} from "@/app/onboarding/actions";
import { listBanks } from "@/lib/qcm/registry";
import type { Audience } from "@/lib/audience/types";

// ─────────────────────────────────────────────────────────────────────────────
// OnboardingClient v3 — inscription ultra-rapide selon spec user.
//
//   TALENT  → email + password + métier principal  (3 champs · accès immédiat)
//   STUDIO  → email + password + entreprise + secteur  (4 champs · accès imm.)
//
// Pas de "compléter plus tard" sur les champs essentiels — le user remplit
// les 3-4 champs requis et c'est tout. Le profil complet (CV, portfolio,
// expériences, etc.) se complète depuis le dashboard via une barre de
// progression "Profil complété à X %".
//
// UX :
//   - Single column, gros inputs, focus généreux
//   - Password toggle show/hide
//   - Indicateur force password
//   - Submit primary disabled tant que tous les requis ne sont pas valides
//   - Pas de bouton skip — la promesse est "3 minutes maximum"
// ─────────────────────────────────────────────────────────────────────────────

const DRAFT_KEY = "tr:onboarding:draft:v1";

const TALENT_THEME = {
  accent: "#F59E0B",
  bg: "linear-gradient(135deg, #FFF8E1 0%, #FFE8B0 100%)",
  orbBg: "radial-gradient(circle at 30% 25%, #FFE082, #F59E0B 60%, #B45309 100%)",
  eyebrow: "Inscription · Talent",
  title: "Bienvenue.",
  body:
    "3 infos suffisent pour démarrer. Tu compléteras le reste (portfolio, expériences, dispo) plus tard depuis ton profil.",
  promise: "3 minutes max · accès immédiat",
};

const STUDIO_THEME = {
  accent: "#1A2535",
  bg: "linear-gradient(135deg, #E7EAEF 0%, #C6CCD6 100%)",
  orbBg: "radial-gradient(circle at 30% 25%, #4D5A6B, #2C3E55 60%, #0A1018 100%)",
  eyebrow: "Inscription · Entreprise",
  title: "Bienvenue.",
  body:
    "4 infos suffisent pour ouvrir l'accès à la chasse. Tu pourras enrichir le profil entreprise (logo, équipe, secteur) plus tard.",
  promise: "3 minutes max · accès immédiat",
};

// Secteurs d'activité côté entreprise — courte liste, pas exhaustive
const SECTORS = [
  "Studio création / Animation",
  "Studio jeux vidéo",
  "Agence design / publicité",
  "Tech / SaaS",
  "E-commerce",
  "Artisanat / Restauration",
  "Santé",
  "Industrie",
  "Conseil / Recrutement",
  "Autre",
];

export function OnboardingClient({ audience }: { audience: Audience }) {
  const theme = audience === "talent" ? TALENT_THEME : STUDIO_THEME;
  const [pending, startTransition] = useTransition();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [profession, setProfession] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [sector, setSector] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const banks = audience === "talent" ? listBanks() : [];

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordValid = password.length >= 8;
  const nameValid = displayName.trim().length >= 2;
  const audienceFieldValid =
    audience === "talent"
      ? profession.length > 0
      : companyName.trim().length >= 2 && sector.length > 0;

  // Audit Marco G2-Marco-2 : checkbox CGU obligatoire avant submit
  const canSubmit =
    emailValid && passwordValid && nameValid && audienceFieldValid && acceptedTerms && !pending;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    const payload: OnboardingPayload = {
      email: email.trim().toLowerCase(),
      password,
      displayName: displayName.trim(),
      profession: audience === "talent" ? profession : undefined,
      companyName: audience === "studio" ? companyName.trim() : undefined,
      sector: audience === "studio" ? sector : undefined,
    };
    // Draft persistance en attendant Supabase auth
    if (typeof window !== "undefined") {
      try {
        const { password: _pw, ...safe } = payload;
        void _pw;
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({ ...safe, audience, savedAt: Date.now() }),
        );
      } catch {
        /* ignore */
      }
    }
    startTransition(async () => {
      try {
        const result = await completeOnboarding(payload);
        // En mode démo le redirect Next throw NEXT_REDIRECT (catch ci-dessous l'ignore)
        // En mode réel : si result.ok = false on affiche l'erreur (email déjà pris, etc.)
        if (result && !result.ok) {
          setError(result.error ?? "Inscription échouée.");
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
        setError(err instanceof Error ? err.message : "Erreur inattendue.");
      }
    });
  };

  // ── Password strength visuel ────────────────────────────────────────
  const pwStrength = computeStrength(password);
  const pwLabel = ["Trop court", "Faible", "Moyen", "Solide", "Excellent"][pwStrength];
  const pwColor = ["#94A3B8", "#EF4444", "#F59E0B", "#22C55E", "#10B981"][pwStrength];

  return (
    <main
      className="relative min-h-screen w-full overflow-hidden flex flex-col"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(255,200,0,0.08), transparent 60%), radial-gradient(ellipse 60% 50% at 50% 110%, rgba(28,176,246,0.06), transparent 60%), #FFFFFF",
      }}
    >
      {/* Header bar */}
      <header className="flex items-center justify-between px-6 lg:px-10 pt-6 pb-2">
        <Link
          href="/welcome"
          className="inline-flex items-center gap-1.5 text-[12px] font-bold text-mist-400 hover:text-mist-50 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.6} />
          Revoir le choix
        </Link>
        <Logo size={32} withWordmark />
        <span aria-hidden className="w-[120px]" />
      </header>

      <div className="flex-1 flex items-center justify-center px-5 sm:px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}
          className="relative w-full max-w-md rounded-[28px] p-7 sm:p-9 ring-1 ring-inset ring-ink-700/10"
          style={{
            background: theme.bg,
            boxShadow:
              "0 28px 64px -20px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.55)",
          }}
        >
          {/* Halo */}
          <span
            aria-hidden
            className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full opacity-40 blur-3xl"
            style={{ background: theme.accent }}
          />

          {/* Orb header */}
          <div className="relative flex flex-col items-center mb-5">
            <div
              className="grid place-items-center rounded-full"
              style={{
                width: 96,
                height: 96,
                background: theme.orbBg,
                boxShadow:
                  "0 16px 32px -8px rgba(0,0,0,0.35), inset 0 3px 0 rgba(255,255,255,0.45), inset 0 -14px 22px -8px rgba(0,0,0,0.35)",
              }}
            >
              {audience === "talent" ? (
                <LeagueMascot
                  tier="senior"
                  size={64}
                  className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]"
                />
              ) : (
                <Building2
                  className="h-12 w-12 text-white drop-shadow-[0_3px_6px_rgba(0,0,0,0.4)]"
                  strokeWidth={1.8}
                />
              )}
            </div>
          </div>

          {/* Eyebrow + title */}
          <p
            className="relative text-center text-[10.5px] font-bold uppercase tracking-[0.22em]"
            style={{ color: theme.accent }}
          >
            {theme.eyebrow}
          </p>
          <h1
            className="relative mt-2 text-center font-display font-black tracking-tight text-mist-50"
            style={{
              fontSize: "clamp(1.6rem, 3.2vw, 2rem)",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            {theme.title}
          </h1>
          <p className="relative mt-3 text-center text-[13.5px] text-mist-200 leading-relaxed">
            {theme.body}
          </p>

          {/* Form */}
          <form onSubmit={onSubmit} className="relative mt-7 space-y-3.5">
            <Field label="Email" icon={<Mail className="h-3.5 w-3.5" strokeWidth={2.6} />}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                placeholder="ton@email.com"
                required
                autoComplete="email"
                className="w-full h-11 rounded-xl bg-white ring-1 ring-inset ring-ink-700/15 focus:ring-2 focus:ring-night-700/50 px-4 text-[14px] text-mist-50 placeholder:text-mist-400 outline-none transition"
              />
            </Field>

            <Field
              label="Mot de passe"
              icon={<Lock className="h-3.5 w-3.5" strokeWidth={2.6} />}
              hint={password.length > 0 ? `${pwLabel} · 8 caractères min` : "8 caractères minimum"}
              hintColor={password.length > 0 ? pwColor : undefined}
            >
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.currentTarget.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full h-11 rounded-xl bg-white ring-1 ring-inset ring-ink-700/15 focus:ring-2 focus:ring-night-700/50 pl-4 pr-11 text-[14px] text-mist-50 placeholder:text-mist-400 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-lg hover:bg-ink-800 text-mist-400 transition"
                  aria-label={showPw ? "Masquer" : "Afficher"}
                >
                  {showPw ? (
                    <EyeOff className="h-3.5 w-3.5" strokeWidth={2.4} />
                  ) : (
                    <Eye className="h-3.5 w-3.5" strokeWidth={2.4} />
                  )}
                </button>
              </div>
              {password.length > 0 && (
                <div className="mt-2 flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className="h-1 flex-1 rounded-full transition-colors"
                      style={{
                        background: i < pwStrength ? pwColor : "rgba(0,0,0,0.06)",
                      }}
                    />
                  ))}
                </div>
              )}
            </Field>

            {/* Nom complet — requis pour profile.display_name */}
            <Field label={audience === "talent" ? "Ton nom" : "Ton nom (contact)"}>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.currentTarget.value)}
                placeholder={audience === "talent" ? "Jean Marie O." : "Claire Dupont"}
                required
                minLength={2}
                autoComplete="name"
                className="w-full h-11 rounded-xl bg-white ring-1 ring-inset ring-ink-700/15 focus:ring-2 focus:ring-night-700/50 px-4 text-[14px] text-mist-50 placeholder:text-mist-400 outline-none transition"
              />
            </Field>

            {/* Audience-specific fields */}
            {audience === "talent" ? (
              <Field
                label="Ton métier principal"
                icon={<Briefcase className="h-3.5 w-3.5" strokeWidth={2.6} />}
                hint="Tu pourras en passer d'autres plus tard"
              >
                <select
                  value={profession}
                  onChange={(e) => setProfession(e.currentTarget.value)}
                  required
                  className="w-full h-11 rounded-xl bg-white ring-1 ring-inset ring-ink-700/15 focus:ring-2 focus:ring-night-700/50 px-3 text-[14px] text-mist-50 outline-none transition appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' stroke='%236E5A3E' stroke-width='1.5' fill='none' stroke-linecap='round'/></svg>")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 12px center",
                    paddingRight: "32px",
                  }}
                >
                  <option value="">Choisir un métier…</option>
                  {banks.map((b) => (
                    <option key={b.professionId} value={b.professionId}>
                      {b.frLabel}
                    </option>
                  ))}
                </select>
              </Field>
            ) : (
              <>
                <Field
                  label="Nom de l'entreprise"
                  icon={<Building2 className="h-3.5 w-3.5" strokeWidth={2.6} />}
                >
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.currentTarget.value)}
                    placeholder="Studio Ghibli, Ubisoft, Boulangerie X…"
                    required
                    minLength={2}
                    autoComplete="organization"
                    className="w-full h-11 rounded-xl bg-white ring-1 ring-inset ring-ink-700/15 focus:ring-2 focus:ring-night-700/50 px-4 text-[14px] text-mist-50 placeholder:text-mist-400 outline-none transition"
                  />
                </Field>

                <Field label="Secteur d'activité">
                  <select
                    value={sector}
                    onChange={(e) => setSector(e.currentTarget.value)}
                    required
                    className="w-full h-11 rounded-xl bg-white ring-1 ring-inset ring-ink-700/15 focus:ring-2 focus:ring-night-700/50 px-3 text-[14px] text-mist-50 outline-none transition appearance-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' stroke='%236E5A3E' stroke-width='1.5' fill='none' stroke-linecap='round'/></svg>")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 12px center",
                      paddingRight: "32px",
                    }}
                  >
                    <option value="">Sélectionner…</option>
                    {SECTORS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>
              </>
            )}

            {/* CGU obligatoire (audit Marco G2-Marco-2) */}
            <label className="mt-4 flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.currentTarget.checked)}
                required
                className="mt-0.5 h-4 w-4 accent-night-700 cursor-pointer shrink-0"
                aria-label="Accepter les conditions d'utilisation"
              />
              <span className="text-[12px] text-mist-200 leading-relaxed">
                J&apos;accepte les{" "}
                <Link href="/cgu" target="_blank" className="font-bold text-night-700 underline decoration-amber-300 decoration-2 underline-offset-2 hover:decoration-amber-500">
                  conditions d&apos;utilisation
                </Link>{" "}
                et la{" "}
                <Link href="/confidentialite" target="_blank" className="font-bold text-night-700 underline decoration-amber-300 decoration-2 underline-offset-2 hover:decoration-amber-500">
                  politique de confidentialité
                </Link>
                .
              </span>
            </label>

            {error && (
              <p className="text-[12px] text-rose-700 font-medium" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="mt-6 w-full inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[13px] font-bold uppercase tracking-[0.06em] text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: canSubmit
                  ? "linear-gradient(180deg, #2C3E55, #1A2535)"
                  : "linear-gradient(180deg, #6E7B8A, #4D5A6B)",
                boxShadow: canSubmit
                  ? "inset 0 1px 0 rgba(255,255,255,0.15), 0 8px 20px -6px rgba(10,20,30,0.45)"
                  : "inset 0 1px 0 rgba(255,255,255,0.08)",
              }}
            >
              {pending ? (
                "Préparation…"
              ) : (
                <>
                  Créer mon compte
                  <ArrowRight className="h-4 w-4" strokeWidth={2.6} />
                </>
              )}
            </button>

            <p className="text-center text-[11px] text-mist-400">
              <Sparkles className="inline-block h-3 w-3 -mt-0.5 mr-0.5 text-amber-600" strokeWidth={2.8} />
              {theme.promise}
            </p>
          </form>
        </motion.div>
      </div>
    </main>
  );
}

// ─── Field wrapper ───────────────────────────────────────────────────────

function Field({
  label,
  icon,
  hint,
  hintColor,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  hint?: string;
  hintColor?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-mist-400">
          {icon}
          {label}
        </span>
        {hint && (
          <span
            className="text-[10px] font-medium"
            style={{ color: hintColor ?? "var(--color-mist-500, #A39074)" }}
          >
            {hint}
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

// ─── Password strength (simple heuristique) ─────────────────────────────

function computeStrength(pw: string): number {
  if (pw.length < 8) return 0;
  let s = 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^a-zA-Z0-9]/.test(pw) || pw.length >= 16) s++;
  return Math.min(4, s);
}
