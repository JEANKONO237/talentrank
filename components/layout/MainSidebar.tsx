"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Briefcase,
  CreditCard,
  Inbox,
  type LucideIcon,
  MessageCircle,
  UserCircle2,
  Users,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useMuted } from "@/lib/audio/sounds";
import { Logo } from "@/components/ui/Logo";
import { LeagueMascot } from "@/components/ui/LeagueMascot";
import { SidebarIcon, type SidebarIconName } from "@/components/ui/SidebarIcon";
import { cn } from "@/lib/utils";
import type { TierId } from "@/lib/tiers";
import {
  levelForXp,
  progressInLevel,
  xpToNextLevel,
  currentMilestone,
} from "@/lib/xp";
import { useAudience } from "@/lib/audience/client";
import { AUDIENCE_META, type Audience } from "@/lib/audience/types";

// ─────────────────────────────────────────────────────────────────────────────
// MainSidebar — vertical navigation, visible on EVERY page.
// Replaces the legacy top Navbar entirely. Sits fixed at the left edge.
// Two width modes:
//   - desktop (lg+): 256px expanded, labels visible
//   - small (< lg):  88px collapsed, icons only
//
// Visual style: white translucent surface with backdrop blur, illustrated
// chunky icons, soft hover + active states.
// ─────────────────────────────────────────────────────────────────────────────

interface NavItem {
  href: string;
  label: string;
  /** Soit une icône illustrée (PNG/SVG chunky pour les actions principales),
   *  soit une icône lucide-react (line) pour les routes secondaires. */
  icon?: SidebarIconName;
  lucide?: LucideIcon;
  /** Couleur d'accent pour la chip lucide. Default cyan. */
  lucideTint?: string;
}

// ─── 2 sidebars distinctes selon l'audience ─────────────────────────────
// Spec user (architecture v3) :
//
//   TALENT (5 items)
//     1. Mon QCM      → /qcm
//     2. Classements  → /ranking
//     3. Mon Profil   → /dashboard/talent/profile
//     4. Opportunités → /opportunites
//     5. Messagerie   → /messages
//
//   ENTREPRISE (6 items)
//     1. Chasse       → /chasse
//     2. Candidats    → /candidats
//     3. Classements  → /ranking
//     4. QCM & Éval.  → /qcm-builder
//     5. Messagerie   → /messages
//     6. Abonnement   → /abonnement
//
// Les illustrations PNG/SVG existantes couvrent qcm/ranking/profil/chasse.
// Pour Opportunités/Messagerie/Candidats/Abonnement → lucide line icons
// avec une chip de couleur (cohérent avec le reste sans dupliquer le PNG style).

const NAV_TALENT: NavItem[] = [
  { href: "/qcm",                      label: "Mon QCM",      icon: "qcm" },
  { href: "/ranking",                  label: "Classements",  icon: "ranking" },
  { href: "/dashboard/talent/profile", label: "Mon profil",   icon: "profil" },
  { href: "/opportunites",             label: "Opportunités", lucide: Inbox,        lucideTint: "#F59E0B" },
  { href: "/messages",                 label: "Messagerie",   lucide: MessageCircle, lucideTint: "#1CB0F6" },
];

const NAV_STUDIO: NavItem[] = [
  { href: "/chasse",        label: "Chasse",       icon: "chasse" },
  { href: "/candidats",     label: "Candidats",    lucide: Users,         lucideTint: "#22D3EE" },
  { href: "/ranking",       label: "Classements",  icon: "ranking" },
  { href: "/qcm-builder",   label: "QCM & Éval.",  lucide: Briefcase,     lucideTint: "#A78BFA" },
  { href: "/messages",      label: "Messagerie",   lucide: MessageCircle, lucideTint: "#1CB0F6" },
  { href: "/abonnement",    label: "Abonnement",   lucide: CreditCard,    lucideTint: "#10B981" },
];

function navFor(audience: Audience | null): NavItem[] {
  if (audience === "studio") return NAV_STUDIO;
  // Par défaut talent (cas où le user n'a pas encore choisi mais on est
  // sur une route avec sidebar — improbable mais filet de sécurité)
  return NAV_TALENT;
}

