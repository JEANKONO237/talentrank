import {
  Activity,
  Briefcase,
  Building2,
  Calculator,
  ChefHat,
  Code2,
  Cpu,
  GraduationCap,
  Hammer,
  HeartPulse,
  type LucideIcon,
  Music2,
  Newspaper,
  Package,
  Palette,
  Scale,
  Sparkles,
  Stethoscope,
  TrendingUp,
  Users,
  Wand2,
} from "lucide-react";
import type { ProfessionCategoryId } from "./professions";

// One Lucide icon per category. Used as the small overlay chip on avatars
// and as the visual marker in the ranking scope tabs.
export const CATEGORY_ICONS: Record<ProfessionCategoryId, LucideIcon> = {
  tech: Code2,
  creative: Palette,
  business: Briefcase,
  finance: Calculator,
  marketing: TrendingUp,
  product: Wand2,
  data: Cpu,
  engineering: Activity,
  health: Stethoscope,
  education: GraduationCap,
  hospitality: ChefHat,
  logistics: Package,
  media: Newspaper,
  music: Music2,
  architecture: Building2,
  legal: Scale,
  hr: Users,
  trades: Hammer,
  other: Sparkles,
};

export function iconForCategory(id: ProfessionCategoryId): LucideIcon {
  return CATEGORY_ICONS[id] ?? Sparkles;
}

// Doctors/nurses are tagged with health icons we want slightly different.
// (kept simple for now — category-level mapping is enough for v1)
export const FALLBACK_HEALTH_ICON = HeartPulse;
