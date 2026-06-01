"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AlertCircle, ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Badge";
import { Field, Input, Select } from "./fields";
import { DISCIPLINES } from "@/lib/disciplines";
import { COUNTRIES } from "@/lib/countries";
import { signUpTalent, signUpStudio, checkUsernameAvailable } from "@/lib/server-actions/auth";

type Role = "talent" | "studio";

export function SignUpForm() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("talent");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // shared
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [country, setCountry] = useState("FR");

  // talent
  const [discipline, setDiscipline] = useState("generalist-3d");

  // studio
  const [studioName, setStudioName] = useState("");

  // username live-check
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "ok" | "taken" | "invalid">("idle");

  async function onUsernameBlur() {
    if (!username) return;
    setUsernameStatus("checking");
    const ok = await checkUsernameAvailable(username);
    setUsernameStatus(ok ? "ok" : "taken");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res =
        role === "talent"
          ? await signUpTalent({
              email,
              password,
              username: username.toLowerCase(),
              display_name: displayName,
              discipline: discipline as never,
              country_code: country,
            })
          : await signUpStudio({
              email,
              password,
              username: username.toLowerCase(),
              display_name: displayName,
              studio_name: studioName,
              country_code: country,
            });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSuccess(true);
      // If email confirmation is disabled (dev), the user is already signed in.
      // Otherwise they'll click the link from email.
      setTimeout(() => {
        router.push(role === "studio" ? "/dashboard/recruiter" : "/dashboard/talent");
        router.refresh();
      }, 1200);
    });
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-signal-green/10 ring-1 ring-inset ring-signal-green/30">
          <Check className="h-5 w-5 text-signal-green" strokeWidth={2.6} />
        </div>
        <p className="mt-4 font-display text-[18px] font-semibold text-mist-50">Welcome to TalentRank.</p>
        <p className="mt-2 text-[13px] text-mist-400">Redirecting to your dashboard…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Role selector */}
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-ink-850 p-1 ring-1 ring-inset ring-ink-700/30">
        <button
          type="button"
          onClick={() => setRole("talent")}
          className={
            "h-10 rounded-lg text-[13px] font-medium transition " +
            (role === "talent" ? "bg-cyan-400 text-white shadow-glow-sm" : "text-mist-300 hover:text-mist-50")
          }
        >
          I&apos;m a creative
        </button>
        <button
          type="button"
          onClick={() => setRole("studio")}
          className={
            "h-10 rounded-lg text-[13px] font-medium transition " +
            (role === "studio" ? "bg-amber-400 text-white shadow-glow-amber" : "text-mist-300 hover:text-mist-50")
          }
        >
          I&apos;m a studio
        </button>
      </div>

      <Field label="Display name" hint="Shown on your profile and cards.">
        <Input
          required
          minLength={1}
          maxLength={80}
          value={displayName}
          onChange={(e) => setDisplayName(e.currentTarget.value)}
          placeholder={role === "talent" ? "Jean Marie O." : "Aurora Studios"}
        />
      </Field>

      <Field
        label="Username"
        hint={
          <span className="font-mono">talentrank.com/{role === "studio" ? "studio" : "talent"}/{username || "your-handle"}</span>
        }
        action={
          usernameStatus === "checking" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-mist-400" />
          ) : usernameStatus === "ok" ? (
            <Pill tone="green">
              <Check className="h-3 w-3" /> Available
            </Pill>
          ) : usernameStatus === "taken" ? (
            <Pill tone="amber">Taken</Pill>
          ) : null
        }
      >
        <Input
          required
          minLength={3}
          maxLength={32}
          pattern="^[a-z0-9][a-z0-9-]*[a-z0-9]$"
          value={username}
          onChange={(e) => {
            setUsername(e.currentTarget.value.toLowerCase());
            setUsernameStatus("idle");
          }}
          onBlur={onUsernameBlur}
          placeholder={role === "talent" ? "jean-onana" : "aurora-studios"}
        />
      </Field>

      {role === "talent" ? (
        <Field label="Primary discipline">
          <Select value={discipline} onChange={(e) => setDiscipline(e.currentTarget.value)} required>
            {DISCIPLINES.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </Select>
        </Field>
      ) : (
        <Field label="Studio name">
          <Input
            required
            value={studioName}
            onChange={(e) => setStudioName(e.currentTarget.value)}
            placeholder="Aurora Studios"
          />
        </Field>
      )}

      <Field label="Country">
        <Select value={country} onChange={(e) => setCountry(e.currentTarget.value)}>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Email">
        <Input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
        />
      </Field>

      <Field label="Password" hint="8 characters minimum.">
        <Input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
        />
      </Field>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[13px] text-rose-200">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Button
        type="submit"
        size="md"
        className="w-full"
        variant={role === "studio" ? "amber" : "primary"}
        disabled={isPending || usernameStatus === "taken"}
      >
        {isPending ? "Creating account…" : role === "talent" ? "Join as a talent" : "Create studio account"}
        <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
      </Button>

      <p className="text-center text-[11px] text-mist-500">
        By signing up, you agree to our terms and privacy policy.
      </p>
    </form>
  );
}
