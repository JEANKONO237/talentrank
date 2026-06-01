"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  Bell,
  Crown,
  Eye,
  Heart,
  Mail,
  Percent,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { LeagueMascot } from "@/components/ui/LeagueMascot";
import { TIER_ORDER, TIERS, type TierId } from "@/lib/tiers";
import { REWARDS, type Reward } from "@/lib/rewards";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// LeagueRewards — affichage des récompenses concrètes par ligue.
//
// Format : pile verticale de cards (Diamant → Nouveau), chacune montre :
//   - mascotte + ligue + tagline
//   - liste des rewards (icône + label)
//   - commission % en gros (la métrique qui parle au talent freelance)
//
// Utilisable dans 2 contextes :
//   - <LeagueRewards /> seul (page dédiée, modale "?")
//   - <LeagueRewards highlightTier="senior" /> dans /dashboard pour montrer
//     ce qui est débloqué + ce qui attend au palier suivant
// ─────────────────────────────────────────────────────────────────────────────

const ICONS = {
  Eye,
  Zap,
  Mail,
  Percent,
  Crown,
  Sparkles,
  Star,
  Bell,
  Award,
  Heart,
} as const;

interface Props {
  /** Si set, l'ascension de l'utilisateur est mise en évidence. */
  highlightTier?: TierId;
  /** "stack" = tous visibles, "compact" = accordéon (default sur mobile). */
  variant?: "stack" | "compact";
}

export function LeagueRewards({ highlightTier, variant = "stack" }: Props) {
  // Diamant en haut, Nouveau en bas — sens de l'ambition.
  const tiers = [...TIER_ORDER];
  const [openId, setOpenId] = useState<TierId | null>(highlightTier ?? null);

  if (variant === "compact") {
    return (
      <ul className="space-y-2">
        {tiers.map((tier) => (
          <RewardAccordion
            key={tier.id}
            tierId={tier.id}
            isOpen={openId === tier.id}
            isCurrent={tier.id === highlightTier}
            onToggle={() => setOpenId(openId === tier.id ? null : tier.id)}
          />
        ))}
      </ul>
    );
  }

  return (
    <ul className="space-y-4">
      {tiers.map((tier, i) => (
        <motion.li
          key={tier.id}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45, delay: i * 0.06, ease: [0.2, 0.7, 0.2, 1] }}
        >
          <RewardCard tierId={tier.id} isCurrent={tier.id === highlightTier} />
        </motion.li>
      ))}
    </ul>
  );
}

// ─── RewardCard (variant stack) ──────────────────────────────────────────

function RewardCard({ tierId, isCurrent }: { tierId: TierId; isCurrent?: boolean }) {
  const tier = TIERS[tierId];
  const data = REWARDS[tierId];
  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-[24px] p-5 sm:p-6",
        "ring-1 ring-inset transition-all",
        isCurrent ? "ring-2" : "ring-ink-700/10",
      )}
      style={{
        background: `linear-gradient(135deg, ${tier.highlight}33 0%, #FFFFFF 60%)`,
        boxShadow: isCurrent
          ? `0 16px 40px -12px ${tier.color}55, inset 0 1px 0 rgba(255,255,255,0.55), 0 0 0 2px ${tier.color}`
          : "0 8px 24px -10px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.65)",
      }}
    >
      {/* Ambient halo */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full opacity-30 blur-3xl"
        style={{ background: tier.color }}
      />

      {/* Current badge */}
      {isCurrent && (
        <span
          className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.18em] ring-1 ring-inset ring-black/8"
          style={{ color: tier.color }}
        >
          <Sparkles className="h-3 w-3" strokeWidth={2.8} />
          Ta ligue
        </span>
      )}

      <div className="relative flex items-start gap-4">
        {/* Mascot + ring */}
        <div
          className="relative grid place-items-center rounded-full shrink-0"
          style={{
            width: 64,
            height: 64,
            background: `radial-gradient(circle at 30% 25%, ${tier.highlight}, ${tier.color} 65%, ${tier.color}cc 100%)`,
            boxShadow: `0 10px 22px -8px ${tier.color}88, inset 0 2px 0 rgba(255,255,255,0.5), inset 0 -8px 14px -6px rgba(0,0,0,0.30)`,
          }}
        >
          <LeagueMascot tier={tier.id} size={46} className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]" />
        </div>

        {/* Title block */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3
              className="font-display text-[20px] font-black tracking-tight text-mist-50"
              style={{ color: tier.color }}
            >
              {tier.label}
            </h3>
            <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-mist-400">
              {tier.range}
            </span>
          </div>
          <p className="mt-0.5 text-[12.5px] text-mist-200 italic">« {data.tagline} »</p>

          {/* Commission tag — la métrique qui parle */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <CommissionPill value={data.commission} color={tier.color} />
            {data.priorityHours !== null && (
              <PriorityPill hours={data.priorityHours} color={tier.color} />
            )}
          </div>
        </div>
      </div>

      {/* Rewards list */}
      <ul className="relative mt-5 space-y-2">
        {data.rewards.map((r, i) => (
          <RewardLine key={i} reward={r} color={tier.color} />
        ))}
      </ul>
    </article>
  );
}