export function MainSidebar() {
  const pathname = usePathname();
  const { audience } = useAudience();
  const NAV = navFor(audience);

  return (
    <nav
      aria-label="Navigation principale"
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col",
        "w-[88px] lg:w-[256px]",
        "py-6 px-3 lg:px-4",
        "bg-white/85 backdrop-blur-xl",
        "border-r border-ink-700/8",
      )}
      style={{
        boxShadow:
          "inset -1px 0 0 rgba(0,0,0,0.04), 4px 0 24px -20px rgba(0,0,0,0.18)",
      }}
    >
      {/* Logo — pointe vers la home de l'audience courante */}
      <Link
        href={audience === "studio" ? "/studio" : "/talent"}
        className="grid lg:flex lg:items-center lg:gap-2 place-items-center h-10 lg:h-11 px-1 lg:px-2 mb-2"
        aria-label="TalentRank — Accueil"
      >
        <span className="lg:hidden">
          <Logo size={30} withWordmark={false} audience={audience} />
        </span>
        <span className="hidden lg:inline-flex">
          <Logo size={30} withWordmark audience={audience} />
        </span>
      </Link>

      {/* Badge audience visible — audit Marco G2-Marco-5 : le toggle en bas
          était invisible 80% du temps. Une pill TALENT/STUDIO juste sous le
          logo signale en permanence le mode actuel + sert d'ancrage pour
          repérer le toggle complet en bas. */}
      <AudienceBadge audience={audience} />

      {/* Primary nav — 6 items, jamais plus */}
      <ul className="flex-1 space-y-1 overflow-y-auto -mr-2 pr-2 lg:-mr-1 lg:pr-1">
        {NAV.map((item) => (
          <SidebarItem
            key={item.href}
            item={item}
            active={isActive(pathname, item.href)}
          />
        ))}
      </ul>

      {/* Compagnon utilisateur en bas — Duolingo / Discord / Steam style */}
      <UserCompanion audience={audience} />

      {/* Audience switcher discret — permet de changer d'univers à tout
          moment sans aller dans les settings. Visible mode expanded only. */}
      <AudienceSwitcher current={audience} />
    </nav>
  );
}

// ─── Audience badge (haut de sidebar) ────────────────────────────────────
// Pill TALENT/STUDIO visible en permanence sous le logo. Clic = scroll vers
// le toggle complet en bas (qui permet de switcher).
function AudienceBadge({ audience }: { audience: Audience | null }) {
  if (!audience) return null;
  const meta = AUDIENCE_META[audience];
  return (
    <div className="flex justify-center lg:justify-start mb-5 lg:px-1">
      <a
        href="#audience-switcher"
        className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[9.5px] font-black uppercase tracking-[0.18em] transition hover:scale-105"
        style={{
          background: `${meta.accent}15`,
          color: meta.accent,
          boxShadow: `inset 0 0 0 1px ${meta.accent}30`,
        }}
        aria-label={`Mode ${meta.label} actif — clic pour changer`}
        title={`Mode ${meta.label} actif`}
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{
            background: meta.accent,
            boxShadow: `0 0 6px ${meta.accent}`,
          }}
          aria-hidden
        />
        <span className="hidden lg:inline">{meta.label}</span>
        <span className="lg:hidden">{audience === "studio" ? "E" : "T"}</span>
      </a>
    </div>
  );
}

// ─── Audience switcher (vrai toggle ON/OFF) ──────────────────────────────
// Visuel : segmented control 2 positions Talent | Entreprise.
// La position active prend la couleur brand (ambre prestige côté talent,
// bleu nuit côté entreprise) avec ombre. Cliquer l'autre position bascule.
// Plus de mini-lien : c'est ÉVIDENT qu'on est ici pour switcher.

import { resetAudience } from "@/app/welcome/reset-action";
import { triggerHaptic } from "@/lib/haptic";

