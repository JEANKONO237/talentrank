import {
  Activity,
  BadgeCheck,
  Crown,
  Film,
  Flame,
  Globe2,
  Lock,
  Sparkles,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type BadgeId =
  | "available"
  | "in-demand"
  | "showreel-verified"
  | "fast-responder"
  | "international"
  | "top10"
  | "unreal-specialist"
  | "visual-storytelling"
  | "senior"
  | "recently-hired"
  | "active";

export interface BadgeDef {
  id: BadgeId;
  label: string;
  icon: LucideIcon;
  tone: "green" | "amber" | "cyan" | "violet" | "pink" | "mist";
}

export const BADGES: Record<BadgeId, BadgeDef> = {
  available: { id: "available", label: "Available Now", icon: Activity, tone: "green" },
  "in-demand": { id: "in-demand", label: "In High Demand", icon: Flame, tone: "amber" },
  "showreel-verified": { id: "showreel-verified", label: "Showreel Verified", icon: Film, tone: "cyan" },
  "fast-responder": { id: "fast-responder", label: "Fast Responder", icon: Zap, tone: "amber" },
  international: { id: "international", label: "International", icon: Globe2, tone: "cyan" },
  top10: { id: "top10", label: "Top 10% Global", icon: Trophy, tone: "amber" },
  "unreal-specialist": { id: "unreal-specialist", label: "Unreal Specialist", icon: Sparkles, tone: "amber" },
  "visual-storytelling": { id: "visual-storytelling", label: "Visual Storytelling", icon: BadgeCheck, tone: "violet" },
  senior: { id: "senior", label: "Senior Artist", icon: Crown, tone: "cyan" },
  "recently-hired": { id: "recently-hired", label: "On Mission", icon: Lock, tone: "mist" },
  active: { id: "active", label: "Highly Active", icon: Activity, tone: "green" },
};

export const TONE_STYLES: Record<BadgeDef["tone"], { bg: string; text: string; ring: string; dot: string }> = {
  green: {
    bg: "bg-signal-green/10",
    text: "text-signal-green",
    ring: "ring-signal-green/30",
    dot: "bg-signal-green",
  },
  amber: {
    bg: "bg-amber-400/10",
    text: "text-amber-300",
    ring: "ring-amber-400/30",
    dot: "bg-amber-400",
  },
  cyan: {
    bg: "bg-cyan-400/10",
    text: "text-cyan-300",
    ring: "ring-cyan-400/30",
    dot: "bg-cyan-400",
  },
  violet: {
    bg: "bg-violet-400/10",
    text: "text-violet-300",
    ring: "ring-violet-400/30",
    dot: "bg-violet-400",
  },
  pink: {
    bg: "bg-pink-400/10",
    text: "text-pink-300",
    ring: "ring-pink-400/30",
    dot: "bg-pink-400",
  },
  mist: {
    bg: "bg-mist-500/10",
    text: "text-mist-300",
    ring: "ring-mist-500/30",
    dot: "bg-mist-400",
  },
};
