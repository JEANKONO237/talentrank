"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  Briefcase,
  Calendar,
  Check,
  Coins,
  MapPin,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Pill } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/auth/fields";
import { cn } from "@/lib/utils";

interface TalentLite {
  id: string;
  name: string;
  roleLabel: string;
  initials: string;
  gradient: string;
  flag?: string;
}

interface Props {
  talent: TalentLite;
  onClose: () => void;
}

type ContractType = "fulltime" | "freelance" | "studio" | "internship" | "apprenticeship" | "any";
type WorkMode = "remote" | "hybrid" | "onsite";

export function ProposeInterviewModal({ talent, onClose }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [roleTitle, setRoleTitle] = useState("");
  const [contractType, setContractType] = useState<ContractType>("fulltime");
  const [workMode, setWorkMode] = useState<WorkMode>("hybrid");
  const [location, setLocation] = useState("");

  // Step 2
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryCurrency, setSalaryCurrency] = useState("EUR");
  const [startEarliest, setStartEarliest] = useState("");
  const [startLatest, setStartLatest] = useState("");
  const [expires, setExpires] = useState("");

  // Step 3
  const [message, setMessage] = useState("");

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const next = () => {
    setError(null);
    if (step === 1 && !roleTitle.trim()) {
      setError("Role title is required.");
      return;
    }
    setStep((s) => (s < 3 ? ((s + 1) as 2 | 3) : s));
  };

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      // Demo mode: in the real flow this calls sendInterviewProposal({...}).
      // For the visual demo we simulate latency + success state.
      await new Promise((r) => setTimeout(r, 900));
      setDone(true);
      setTimeout(() => onClose(), 1800);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] grid place-items-center bg-mist-50/40 backdrop-blur-md p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.2, 0.7, 0.2, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl glass-panel p-7"
        >
          {/* Header */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-mist-300 hover:bg-ink-850 hover:text-mist-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3">
            <Avatar initials={talent.initials} gradient={`bg-gradient-to-br ${talent.gradient}`} flag={talent.flag} size="md" />
            <div className="min-w-0">
              <Pill tone="cyan">
                <Sparkles className="h-3 w-3" />
                Propose an interview · No cover letter
              </Pill>
              <h2 className="mt-2 font-display text-[20px] font-semibold tracking-tight text-mist-50 truncate">
                Reach out to {talent.name}
              </h2>
              <p className="text-[12.5px] text-mist-400">{talent.roleLabel}</p>
            </div>
          </div>

          {/* Progress dots */}
          {!done && (
            <div className="mt-6 flex items-center gap-2">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-colors",
                    n <= step ? "bg-cyan-400 shadow-glow-sm" : "bg-ink-800",
                  )}
                />
              ))}
            </div>
          )}

          {/* Steps */}
          {done ? (
            <SuccessState talent={talent} />
          ) : (
            <>
              {step === 1 && (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field label="Role title" hint="What you'd like to invite them to discuss.">
                      <Input
                        autoFocus
                        value={roleTitle}
                        onChange={(e) => setRoleTitle(e.currentTarget.value)}
                        placeholder="Senior Backend Engineer — Payments"
                        maxLength={120}
                      />
                    </Field>
                  </div>
                  <Field label="Contract type">
                    <Select value={contractType} onChange={(e) => setContractType(e.currentTarget.value as ContractType)}>
                      <option value="fulltime">Full-time</option>
                      <option value="freelance">Freelance</option>
                      <option value="studio">Studio contract</option>
                      <option value="internship">Internship</option>
                      <option value="apprenticeship">Apprenticeship</option>
                      <option value="any">Open to discuss</option>
                    </Select>
                  </Field>
                  <Field label="Work mode">
                    <Select value={workMode} onChange={(e) => setWorkMode(e.currentTarget.value as WorkMode)}>
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="onsite">On site</option>
                    </Select>
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Location" hint="City, country or “Remote (EU)”. Optional.">
                      <Input
                        value={location}
                        onChange={(e) => setLocation(e.currentTarget.value)}
                        placeholder="Paris, France"
                      />
                    </Field>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <Field label="Salary min (annual)">
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={salaryMin}
                      onChange={(e) => setSalaryMin(e.currentTarget.value)}
                      placeholder="65000"
                    />
                  </Field>
                  <Field label="Salary max (annual)">
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={salaryMax}
                      onChange={(e) => setSalaryMax(e.currentTarget.value)}
                      placeholder="85000"
                    />
                  </Field>
                  <Field label="Currency">
                    <Select value={salaryCurrency} onChange={(e) => setSalaryCurrency(e.currentTarget.value)}>
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                      <option value="GBP">GBP</option>
                      <option value="JPY">JPY</option>
                    </Select>
                  </Field>

                  <Field label="Start window — earliest">
                    <Input type="date" value={startEarliest} onChange={(e) => setStartEarliest(e.currentTarget.value)} />
                  </Field>
                  <Field label="Start window — latest">
                    <Input type="date" value={startLatest} onChange={(e) => setStartLatest(e.currentTarget.value)} />
                  </Field>
                  <Field label="Proposal expires">
                    <Input type="date" value={expires} onChange={(e) => setExpires(e.currentTarget.value)} />
                  </Field>
                </div>
              )}

              {step === 3 && (
                <div className="mt-6">
                  <Summary
                    talent={talent}
                    roleTitle={roleTitle}
                    contractType={contractType}
                    workMode={workMode}
                    location={location}
                    salaryMin={salaryMin}
                    salaryMax={salaryMax}
                    salaryCurrency={salaryCurrency}
                    startEarliest={startEarliest}
                    startLatest={startLatest}
                  />
                  <Field label="A short note (optional)" hint="No cover letter. Just context.">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.currentTarget.value)}
                      rows={4}
                      maxLength={2000}
                      placeholder="We loved your work on… would you be open to a quick chat?"
                      className="w-full rounded-xl border border-ink-700/40 bg-ink-900/60 p-3.5 text-[14px] text-mist-50 placeholder:text-mist-500 outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                    />
                  </Field>
                </div>
              )}

              {error && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[13px] text-rose-200">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="mt-7 flex items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={step === 1 ? onClose : () => setStep((s) => ((s - 1) as 1 | 2))}
                  disabled={submitting}
                >
                  {step === 1 ? "Cancel" : "Back"}
                </Button>

                {step < 3 ? (
                  <Button onClick={next} disabled={submitting} size="md">
                    Continue
                  </Button>
                ) : (
                  <Button onClick={submit} disabled={submitting} size="md">
                    <Send className="h-4 w-4" strokeWidth={2.4} />
                    {submitting ? "Sending privately…" : "Send proposal"}
                  </Button>
                )}
              </div>

              <p className="mt-3 text-center text-[11px] text-mist-500">
                This proposal is sent privately to {talent.name.split(" ")[0]}. They&apos;ll see your studio identity
                and can accept, hold or decline. No public posting.
              </p>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Summary({
  talent,
  roleTitle,
  contractType,
  workMode,
  location,
  salaryMin,
  salaryMax,
  salaryCurrency,
  startEarliest,
  startLatest,
}: {
  talent: TalentLite;
  roleTitle: string;
  contractType: ContractType;
  workMode: WorkMode;
  location: string;
  salaryMin: string;
  salaryMax: string;
  salaryCurrency: string;
  startEarliest: string;
  startLatest: string;
}) {
  const salary =
    salaryMin && salaryMax ? `${Number(salaryMin).toLocaleString()}–${Number(salaryMax).toLocaleString()} ${salaryCurrency}` : "To discuss";
  const start =
    startEarliest && startLatest ? `${startEarliest} → ${startLatest}` : startEarliest || startLatest || "Flexible";

  return (
    <div className="mb-5 rounded-2xl border border-ink-700/40 bg-ink-850 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-mist-500">
        Summary — what {talent.name.split(" ")[0]} will see
      </p>
      <p className="mt-2 font-display text-[18px] font-semibold tracking-tight text-mist-50">
        {roleTitle || "Untitled role"}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[12.5px]">
        <SummaryRow icon={Briefcase}>
          {contractType} · {workMode}
        </SummaryRow>
        <SummaryRow icon={MapPin}>{location || "Not specified"}</SummaryRow>
        <SummaryRow icon={Coins}>{salary}</SummaryRow>
        <SummaryRow icon={Calendar}>{start}</SummaryRow>
      </div>
    </div>
  );
}

function SummaryRow({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-mist-200">
      <Icon className="h-3.5 w-3.5 text-mist-400" strokeWidth={2.2} />
      <span>{children}</span>
    </div>
  );
}

function SuccessState({ talent }: { talent: TalentLite }) {
  return (
    <div className="mt-8 grid place-items-center pb-2 text-center">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
        className="grid h-14 w-14 place-items-center rounded-full bg-signal-green/15 ring-1 ring-inset ring-signal-green/40"
      >
        <Check className="h-6 w-6 text-signal-green" strokeWidth={2.6} />
      </motion.div>
      <p className="mt-5 font-display text-[20px] font-semibold text-mist-50">Proposal sent privately.</p>
      <p className="mt-1.5 max-w-md text-[13.5px] text-mist-300">
        {talent.name} just got a notification. Their decision will land in your inbox.
      </p>
    </div>
  );
}