function AudienceSwitcher({ current }: { current: Audience | null }) {
  const { setAudience } = useAudience();
  if (!current) return null;

  const handleSwitch = (target: Audience) => {
    if (target === current) return;
    triggerHaptic("medium");
    setAudience(target);
    // Hard nav pour reload le cookie côté server (sidebar items + layout)
    window.location.href = `/${target}`;
  };

  return (
    <div id="audience-switcher" className="hidden lg:block mt-3 pt-3 border-t border-ink-700/8 scroll-mt-4">
      {/* Eyebrow */}
      <p className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-mist-400 text-center mb-2">
        Mode actuel
      </p>

      {/* Le toggle 2 positions — vraiment visible */}
      <div
        role="tablist"
        aria-label="Basculer entre Talent et Entreprise"
        className="relative grid grid-cols-2 gap-0 rounded-full p-1 bg-ink-850 ring-1 ring-inset ring-ink-700/15"
        style={{
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.08)",
        }}
      >
        <ToggleOption
          audience="talent"
          label="Talent"
          icon={UserCircle2}
          active={current === "talent"}
          onClick={() => handleSwitch("talent")}
        />
        <ToggleOption
          audience="studio"
          label="Entreprise"
          icon={Briefcase}
          active={current === "studio"}
          onClick={() => handleSwitch("studio")}
        />
      </div>

      {/* Reset audience → /welcome — discret, en dernier recours */}
      <form action={resetAudience} className="mt-2">
        <button
          type="submit"
          className="w-full text-center text-[10px] font-medium text-mist-400 hover:text-mist-100 transition py-1"
        >
          ↻ Recommencer depuis le choix
        </button>
      </form>

      {/* Mute toggle — pour les open-spaces */}
      <MuteToggle />
    </div>
  );
}

// Audit Charlotte G1-Charlotte-3 : icon-only, plus de label texte
// "Son coupé/activé" qui faisait jargon dans la sidebar. Tooltip au hover via
// title attribute. Position en flottant haut-droite plutôt que pleine largeur.
function MuteToggle() {
  const { muted, toggle } = useMuted();
  return (
    <div className="mt-2 hidden lg:flex flex-col items-center gap-2">
      {/* Mini-links discrets vers les pages annexes (audit Sasha) */}
      <nav
        aria-label="Liens secondaires"
        className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[10px] text-mist-400"
      >
        <Link href="/about" className="hover:text-mist-100 transition">
          À propos
        </Link>
        <span aria-hidden>·</span>
        <Link href="/pricing" className="hover:text-mist-100 transition">
          Tarifs
        </Link>
        <span aria-hidden>·</span>
        <Link href="/parrainage" className="hover:text-mist-100 transition">
          Parrain
        </Link>
      </nav>

      {/* Mute toggle icon-only avec focus-visible ring (audit Anya) */}
      <button
        type="button"
        onClick={toggle}
        className="grid h-7 w-7 place-items-center rounded-full bg-white ring-1 ring-inset ring-ink-700/8 text-mist-400 hover:text-mist-100 hover:bg-ink-850 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2"
        aria-pressed={muted}
        aria-label={muted ? "Activer le son" : "Couper le son"}
        title={muted ? "Activer le son" : "Couper le son"}
      >
        {muted ? (
          <VolumeX className="h-3 w-3" strokeWidth={2.4} />
        ) : (
          <Volume2 className="h-3 w-3" strokeWidth={2.4} />
        )}
      </button>
    </div>
  );
}

