import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  TALENTS as MOCK_TALENTS,
  getTalent as getMockTalent,
  getTopTalents as getMockTop,
  getTrendingTalents as getMockTrending,
  getAvailableTalents as getMockAvailable,
  type Talent,
} from "@/lib/mock-talents";
import type {
  PublicTalentViewRow,
  PortfolioItemRow,
  ExperienceRow,
} from "@/lib/supabase/database.types";

// ---------------------------------------------------------------------------
// Data adapter — single source of truth for the rest of the app.
// If Supabase is configured (env vars present), we hit the `public_talents`
// view. Otherwise we fall back to the in-memory mock data so the UI keeps
// rendering during early-stage development and demos.
// ---------------------------------------------------------------------------

function rowToTalent(row: PublicTalentViewRow): Talent {
  // Reverse-engineer a `Talent` shape from the view row. Portfolio + experiences
  // are loaded on-demand by the profile page (separate query).
  return {
    id: row.id,
    slug: row.username,
    name: row.display_name,
    handle: `@${row.username}`,
    initials: row.avatar_initials,
    countryCode: row.country_code,
    city: row.city ?? undefined,
    discipline: row.discipline,
    specialties: row.specialties ?? [],
    yearsExperience: row.years_experience,
    software: (row.software ?? []) as Talent["software"],
    languages: row.languages ?? [],
    workMode: row.work_mode,
    contractType: row.contract_type,
    availability: row.availability,
    availabilityNote: row.availability_note ?? undefined,
    bio: row.bio ?? "",
    tagline: row.tagline ?? "",
    showreelUrl: row.showreel_url ?? undefined,
    links: {
      artstation: row.artstation_url ?? undefined,
      vimeo: row.vimeo_url ?? undefined,
      youtube: row.youtube_url ?? undefined,
      linkedin: row.linkedin_url ?? undefined,
      website: undefined,
    },
    portfolio: [], // loaded separately on profile page
    experiences: [], // same
    score: row.score,
    percentile: Number(row.percentile),
    globalRank: row.global_rank ?? 0,
    disciplineRank: row.discipline_rank ?? 0,
    countryRank: row.country_rank ?? 0,
    badges: (row.badges ?? []) as Talent["badges"],
    responseHours: 6, // not in view yet
    projects: 0,
    endorsements: 0,
    avatarGradient: row.avatar_gradient,
    recentlyJoined:
      new Date(row.joined_at).getTime() > Date.now() - 1000 * 60 * 60 * 24 * 30,
    trending: false,
  };
}

// ─── Public reads ───────────────────────────────────────────────────────

export async function listTalents(): Promise<Talent[]> {
  if (!isSupabaseConfigured) return MOCK_TALENTS;
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("public_talents")
    .select("*")
    .order("score", { ascending: false });
  if (error || !data) return MOCK_TALENTS;
  return (data as PublicTalentViewRow[]).map(rowToTalent);
}

export async function getTopTalents(n: number = 10): Promise<Talent[]> {
  if (!isSupabaseConfigured) return getMockTop(n);
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("public_talents")
    .select("*")
    .order("score", { ascending: false })
    .limit(n);
  if (error || !data) return getMockTop(n);
  return data.map(rowToTalent);
}

export async function getAvailableTalents(): Promise<Talent[]> {
  if (!isSupabaseConfigured) return getMockAvailable();
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("public_talents")
    .select("*")
    .eq("availability", "available")
    .order("score", { ascending: false });
  if (error || !data) return getMockAvailable();
  return data.map(rowToTalent);
}

export async function getTrendingTalents(n: number = 6): Promise<Talent[]> {
  if (!isSupabaseConfigured) return getMockTrending(n);
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("trending_talents")
    .select("*")
    .limit(n);
  if (error || !data) return getMockTrending(n);
  return data.map(rowToTalent);
}

export async function getTalentByUsername(username: string): Promise<Talent | null> {
  if (!isSupabaseConfigured) {
    return getMockTalent(username) ?? null;
  }
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("public_talents")
    .select("*")
    .eq("username", username)
    .maybeSingle();
  if (error || !data) return null;

  const talent = rowToTalent(data as PublicTalentViewRow);

  // Hydrate portfolio + experiences in parallel
  const portfolioRes = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("talent_id", talent.id)
    .order("position", { ascending: true });
  const experiencesRes = await supabase
    .from("experiences")
    .select("*")
    .eq("talent_id", talent.id)
    .order("position", { ascending: true });
  const portfolio = portfolioRes.data as PortfolioItemRow[] | null;
  const experiences = experiencesRes.data as ExperienceRow[] | null;

  if (portfolio) {
    talent.portfolio = portfolio.map((p) => ({
      id: p.id,
      kind: p.kind,
      title: p.title,
      subtitle: p.subtitle ?? undefined,
      gradient: p.gradient ?? "from-cyan-400 via-cyan-600 to-indigo-900",
      ratio: (p.ratio === "16/9" || p.ratio === "4/5" || p.ratio === "1/1" ? p.ratio : "16/9") as "16/9" | "4/5" | "1/1",
    }));
  }
  if (experiences) {
    talent.experiences = experiences.map((e) => ({
      studio: e.studio_name,
      role: e.role,
      period: e.period,
      detail: e.detail ?? undefined,
    }));
  }

  return talent;
}

// For generateStaticParams + sitemaps
export async function listTalentUsernames(): Promise<string[]> {
  if (!isSupabaseConfigured) return MOCK_TALENTS.map((t) => t.slug);
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.from("public_talents").select("username");
  if (error || !data) return MOCK_TALENTS.map((t) => t.slug);
  return (data as { username: string }[]).map((r) => r.username);
}
