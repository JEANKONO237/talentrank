"use client";

import { useMemo, useState, useTransition } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Ban,
  Check,
  ChevronDown,
  Clock,
  ShieldOff,
  Trash2,
  X,
} from "lucide-react";
import {
  bulkReviewFlags,
  liftLockout,
  reviewFlag,
  voidQcmAttempt,
} from "@/lib/admin/actions";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// AdminFlagsClient — UI interactive de la file modération.
//
// Compose 3 zones :
//   1. Summary header — chiffres clés
//   2. Filters bar — severity + status + profession
//   3. Flags grid — une card par flag, actions inline
//   4. Lockouts panel — sidebar latérale, lift quick action
// ─────────────────────────────────────────────────────────────────────────────

interface FlagRow {
  id: string;
  attempt_id: string;
  talent_id: string;
  code: string;
  severity: "low" | "medium" | "high";
  detail: string;
  review_status: "pending" | "reviewed" | "confirmed" | "dismissed";
  created_at: string;
  reviewed_at: string | null;
  review_note: string | null;
  talent_username: string | null;
  talent_display_name: string | null;
  attempt_profession_id: string | null;
  attempt_final_score: number | null;
  attempt_status: string | null;
}

interface LockoutRow {
  id: string;
  talent_id: string | null;
  fingerprint_hash: string | null;
  ip_hash: string | null;
  profession_id: string | null;
  expires_at: string;
  reason: string;
  created_at: string;
  created_by: string | null;
}

interface Props {
  flags: FlagRow[];
  lockouts: LockoutRow[];
  summary: {
    total: number;
    pending: number;
    high: number;
    confirmed: number;
    dismissed: number;
    activeLockouts: number;
  };
}

type StatusFilter = "all" | "pending" | "reviewed" | "confirmed" | "dismissed";
type SeverityFilter = "all" | "high" | "medium" | "low";

export function AdminFlagsClient({ flags, lockouts, summary }: Props) {
  const [status, setStatus] = useState<StatusFilter>("pending");
  const [severity, setSeverity] = useState<SeverityFilter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Filters apply
  const filtered = useMemo(() => {
    return flags.filter((f) => {
      if (status !== "all" && f.review_status !== status) return false;
      if (severity !== "all" && f.severity !== severity) return false;
      return true;
    });
  }, [flags, status, severity]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      {/* ── Main column : flags ────────────────────────────────────── */}
      <div className="space-y-5">
        <SummaryStrip summary={summary} />

        <FiltersBar
          status={status}
          setStatus={setStatus}
          severity={severity}
          setSeverity={setSeverity}
          selectedCount={selected.size}
          onClearSelection={clearSelection}
          selectedIds={[...selected]}
        />

        {filtered.length === 0 ? (
          <div className="card-white p-12 text-center">
            <p className="text-[14px] text-mist-300">
              Aucun flag {status === "pending" ? "en attente" : "dans ce filtre"}.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((flag) => (
              <FlagCard
                key={flag.id}
                flag={flag}
                isSelected={selected.has(flag.id)}
                onToggle={() => toggle(flag.id)}
              />
            ))}
          </ul>
        )}
      </div>

      {/* ── Sidebar : lockouts ─────────────────────────────────────── */}
      <aside className="space-y-4">
        <LockoutsPanel lockouts={lockouts} />
      </aside>
    </div>
  );
}

// ─── Summary strip ────────────────────────────────────────────────────────

function SummaryStrip({ summary }: { summary: Props["summary"] }) {
  const stats = [
    { label: "Total 30j", value: summary.total, color: "#6E5A3E" },
    { label: "En attente", value: summary.pending, color: "#F59E0B" },
    { label: "Sévérité high", value: summary.high, color: "#EF4444" },
    { label: "Confirmés", value: summary.confirmed, color: "#DC2626" },
    { label: "Dismiss", value: summary.dismissed, color: "#10B981" },
    { label: "Lockouts actifs", value: summary.activeLockouts, color: "#7C3AED" },
  ];
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl bg-white ring-1 ring-inset ring-ink-700/10 shadow-card px-3 py-2.5 text-center"
        >
          <p
            className="font-display text-[20px] font-black leading-none tabular-nums"
            style={{ color: s.color }}
          >
            {s.value}
          </p>
          <p className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.12em] text-mist-400">
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Filters bar ──────────────────────────────────────────────────────────