function ToggleOption({
  audience,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  audience: Audience;
  label: string;
  icon: typeof UserCircle2;
  active: boolean;
  onClick: () => void;
}) {
  const meta = AUDIENCE_META[audience];
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 transition-all duration-200",
        "text-[11.5px] font-bold",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-1",
        active ? "text-white" : "text-mist-300 hover:text-mist-100",
      )}
      style={
        active
          ? {
              background: meta.accent,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.18), 0 4px 12px -4px ${meta.accent}88`,
            }
          : undefined
      }
    >
      <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
      <span className="truncate">{label}</span>
      {active && (
        <span
          aria-hidden
          className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-500"
          style={{ boxShadow: "0 0 6px rgba(16,185,129,0.7)" }}
          title="Mode actif"
        />
      )}
    </button>
  );
}

// ─── User companion ─────────────────────────────────────────────────────
// Mode démo : Jean-Marie. Quand Supabase auth sera branché, on lit la session.
// Compact en mode collapsed (88px), riche en mode expanded (256px+).
//
// V2 polish (sidebar pass) :
//   - tier mini-mascotte en peek à côté de l'avatar (cohérence brand)
//   - hover lift sur tout le bloc (comme les WorldCards)
//   - progress bar avec inner shadow + glow au bout (richesse)
//   - shadow vocabulaire aligné sur le reste (inset top + soft drop)
function UserCompanion({ audience }: { audience: Audience | null }) {
  // Demo data — replace with real session profile later.
  // V3 (xp pass) : on stocke maintenant l'XP global, le niveau dérive.
  const user = {
    initials: "JM",
    name: "Jean Marie O.",
    tier: "Or",
    tierMascot: "senior" as TierId,
    tierColor: "#F59E0B",
    score: 88,
    xp: 2840,
  };

  const level = levelForXp(user.xp);
  const milestone = currentMilestone(level);
  const progressPct = Math.round(progressInLevel(user.xp) * 100);
  const xpRemaining = xpToNextLevel(user.xp);

  // Pointe vers le dashboard de l'audience courante (talent ou studio).
  const dashboardHref =
    audience === "studio" ? "/dashboard/studio" : "/dashboard/talent";

  return (
    <Link
      href={dashboardHref}
      className="mt-3 pt-3 border-t border-ink-700/8 group block"
      aria-label={`Mon profil — ${user.tier} ${user.score} · Niveau ${level} ${milestone.title}`}
    >
      {/* Compact mode (< lg): just avatar centered with mascot peek + level badge */}
      <div className="lg:hidden flex justify-center">
        <AvatarWithMascot initials={user.initials} mascot={user.tierMascot} level={level} />
      </div>

      {/* Expanded mode (lg+): full companion block */}
      <div
        className="hidden lg:block rounded-2xl p-2.5 -mx-1 transition-all duration-200 group-hover:bg-white/70 group-hover:-translate-y-0.5"
      >
        {/* Label audience-aware — différencie talent (Mon Classement) vs
            studio (Ma Chasse). Demande user explicite. */}
        <p
          className="text-[9.5px] font-bold uppercase tracking-[0.18em] mb-1.5"
          style={{ color: audience === "studio" ? "#1A2535" : "#B45309" }}
        >
          {audience === "studio" ? "🎯 Ma chasse" : "🏆 Mon classement"}
        </p>

        <div className="flex items-center gap-2.5">
          <AvatarWithMascot initials={user.initials} mascot={user.tierMascot} level={level} />
          <div className="min-w-0 flex-1">
            <p className="font-display text-[12.5px] font-black text-mist-50 leading-tight truncate">
              {user.name}
            </p>
            <div className="mt-1 flex items-center gap-1 flex-wrap">
              <span
                className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.12em]"
                style={{
                  background: `${user.tierColor}22`,
                  color: user.tierColor,
                  boxShadow: `inset 0 0 0 1px ${user.tierColor}33`,
                }}
              >
                <span
                  className="h-1 w-1 rounded-full"
                  style={{ background: user.tierColor, boxShadow: `0 0 6px ${user.tierColor}` }}
                />
                {user.tier} · {user.score}
              </span>
              <span
                className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.12em] bg-ink-800 text-mist-100"
                style={{ boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)" }}
                title={milestone.title}
              >
                Niv. {level}
              </span>
            </div>
          </div>
        </div>

        {/* XP progress to next level — la barre principale de la session */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.14em] text-mist-400 mb-1">
            <span className="truncate">
              {milestone.title}
              {xpRemaining > 0 && (
                <span className="ml-1 text-mist-300 font-medium normal-case tracking-normal">
                  · {xpRemaining} XP au lvl {level + 1}
                </span>
              )}
            </span>
            <span className="tabular-nums">{progressPct}%</span>
          </div>
          <div
            className="relative h-2 w-full overflow-hidden rounded-full bg-ink-800"
            style={{
              boxShadow: "inset 0 1px 2px rgba(0,0,0,0.10)",
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
              className="relative h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${user.tierColor}, #22D3EE)`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.4), 0 0 8px ${user.tierColor}66`,
              }}
            >
              {/* Tip glow */}
              <span
                aria-hidden
                className="absolute right-0 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full"
                style={{
                  background: "#FFFFFF",
                  boxShadow: `0 0 8px #22D3EE, 0 0 4px #FFFFFF`,
                  opacity: 0.9,
                }}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Avatar + tier mascot peek + level badge — la mascotte s'accroche en bas-droite
