"use client";

import { useState, useTransition } from "react";
import { AlertCircle, Check, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Badge";
import { Field, Input, Select } from "@/components/auth/fields";
import { updateProfile, updateTalent } from "@/lib/server-actions/talent";
import { DISCIPLINES, SOFTWARE, type DisciplineId } from "@/lib/disciplines";
import { COUNTRIES } from "@/lib/countries";
import type { ProfileRow, TalentRow } from "@/lib/supabase/database.types";

interface Props {
  profile: ProfileRow;
  talent: TalentRow;
}

export function TalentProfileEditor({ profile, talent }: Props) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState(profile.display_name);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [city, setCity] = useState(profile.city ?? "");
  const [country, setCountry] = useState(profile.country_code);

  const [tagline, setTagline] = useState(talent.tagline ?? "");
  const [discipline, setDiscipline] = useState<DisciplineId>(talent.discipline);
  const [years, setYears] = useState(talent.years_experience);
  const [availability, setAvailability] = useState<TalentRow["availability"]>(talent.availability);
  const [availabilityNote, setAvailabilityNote] = useState(talent.availability_note ?? "");
  const [workMode, setWorkMode] = useState(talent.work_mode);
  const [contractType, setContractType] = useState(talent.contract_type);
  const [showreelUrl, setShowreelUrl] = useState(talent.showreel_url ?? "");
  const [artstationUrl, setArtstationUrl] = useState(talent.artstation_url ?? "");
  const [vimeoUrl, setVimeoUrl] = useState(talent.vimeo_url ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(talent.linkedin_url ?? "");
  const [softwareInput, setSoftwareInput] = useState(talent.software.join(", "));
  const [languagesInput, setLanguagesInput] = useState(talent.languages.join(", "));
  const [specialtiesInput, setSpecialtiesInput] = useState(talent.specialties.join(", "));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const [a, b] = await Promise.all([
        updateProfile({
          display_name: displayName,
          bio: bio || null,
          city: city || null,
          country_code: country,
        }),
        updateTalent({
          tagline: tagline || null,
          discipline,
          years_experience: years,
          availability: availability === "hired" ? "available" : (availability as never),
          availability_note: availabilityNote || null,
          work_mode: workMode,
          contract_type: contractType,
          showreel_url: showreelUrl || null,
          artstation_url: artstationUrl || null,
          vimeo_url: vimeoUrl || null,
          linkedin_url: linkedinUrl || null,
          software: parseList(softwareInput),
          languages: parseList(languagesInput),
          specialties: parseList(specialtiesInput),
        }),
      ]);
      if (!a.ok) return setError(a.error);
      if (!b.ok) return setError(b.error);
      setSaved(true);
      setTimeout(() => setSaved(false), 2400);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      {/* Left column */}
      <div className="space-y-6">
        <section className="glass-panel p-6">
          <h2 className="font-display text-[18px] font-semibold text-mist-50">Identity</h2>
          <p className="mt-1 text-[12.5px] text-mist-400">
            Public-facing. Username can&apos;t be changed from here yet.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Display name">
              <Input value={displayName} onChange={(e) => setDisplayName(e.currentTarget.value)} required />
            </Field>
            <Field label="Username (locked)">
              <Input value={profile.username} disabled className="opacity-60" />
            </Field>
            <Field label="City">
              <Input value={city} onChange={(e) => setCity(e.currentTarget.value)} placeholder="Paris" />
            </Field>
            <Field label="Country">
              <Select value={country} onChange={(e) => setCountry(e.currentTarget.value)}>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Bio" hint="Up to 2000 characters.">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.currentTarget.value)}
                  maxLength={2000}
                  rows={4}
                  className="w-full rounded-xl border border-ink-700/40 bg-ink-900/60 p-3.5 text-[14px] text-mist-50 placeholder:text-mist-500 outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                />
              </Field>
            </div>
          </div>
        </section>

        <section className="glass-panel p-6">
          <h2 className="font-display text-[18px] font-semibold text-mist-50">Creative role</h2>
          <p className="mt-1 text-[12.5px] text-mist-400">
            What you ship, and how. Drives your score and discipline ranking.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Tagline" hint="Up to 140 characters.">
              <Input
                value={tagline}
                onChange={(e) => setTagline(e.currentTarget.value)}
                maxLength={140}
                placeholder="Shot-ownership generalist. Cinematic to the frame."
              />
            </Field>
            <Field label="Years of experience">
              <Input
                type="number"
                min={0}
                max={60}
                value={years}
                onChange={(e) => setYears(Number(e.currentTarget.value))}
              />
            </Field>
            <Field label="Primary discipline">
              <Select value={discipline} onChange={(e) => setDiscipline(e.currentTarget.value as DisciplineId)}>
                {DISCIPLINES.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Work mode">
              <Select value={workMode} onChange={(e) => setWorkMode(e.currentTarget.value as never)}>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On site</option>
              </Select>
            </Field>
            <Field label="Contract type">
              <Select value={contractType} onChange={(e) => setContractType(e.currentTarget.value as never)}>
                <option value="any">Freelance / Full-time</option>
                <option value="freelance">Freelance only</option>
                <option value="fulltime">Full-time only</option>
                <option value="studio">Studio contract</option>
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Field
                label="Specialties"
                hint='Comma-separated. Up to 8. e.g. "Character Animation, Cinematic FX, Look-Dev"'
              >
                <Input value={specialtiesInput} onChange={(e) => setSpecialtiesInput(e.currentTarget.value)} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field
                label="Software stack"
                hint="Comma-separated. Suggestions below."
              >
                <Input value={softwareInput} onChange={(e) => setSoftwareInput(e.currentTarget.value)} />
              </Field>
              <div className="mt-2 flex flex-wrap gap-1">
                {SOFTWARE.slice(0, 12).map((sw) => (
                  <button
                    key={sw}
                    type="button"
                    onClick={() => {
                      const list = parseList(softwareInput);
                      if (!list.includes(sw)) setSoftwareInput([...list, sw].join(", "));
                    }}
                    className="text-[11px] rounded-full bg-ink-850 hover:bg-ink-850 ring-1 ring-inset ring-ink-700/40 px-2 py-0.5 text-mist-300"
                  >
                    + {sw}
                  </button>
                ))}
              </div>
            </div>
            <Field
              label="Languages"
              hint='Comma-separated. e.g. "French, English"'
            >
              <Input value={languagesInput} onChange={(e) => setLanguagesInput(e.currentTarget.value)} />
            </Field>
          </div>
        </section>

        <section className="glass-panel p-6">
          <h2 className="font-display text-[18px] font-semibold text-mist-50">Links</h2>
          <p className="mt-1 text-[12.5px] text-mist-400">
            A verified showreel is worth +6 score points.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Showreel URL">
              <Input
                type="url"
                value={showreelUrl}
                onChange={(e) => setShowreelUrl(e.currentTarget.value)}
                placeholder="https://vimeo.com/showcase/…"
              />
            </Field>
            <Field label="ArtStation">
              <Input type="url" value={artstationUrl} onChange={(e) => setArtstationUrl(e.currentTarget.value)} />
            </Field>
            <Field label="Vimeo">
              <Input type="url" value={vimeoUrl} onChange={(e) => setVimeoUrl(e.currentTarget.value)} />
            </Field>
            <Field label="LinkedIn">
              <Input type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.currentTarget.value)} />
            </Field>
          </div>
        </section>
      </div>

      {/* Right column */}
      <div className="space-y-6">
        <section className="glass-panel p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-[18px] font-semibold text-mist-50">Availability</h2>
          <p className="mt-1 text-[12.5px] text-mist-400">
            Studios filter by this. Be honest — fast responders earn a badge.
          </p>
          <div className="mt-5 space-y-2">
            {(
              [
                { v: "available", l: "Available now", tone: "green" },
                { v: "open", l: "Open to offers", tone: "cyan" },
                { v: "on-mission", l: "On mission, visible", tone: "amber" },
                { v: "unavailable", l: "Unavailable / paused", tone: "neutral" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.v}
                type="button"
                onClick={() => setAvailability(opt.v)}
                className={
                  "flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-[13.5px] transition " +
                  (availability === opt.v
                    ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-100"
                    : "border-ink-700/40 bg-ink-850 text-mist-200 hover:bg-ink-850")
                }
              >
                <span>{opt.l}</span>
                {availability === opt.v && <Check className="h-3.5 w-3.5 text-cyan-300" />}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <Field label="Availability note" hint="e.g. “Open from June 2026”">
              <Input
                value={availabilityNote}
                onChange={(e) => setAvailabilityNote(e.currentTarget.value)}
                maxLength={200}
                placeholder="Open from June 2026"
              />
            </Field>
          </div>

          <div className="mt-6">
            <Button type="submit" size="md" className="w-full" disabled={isPending}>
              <Save className="h-4 w-4" strokeWidth={2.4} />
              {isPending ? "Saving…" : "Save profile"}
            </Button>
            {saved && (
              <Pill tone="green" className="mt-3">
                <Check className="h-3 w-3" /> Saved · score recomputing
              </Pill>
            )}
            {error && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[13px] text-rose-200">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </form>
  );
}

function parseList(s: string): string[] {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}