function FiltersBar({
  status,
  setStatus,
  severity,
  setSeverity,
  selectedCount,
  selectedIds,
  onClearSelection,
}: {
  status: StatusFilter;
  setStatus: (s: StatusFilter) => void;
  severity: SeverityFilter;
  setSeverity: (s: SeverityFilter) => void;
  selectedCount: number;
  selectedIds: string[];
  onClearSelection: () => void;
}) {
  const [pending, startTransition] = useTransition();

  const bulkAction = (newStatus: "reviewed" | "confirmed" | "dismissed") => {
    startTransition(async () => {
      await bulkReviewFlags(selectedIds, newStatus);
      onClearSelection();
    });
  };

  return (
    <div className="rounded-2xl bg-white ring-1 ring-inset ring-ink-700/10 shadow-card p-3 flex flex-wrap items-center gap-2">
      {/* Status segmented */}
      <SegmentedControl
        value={status}
        onChange={(v) => setStatus(v as StatusFilter)}
        options={[
          { id: "pending", label: "En attente" },
          { id: "confirmed", label: "Confirmés" },
          { id: "dismissed", label: "Dismiss" },
          { id: "reviewed", label: "Reviewed" },
          { id: "all", label: "Tous" },
        ]}
      />
      <span className="h-6 w-px bg-ink-700/10 mx-1" />
      <SegmentedControl
        value={severity}
        onChange={(v) => setSeverity(v as SeverityFilter)}
        options={[
          { id: "all", label: "Toutes sév." },
          { id: "high", label: "High" },
          { id: "medium", label: "Med" },
          { id: "low", label: "Low" },
        ]}
      />

      {/* Bulk actions if selection exists */}
      {selectedCount > 0 && (
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11.5px] font-bold text-mist-100">
            {selectedCount} sélectionné{selectedCount > 1 ? "s" : ""}
          </span>
          <button
            type="button"
            disabled={pending}
            onClick={() => bulkAction("confirmed")}
            className="inline-flex h-8 items-center gap-1 rounded-full bg-red-100 hover:bg-red-200 text-red-800 px-3 text-[11px] font-bold uppercase tracking-[0.08em] transition"
          >
            <AlertTriangle className="h-3 w-3" strokeWidth={2.6} />
            Confirmer
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => bulkAction("dismissed")}
            className="inline-flex h-8 items-center gap-1 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-3 text-[11px] font-bold uppercase tracking-[0.08em] transition"
          >
            <Check className="h-3 w-3" strokeWidth={2.6} />
            Dismiss
          </button>
          <button
            type="button"
            onClick={onClearSelection}
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-ink-800 text-mist-400 transition"
            aria-label="Effacer sélection"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.6} />
          </button>
        </div>
      )}
    </div>
  );
}