// comme un badge "membre confirmé", le niveau en haut-droite comme une plaque
// Discord. Réactive au hover : un petit wiggle.
function AvatarWithMascot({
  initials,
  mascot,
  level,
}: {
  initials: string;
  mascot: TierId;
  level: number;
}) {
  return (
    <span className="relative inline-block shrink-0">
      <span
        className="inline-grid h-10 w-10 place-items-center rounded-full font-display text-[12px] font-black text-white transition-transform duration-200 group-hover:scale-105"
        style={{
          background: "linear-gradient(160deg, #4D7EA8, #1F3A57)",
          boxShadow:
            "inset 0 2px 0 rgba(255,255,255,0.3), 0 6px 14px -4px rgba(0,0,0,0.25)",
        }}
      >
        {initials}
      </span>
      {/* Tier mascot peek — bottom right */}
      <motion.span
        aria-hidden
        whileHover={{ rotate: [0, -8, 6, 0], y: [0, -2, 0] }}
        className="absolute -bottom-1.5 -right-1.5 inline-flex items-center justify-center rounded-full bg-white ring-1 ring-ink-700/10"
        style={{
          width: 22,
          height: 22,
          boxShadow: "0 4px 10px -3px rgba(0,0,0,0.25)",
        }}
      >
        <LeagueMascot tier={mascot} size={18} />
      </motion.span>
      {/* Level badge — top right, Discord-style nameplate */}
      <span
        aria-hidden
        className="absolute -top-1.5 -right-2 inline-flex items-center justify-center rounded-full font-display text-[8.5px] font-black tabular-nums text-white"
        style={{
          minWidth: 20,
          height: 16,
          padding: "0 5px",
          background: "linear-gradient(180deg, #2C3E55, #1A2535)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.18), 0 3px 8px -2px rgba(0,0,0,0.45)",
          letterSpacing: "0.04em",
        }}
      >
        {level}
      </span>
    </span>
  );
}

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function SidebarItem({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <li>
      <Link
        href={item.href}
        className={cn(
          "group relative flex items-center justify-center lg:justify-start gap-3",
          "h-16 lg:h-16 lg:px-2 rounded-2xl transition-all duration-150",
          active
            ? "bg-white shadow-card ring-1 ring-ink-700/10"
            : "hover:bg-white/60 hover:ring-1 hover:ring-ink-700/8",
        )}
        aria-current={active ? "page" : undefined}
      >
        {/* Active icon floats gently — "you are here" cue à la Duolingo.
            Inactive icons stay static, only animating on hover.
            Choisit entre icône illustrée (item.icon) et lucide (item.lucide). */}
        {active ? (
          <motion.span
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="inline-flex"
          >
            <ItemGlyph item={item} active />
          </motion.span>
        ) : (
          <span className="inline-flex transition-transform duration-200 group-hover:scale-[1.08] group-hover:-rotate-2">
            <ItemGlyph item={item} />
          </span>
        )}
        <span
          className={cn(
            "hidden lg:inline font-menu text-[18px] font-bold tracking-tight truncate",
            active ? "text-mist-50" : "text-mist-100",
          )}
        >
          {item.label}
        </span>
        {active && (
          <span
            aria-hidden
            className="hidden lg:block absolute right-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-cyan-500"
            style={{ boxShadow: "0 0 8px rgba(28,176,246,0.6)" }}
          />
        )}
      </Link>
    </li>
  );
}

// ─── ItemGlyph : icône illustrée OU lucide chip ──────────────────────────
// Si item.icon défini → SidebarIcon (PNG/SVG chunky 52×52).
// Sinon si item.lucide défini → lucide line dans une chip colorée 52×52.

function ItemGlyph({ item, active = false }: { item: NavItem; active?: boolean }) {
  if (item.icon) {
    return (
      <SidebarIcon
        name={item.icon}
        size={52}
        className={cn(active && "scale-[1.06]")}
      />
    );
  }
  if (item.lucide) {
    const Lucide = item.lucide;
    const tint = item.lucideTint ?? "#1CB0F6";
    return (
      <span
        className={cn(
          "grid place-items-center rounded-2xl",
          active && "scale-[1.06]",
        )}
        style={{
          width: 52,
          height: 52,
          background: `${tint}15`,
          color: tint,
          boxShadow: `inset 0 0 0 1px ${tint}30`,
        }}
      >
        <Lucide className="h-6 w-6" strokeWidth={2.4} />
      </span>
    );
  }
  return null;
}