// ─── Accordion variant ───────────────────────────────────────────────────

function RewardAccordion({
  tierId,
  isOpen,
  isCurrent,
  onToggle,
}: {
  tierId: TierId;
  isOpen: boolean;
  isCurrent?: boolean;
  onToggle: () => void;
}) {
  const tier = TIERS[tierId];
  const data = REWARDS[tierId];
  return (
    <li
      className={cn(
        "rounded-2xl bg-white ring-1 ring-inset transition-all",
        isCurrent ? "ring-2" : "ring-ink-700/10",
      )}
      style={
        isCurrent
          ? { boxShadow: `0 0 0 2px ${tier.color}, 0 8px 20px -10px ${tier.color}55` }
          : undefined
      }
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 p-3 text-left"
        aria-expanded={isOpen}
      >
        <span
          className="grid place-items-center rounded-full shrink-0"
          style={{
            width: 40,
            height: 40,
            background: `radial-gradient(circle at 30% 25%, ${tier.highlight}, ${tier.color} 70%)`,
            boxShadow: `inset 0 2px 0 rgba(255,255,255,0.45)`,
          }}
        >
          <LeagueMascot tier={tier.id} size={28} />
        </span>
        <span className="flex-1 min-w-0">
          <span
            className="block font-display text-[14px] font-black tracking-tight"
            style={{ color: tier.color }}
          >
            {tier.label}
          </span>
          <span className="block text-[10.5px] text-mist-400">{tier.range} · {data.commission}% commission</span>
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-mist-400"
          aria-hidden
        >
          ▾
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
            className="overflow-hidden"
          >
            <ul className="space-y-1.5 px-3 pb-3">
              {data.rewards.map((r, i) => (
                <RewardLine key={i} reward={r} color={tier.color} />
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

// ─── Shared atoms ────────────────────────────────────────────────────────

function RewardLine({ reward, color }: { reward: Reward; color: string }) {
  const Icon = ICONS[reward.icon];
  return (
    <li className={cn("flex items-start gap-2.5", reward.hero && "font-medium")}>
      <span
        className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full shrink-0"
        style={{
          background: `${color}1A`,
          color,
        }}
      >
        <Icon className="h-3 w-3" strokeWidth={2.6} />
      </span>
      <span className="flex-1 min-w-0">
        <span
          className={cn(
            "block leading-snug",
            reward.hero ? "text-[13px] font-bold text-mist-50" : "text-[12.5px] text-mist-100",
          )}
        >
          {reward.label}
        </span>
        {reward.detail && (
          <span className="block text-[10.5px] text-mist-400 leading-snug mt-0.5">
            {reward.detail}
          </span>
        )}
      </span>
    </li>
  );
}

function CommissionPill({ value, color }: { value: number; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.10em]"
      style={{
        background: value === 0 ? `${color}33` : `${color}1A`,
        color,
        boxShadow: `inset 0 0 0 1px ${color}33`,
      }}
    >
      <Percent className="h-2.5 w-2.5" strokeWidth={2.8} />
      {value}% commission
    </span>
  );
}

function PriorityPill({ hours, color }: { hours: number; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.10em]"
      style={{
        background: `${color}1A`,
        color,
        boxShadow: `inset 0 0 0 1px ${color}33`,
      }}
    >
      <Zap className="h-2.5 w-2.5" strokeWidth={2.8} />
      Réponse &lt; {hours}h
    </span>
  );
}