function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string }[];
}) {
  return (
    <div className="inline-flex rounded-full bg-ink-850 p-0.5">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={cn(
            "h-7 px-3 rounded-full text-[11px] font-bold transition",
            value === opt.id
              ? "bg-white text-mist-50 shadow-sm"
              : "text-mist-400 hover:text-mist-200",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Flag card ────────────────────────────────────────────────────────────

const SEVERITY_STYLES = {
  high: { color: "#DC2626", bg: "#FEE2E2", icon: AlertTriangle, label: "High" },
  medium: { color: "#D97706", bg: "#FEF3C7", icon: AlertCircle, label: "Medium" },
  low: { color: "#0E7490", bg: "#CFFAFE", icon: Clock, label: "Low" },
} as const;

const STATUS_STYLES = {
  pending: { color: "#92400E", bg: "#FEF3C7", label: "En attente" },
  reviewed: { color: "#475569", bg: "#E2E8F0", label: "Reviewed" },
  confirmed: { color: "#991B1B", bg: "#FEE2E2", label: "Confirmé" },
  dismissed: { color: "#065F46", bg: "#D1FAE5", label: "Dismiss" },
} as const;

function FlagCard({
  flag,
  isSelected,
  onToggle,
}: {
  flag: FlagRow;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [pending, startTransition] = useTransition();
  const sev = SEVERITY_STYLES[flag.severity];
  const SIcon = sev.icon;
  const st = STATUS_STYLES[flag.review_status];

  const ago = ageString(flag.created_at);

  const review = (status: "reviewed" | "confirmed" | "dismissed") => {
    startTransition(async () => {
      await reviewFlag(flag.id, status);
    });
  };

  const voidAttempt = () => {
    if (!confirm("Annuler l'attempt et retirer le score du classement ?")) return;
    startTransition(async () => {
      await voidQcmAttempt(flag.attempt_id, `Flag confirmé : ${flag.code}`);
    });
  };

  return (
    <li
      className={cn(
        "rounded-2xl bg-white ring-1 ring-inset ring-ink-700/10 shadow-card transition-all",
        isSelected && "ring-2 ring-cyan-400",
        pending && "opacity-60",
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <label className="mt-1 cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggle}
              className="h-4 w-4 accent-cyan-400 cursor-pointer"
              aria-label="Sélectionner ce flag"
            />
          </label>

          {/* Severity icon */}
          <span
            className="grid h-9 w-9 place-items-center rounded-xl shrink-0"
            style={{ background: sev.bg, color: sev.color }}
          >
            <SIcon className="h-4 w-4" strokeWidth={2.6} />
          </span>

          {/* Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-display text-[15px] font-black text-mist-50 leading-tight">
                {flag.code}
              </span>
              <span
                className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.10em]"
                style={{ background: sev.bg, color: sev.color }}
              >
                {sev.label}
              </span>
              <span
                className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.10em]"
                style={{ background: st.bg, color: st.color }}
              >
                {st.label}
              </span>
            </div>
            <p className="mt-1.5 text-[13px] text-mist-200 leading-snug">
              {flag.detail}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-mist-400">
              <span>
                Talent :{" "}
                <span className="font-bold text-mist-200">
                  {flag.talent_display_name ?? flag.talent_username ?? flag.talent_id.slice(0, 8)}
                </span>
              </span>
              {flag.attempt_profession_id && (
                <span>
                  Métier :{" "}
                  <span className="font-bold text-mist-200">
                    {flag.attempt_profession_id}
                  </span>
                </span>
              )}
              {flag.attempt_final_score !== null && (
                <span>
                  Score :{" "}
                  <span className="font-bold text-mist-200 tabular-nums">
                    {flag.attempt_final_score}
                  </span>
                </span>
              )}
              <span>· {ago}</span>
            </div>
          </div>

          {/* Toggle expand */}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-label="Voir détail"
            aria-expanded={expanded}
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-ink-800 text-mist-400 transition shrink-0"
          >
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")}
              strokeWidth={2.6}
            />
          </button>
        </div>

        {/* Expanded actions */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-ink-700/10 flex flex-wrap items-center gap-2">
            {flag.review_status === "pending" && (
              <>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => review("confirmed")}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-red-100 hover:bg-red-200 text-red-800 px-3.5 text-[12px] font-bold uppercase tracking-[0.06em] transition"
                >
                  <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.6} />
                  Confirmer triche
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => review("dismissed")}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-3.5 text-[12px] font-bold uppercase tracking-[0.06em] transition"
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={2.6} />
                  Faux positif
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => review("reviewed")}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink-850 hover:bg-ink-800 text-mist-100 px-3.5 text-[12px] font-bold uppercase tracking-[0.06em] transition"
                >
                  Reviewed, aucun action
                </button>
              </>
            )}
            {flag.review_status === "confirmed" && flag.attempt_status === "completed" && (
              <button
                type="button"
                disabled={pending}
                onClick={voidAttempt}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-red-100 hover:bg-red-200 text-red-800 px-3.5 text-[12px] font-bold uppercase tracking-[0.06em] transition"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2.6} />
                Annuler l&apos;attempt + retirer du classement
              </button>
            )}
            <span className="text-[11px] text-mist-400 ml-auto">
              Flag ID : <span className="font-mono">{flag.id.slice(0, 8)}</span> · Attempt :{" "}
              <span className="font-mono">{flag.attempt_id.slice(0, 8)}</span>
            </span>
          </div>
        )}
      </div>
    </li>
  );
}

// ─── Lockouts panel ───────────────────────────────────────────────────────

function LockoutsPanel({ lockouts }: { lockouts: LockoutRow[] }) {
  const [pending, startTransition] = useTransition();

  const lift = (id: string) => {
    if (!confirm("Lever ce lockout immédiatement ?")) return;
    startTransition(async () => {
      await liftLockout(id);
    });
  };

  return (
    <div className="rounded-2xl bg-white ring-1 ring-inset ring-ink-700/10 shadow-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <ShieldOff className="h-4 w-4 text-purple-700" strokeWidth={2.6} />
        <h2 className="font-display text-[14px] font-black text-mist-50">
          Lockouts actifs ({lockouts.length})
        </h2>
      </div>
      {lockouts.length === 0 ? (
        <p className="text-[12px] text-mist-400">Aucun lockout actif.</p>
      ) : (
        <ul className="space-y-2">
          {lockouts.map((l) => (
            <li
              key={l.id}
              className={cn(
                "rounded-xl bg-ink-850 p-2.5 text-[11.5px] transition",
                pending && "opacity-60",
              )}
            >
              <div className="flex items-start gap-2">
                <Ban className="h-3.5 w-3.5 text-purple-700 mt-0.5 shrink-0" strokeWidth={2.6} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-mist-100 leading-tight">
                    {l.profession_id ?? "Global"}{" "}
                    <span className="text-[10px] font-medium text-mist-400">
                      · {ageString(l.expires_at, true)}
                    </span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-mist-300 leading-tight">{l.reason}</p>
                  <p className="mt-1 text-[10px] text-mist-400 truncate">
                    {l.talent_id && <>user: {l.talent_id.slice(0, 8)} </>}
                    {l.fingerprint_hash && <>fp: {l.fingerprint_hash.slice(0, 8)} </>}
                    {l.ip_hash && <>ip: {l.ip_hash.slice(0, 8)}</>}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => lift(l.id)}
                  disabled={pending}
                  className="text-[10px] font-bold uppercase tracking-[0.08em] text-purple-700 hover:text-purple-900 transition shrink-0"
                  aria-label="Lever le lockout"
                >
                  Lever
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function ageString(ts: string, future = false): string {
  const dt = new Date(ts).getTime();
  const diff = future ? dt - Date.now() : Date.now() - dt;
  const abs = Math.abs(diff);
  const min = Math.floor(abs / 60_000);
  const hours = Math.floor(min / 60);
  const days = Math.floor(hours / 24);
  const prefix = future ? "expire dans " : "";
  if (days > 0) return `${prefix}${days}j`;
  if (hours > 0) return `${prefix}${hours}h`;
  if (min > 0) return `${prefix}${min}min`;
  return future ? "expire bientôt" : "à l'instant";
}
