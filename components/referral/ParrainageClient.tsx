"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Copy,
  Crown,
  Mail,
  Share2,
  Sparkles,
  Twitter,
  Users,
  Zap,
} from "lucide-react";
import { LeagueMascot } from "@/components/ui/LeagueMascot";
import { logInviteSent, useReferral } from "@/lib/referral/storage";
import { triggerHaptic } from "@/lib/haptic";
import { playShortlist, playWiggle } from "@/lib/audio/sounds";
import { track } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// ParrainageClient — page programme de parrainage (audit Sasha G3-Sasha-4).
//
// 3 actions clés :
//   1. Copier ton lien parrainage (un clic, toast confirm)
//   2. Partager via Twitter / WhatsApp / Email (deep-link share APIs)
//   3. Voir ta progression : 0/3 → 1/3 → 2/3 → 3/3 = Ambassadeur unlocked
//
// Récompenses progressives :
//   1 invitation  → "Soutien" badge
//   2 invitations → priorité dans la queue (-50% temps d'attente)
//   3 invitations → "Ambassadeur" badge + accès direct, pas de queue
//
// Tout en localStorage v1, sera prod-ready quand auth + referrer tracking
// seront en DB.
// ─────────────────────────────────────────────────────────────────────────────

export function ParrainageClient() {
  const { slug, inviteUrl, count, hasJumpedQueue } = useReferral();
  const [copied, setCopied] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const handleCopy = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      triggerHaptic("medium");
      playWiggle();
      track("referral_link_copied", { source: "parrainage_page" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  const shareTwitter = () => {
    const text = encodeURIComponent(
      "Je rejoins TalentRank — le classement par métier qui sort les meilleurs talents. Invitation beta :",
    );
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(inviteUrl)}`,
      "_blank",
    );
    logInviteSent();
    triggerHaptic("medium");
    track("referral_invite_sent", { channel: "twitter" });
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(
      `Yo. Je viens d'arriver sur TalentRank, jette un œil : ${inviteUrl}`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
    logInviteSent();
    triggerHaptic("medium");
    track("referral_invite_sent", { channel: "whatsapp" });
  };

  const sendEmail = () => {
    const trimmed = emailInput.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return;
    const subject = encodeURIComponent("Rejoins-moi sur TalentRank");
    const body = encodeURIComponent(
      `Salut,\n\nJe rejoins TalentRank, un système de classement par métier (animation 3D, dev frontend, boulangerie, etc.). C'est en beta privée.\n\nMon lien d'invitation :\n${inviteUrl}\n\nÀ tout',`,
    );
    window.location.href = `mailto:${trimmed}?subject=${subject}&body=${body}`;
    logInviteSent(trimmed);
    setEmailInput("");
    setEmailSent(true);
    triggerHaptic("medium");
    playShortlist();
    track("referral_invite_sent", { channel: "email" });
    setTimeout(() => setEmailSent(false), 2200);
  };

  const remaining = Math.max(0, 3 - count);

  return (
    <div className="container-page pt-12 pb-20">
      <Link
        href="/talent"
        className="inline-flex items-center gap-1.5 text-[12px] font-bold text-mist-400 hover:text-mist-50 transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.6} />
        Accueil
      </Link>

      {/* Hero */}
      <header className="mt-10 max-w-2xl mx-auto text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-mist-400">
          Programme de parrainage
        </p>
        <h1
          className="mt-4 font-display font-black tracking-tight text-mist-50"
          style={{
            fontSize: "clamp(2.2rem, 5vw, 3.4rem)",
            lineHeight: 1.02,
            letterSpacing: "-0.025em",
          }}
        >
          Invite 3 amis,{" "}
          <span className="relative inline-block">
            saute la queue.
            <span
              aria-hidden
              className="absolute left-0 right-0 -bottom-1 sm:-bottom-1.5 h-[5px] sm:h-[6px] rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, rgba(255,200,0,0.3) 0%, rgba(255,200,0,0.65) 50%, rgba(255,200,0,0.3) 100%)",
              }}
            />
          </span>
        </h1>
        <p className="mt-6 text-[14.5px] text-mist-300 leading-relaxed">
          TalentRank est en beta privée. Les talents qui amènent 3 amis passent
          devant. Et débloquent le badge{" "}
          <span className="font-bold text-amber-700">Ambassadeur</span>.
        </p>
      </header>

      {/* Progression */}
      <section className="mt-10 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
          className="card-cream p-7 sm:p-8 text-center relative overflow-hidden"
        >
          {/* Halo */}
          <span
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-40 blur-3xl"
            style={{ background: "#F59E0B" }}
          />

          {/* Mascotte Lion si Ambassadeur, sinon Loup */}
          <div className="relative flex justify-center mb-4">
            <div
              className="grid place-items-center rounded-full"
              style={{
                width: 90,
                height: 90,
                background: hasJumpedQueue
                  ? "radial-gradient(circle at 30% 25%, #FFE082, #F59E0B 60%, #B45309 100%)"
                  : "radial-gradient(circle at 30% 25%, #CBD5E1, #94A3B8 60%, #475569 100%)",
                boxShadow: `0 16px 32px -8px ${hasJumpedQueue ? "rgba(245,158,11,0.55)" : "rgba(100,116,139,0.45)"}, inset 0 3px 0 rgba(255,255,255,0.55), inset 0 -14px 22px -8px rgba(0,0,0,0.35)`,
              }}
            >
              <LeagueMascot
                tier={hasJumpedQueue ? "senior" : "rising"}
                size={62}
                className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]"
              />
            </div>
          </div>

          <p className="relative text-[10.5px] font-bold uppercase tracking-[0.18em] text-amber-800">
            {hasJumpedQueue ? "Ambassadeur · Queue sautée" : "Ton statut"}
          </p>
          <p className="relative mt-2 font-display text-[28px] font-black text-mist-50 tabular-nums">
            {count} / 3 invitations
          </p>
          {!hasJumpedQueue && remaining > 0 && (
            <p className="relative mt-1 text-[13px] text-mist-300">
              Encore <span className="font-bold text-amber-800">{remaining}</span>{" "}
              {remaining > 1 ? "invitations" : "invitation"} et tu sautes la queue.
            </p>
          )}
          {hasJumpedQueue && (
            <p className="relative mt-1 text-[13px] text-emerald-700 font-bold">
              <Check className="inline-block h-3.5 w-3.5 -mt-0.5 mr-1" strokeWidth={3} />
              Accès direct au launch. Pas de queue.
            </p>
          )}

          {/* Progress bar */}
          <div className="relative mt-5 max-w-xs mx-auto">
            <div
              className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/70"
              style={{ boxShadow: "inset 0 1px 2px rgba(0,0,0,0.10)" }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (count / 3) * 100)}%` }}
                transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                className="relative h-full rounded-full"
                style={{
                  background: hasJumpedQueue
                    ? "linear-gradient(90deg, #F59E0B, #B45309)"
                    : "linear-gradient(90deg, #F59E0B, #22D3EE)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
                }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[9.5px] font-bold uppercase tracking-[0.12em] text-mist-400">
              <span>0</span>
              <span>1 · Soutien</span>
              <span>2 · Priority</span>
              <span className="text-amber-700">3 · Ambassadeur</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Share zone */}
      <section className="mt-10 max-w-2xl mx-auto">
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.22em] text-mist-400 mb-5">
          <Share2 className="inline-block h-3 w-3 -mt-0.5 mr-1" strokeWidth={2.6} />
          Ton lien d&apos;invitation
        </p>

        {/* Lien copy-paste */}
        <div className="card-white p-3 flex items-center gap-2">
          <span className="font-mono text-[12.5px] text-mist-200 truncate flex-1 px-2">
            {inviteUrl || "…"}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[11.5px] font-bold uppercase tracking-[0.06em] transition",
              copied
                ? "bg-emerald-100 text-emerald-800"
                : "bg-night-700 hover:bg-night-600 text-white",
            )}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" strokeWidth={2.8} />
                Copié
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" strokeWidth={2.6} />
                Copier
              </>
            )}
          </button>
        </div>

        {/* Boutons share */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={shareTwitter}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white hover:bg-ink-850 ring-1 ring-inset ring-ink-700/10 text-mist-100 px-4 text-[12.5px] font-bold transition"
          >
            <Twitter className="h-4 w-4" strokeWidth={2.4} />
            Twitter / X
          </button>
          <button
            type="button"
            onClick={shareWhatsApp}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-4 text-[12.5px] font-bold transition"
          >
            <Share2 className="h-4 w-4" strokeWidth={2.4} />
            WhatsApp
          </button>
        </div>

        {/* Email envoi direct */}
        <div className="mt-5 card-white p-4">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-mist-400 mb-2">
            <Mail className="inline-block h-3 w-3 -mt-0.5 mr-1" strokeWidth={2.6} />
            Ou envoie directement par email
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.currentTarget.value)}
              placeholder="ami@example.com"
              className="flex-1 h-10 rounded-xl bg-ink-850 ring-1 ring-inset ring-ink-700/15 focus:ring-2 focus:ring-night-700/50 px-3 text-[13px] text-mist-50 placeholder:text-mist-400 outline-none transition"
            />
            <button
              type="button"
              onClick={sendEmail}
              disabled={!emailInput.includes("@") || emailSent}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-4 text-[11.5px] font-bold uppercase tracking-[0.06em] transition disabled:opacity-50"
            >
              {emailSent ? (
                <>
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  Envoyé
                </>
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5" strokeWidth={2.6} />
                  Inviter
                </>
              )}
            </button>
          </div>
          <p className="mt-2 text-[10.5px] text-mist-400">
            On ouvre ton client mail avec le texte pré-rempli. Tu peux personnaliser avant d&apos;envoyer.
          </p>
        </div>
      </section>

      {/* ─── Leaderboard parrains — la mécanique virale qui boucle.
          Voir les autres ambassadeurs en tête crée la comparaison sociale
          ("je peux le dépasser"). Le user courant est inséré dans la liste
          en mode highlight pour qu'il se positionne. */}
      <AmbassadorLeaderboard userCount={count} userSlug={slug} />

      {/* Foot note */}
      <footer className="mt-12 text-center">
        <p className="text-[11.5px] text-mist-400 max-w-md mx-auto">
          <Sparkles className="inline-block h-3 w-3 -mt-0.5 mr-1 text-amber-600" strokeWidth={2.6} />
          Les invitations sont stockées localement pour l&apos;instant. Quand
          le launch live, on les valide automatiquement.
        </p>
      </footer>
    </div>
  );
}

// ─── Leaderboard parrains ───────────────────────────────────────────────────
//
// Seed data — top 10 ambassadeurs mock pour la beta. Quand Supabase sera
// branché : remplacer par une requête SELECT count(*) FROM invites GROUP BY
// referrer_id ORDER BY count DESC LIMIT 10. Pour la v1 c'est honnête : on
// déclare clairement que ce sont des chiffres beta (cf. footer).

interface Ambassador {
  slug: string;
  name: string;
  metier: string;
  city: string;
  count: number;
  badge?: "founder" | "ambassador";
}

const SEED_AMBASSADORS: Ambassador[] = [
  { slug: "aya-tanaka", name: "Aya Tanaka", metier: "Char. Animator", city: "Tokyo", count: 28, badge: "founder" },
  { slug: "lina-park", name: "Lina Park", metier: "Lighting Artist", city: "Seoul", count: 24 },
  { slug: "kofi-mensah", name: "Kofi Mensah", metier: "VFX Supervisor", city: "Lagos", count: 21 },
  { slug: "marc-dubois", name: "Marc Dubois", metier: "Motion Designer", city: "Paris", count: 18 },
  { slug: "elena-rossi", name: "Elena Rossi", metier: "3D Generalist", city: "Milan", count: 16 },
  { slug: "yusuf-ali", name: "Yusuf Ali", metier: "Concept Artist", city: "Istanbul", count: 13 },
  { slug: "nora-h", name: "Nora H.", metier: "Compositor", city: "Copenhague", count: 11 },
  { slug: "diego-luna", name: "Diego Luna", metier: "Rigger", city: "Mexico", count: 10 },
  { slug: "sara-gomez", name: "Sara Gomez", metier: "FX TD", city: "Madrid", count: 9 },
  { slug: "leo-tan", name: "Leo Tan", metier: "Game Designer", city: "Singapour", count: 8 },
];

function AmbassadorLeaderboard({
  userCount,
  userSlug,
}: {
  userCount: number;
  userSlug: string | null;
}) {
  // Construction de la liste affichée :
  //  1. On part du seed top 10
  //  2. On insère le user courant (s'il a au moins 1 invitation) à la bonne
  //     position de tri. S'il bat un seed, il remonte ; sinon il apparaît
  //     en bas avec un séparateur.
  const userEntry: Ambassador | null =
    userCount > 0 && userSlug
      ? {
          slug: userSlug,
          name: "Toi",
          metier: "Toi",
          city: "—",
          count: userCount,
        }
      : null;

  const combined = userEntry
    ? [...SEED_AMBASSADORS, { ...userEntry, _isUser: true } as Ambassador & { _isUser: true }]
    : SEED_AMBASSADORS.map((a) => ({ ...a, _isUser: false }));

  const sorted = [...combined].sort((a, b) => b.count - a.count);
  // Garde Top 10 + le user s'il est hors Top 10
  const top = sorted.slice(0, 10);
  const userInTop = userEntry ? top.some((a) => (a as Ambassador & { _isUser?: boolean })._isUser) : true;
  const userRank = userEntry
    ? sorted.findIndex((a) => (a as Ambassador & { _isUser?: boolean })._isUser) + 1
    : null;

  return (
    <section className="mt-16 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-5">
        <Crown className="h-3.5 w-3.5 text-amber-700" strokeWidth={2.8} />
        <h2 className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-amber-800">
          Top ambassadeurs · beta
        </h2>
        <span className="h-px flex-1 bg-amber-200/60" />
        <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-mist-400 inline-flex items-center gap-1">
          <Users className="h-3 w-3" strokeWidth={2.6} />
          {SEED_AMBASSADORS.length}+ parrains
        </span>
      </div>

      <ol className="card-white divide-y divide-ink-700/10 overflow-hidden">
        {top.map((a, i) => (
          <LeaderboardEntry
            key={a.slug + i}
            rank={i + 1}
            ambassador={a}
            isUser={(a as Ambassador & { _isUser?: boolean })._isUser ?? false}
          />
        ))}

        {/* Si user pas dans le top 10 mais a au moins 1 invitation,
            on l'affiche en bas avec un séparateur ellipsis. */}
        {!userInTop && userEntry && userRank && (
          <>
            <li className="px-4 py-2 text-center text-[10.5px] text-mist-400 tracking-[0.2em]">
              · · ·
            </li>
            <LeaderboardEntry
              rank={userRank}
              ambassador={userEntry}
              isUser
            />
          </>
        )}
      </ol>

      <p className="mt-3 text-center text-[10.5px] text-mist-400">
        Chiffres beta — les vraies stats arrivent quand la base prod sera live.
      </p>
    </section>
  );
}

function LeaderboardEntry({
  rank,
  ambassador: a,
  isUser,
}: {
  rank: number;
  ambassador: Ambassador;
  isUser: boolean;
}) {
  // Médailles or/argent/bronze pour le podium
  const medal = rank === 1 ? "#FFC800" : rank === 2 ? "#94A3B8" : rank === 3 ? "#C97A3B" : null;
  const initials = a.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <li
      className={cn(
        "flex items-center gap-3 px-4 py-3 transition",
        isUser && "bg-amber-50 ring-1 ring-inset ring-amber-300/50",
      )}
    >
      {/* Rank */}
      <span
        className="grid h-7 w-7 place-items-center rounded-full font-mono text-[11px] font-black tabular-nums shrink-0"
        style={
          medal
            ? {
                background: `radial-gradient(circle at 30% 25%, ${medal}, ${medal}cc 60%, ${medal}88 100%)`,
                color: "#1B1208",
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 4px ${medal}55`,
              }
            : { background: "#F1F5F9", color: "#475569" }
        }
      >
        {rank}
      </span>

      {/* Avatar initials */}
      <span
        className={cn(
          "grid h-9 w-9 place-items-center rounded-xl font-display text-[12px] font-black shrink-0",
          isUser ? "bg-amber-200 text-amber-900" : "bg-ink-100 text-mist-100",
        )}
      >
        {isUser ? "★" : initials}
      </span>

      {/* Identity */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate font-display text-[13.5px] font-bold tracking-tight",
            isUser ? "text-amber-900" : "text-mist-50",
          )}
        >
          {isUser ? "C'est toi" : a.name}
          {a.badge === "founder" && (
            <span
              className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.08em] align-middle"
              title="Founder ambassador"
            >
              <Crown className="h-2.5 w-2.5" strokeWidth={2.8} />
              Founder
            </span>
          )}
        </p>
        {!isUser && (
          <p className="truncate text-[11px] text-mist-400">
            {a.metier} · {a.city}
          </p>
        )}
        {isUser && (
          <p className="truncate text-[11px] text-amber-700">
            Garde le rythme — l&apos;Ambassadeur t&apos;attend
          </p>
        )}
      </div>

      {/* Count */}
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black tabular-nums shrink-0",
          isUser
            ? "bg-amber-600 text-white"
            : "bg-ink-50 text-mist-100 ring-1 ring-inset ring-ink-700/10",
        )}
      >
        {a.count}
        <Users className="h-3 w-3 opacity-80" strokeWidth={2.6} />
      </span>
    </li>
  );
}

