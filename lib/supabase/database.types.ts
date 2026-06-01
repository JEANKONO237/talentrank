// TalentRank — Database types
// ----------------------------------------------------------------------------
// Hand-authored to match the migrations in supabase/migrations/. To regenerate
// from a live Supabase project:
//   supabase gen types typescript --linked > lib/supabase/database.types.ts
// The hand-authored version is checked in so the app builds before any
// Supabase project is connected.

export type UserRole = "talent" | "studio" | "admin";
export type AvailabilityStatus =
  | "available"
  | "open"
  | "on-mission"
  | "unavailable"
  | "hired";
export type WorkModeDb = "remote" | "hybrid" | "onsite";
export type ContractTypeDb = "freelance" | "fulltime" | "studio" | "any";
export type DisciplineIdDb =
  | "animation-3d"
  | "unreal"
  | "motion-design"
  | "vfx"
  | "storyboard"
  | "character-art"
  | "environment-art"
  | "generalist-3d"
  | "editing"
  | "visual-direction";
export type TierIdDb = "elite" | "senior" | "trending" | "rising" | "emerging" | "new";
export type HiringStatus = "pending" | "confirmed" | "disputed" | "ended";
export type VerificationStatus = "pending" | "approved" | "rejected";

// ─── Row types (defined first, no recursion) ───────────────────────────────

export interface ProfileRow {
  id: string;
  role: UserRole;
  username: string;
  display_name: string;
  country_code: string;
  city: string | null;
  bio: string | null;
  avatar_gradient: string;
  avatar_initials: string;
  created_at: string;
  updated_at: string;
  last_seen_at: string;
}

export interface TalentRow {
  id: string;
  discipline: DisciplineIdDb;
  tagline: string | null;
  years_experience: number;
  availability: AvailabilityStatus;
  availability_note: string | null;
  work_mode: WorkModeDb;
  contract_type: ContractTypeDb;
  hired_until: string | null;
  showreel_url: string | null;
  website_url: string | null;
  artstation_url: string | null;
  vimeo_url: string | null;
  youtube_url: string | null;
  linkedin_url: string | null;
  specialties: string[];
  software: string[];
  languages: string[];
  is_hidden: boolean;
  profile_views: number;
  recruiter_views: number;
  created_at: string;
  updated_at: string;
}

export interface StudioRow {
  id: string;
  legal_name: string | null;
  website_url: string | null;
  description: string | null;
  industry: string | null;
  size_range: string | null;
  founded_year: number | null;
  hq_country_code: string | null;
  is_verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  prestige_weight: number;
  created_at: string;
  updated_at: string;
}

export interface PortfolioItemRow {
  id: string;
  talent_id: string;
  kind: "image" | "video";
  title: string;
  subtitle: string | null;
  description: string | null;
  storage_path: string | null;
  external_url: string | null;
  thumbnail_path: string | null;
  ratio: string;
  gradient: string | null;
  position: number;
  is_featured: boolean;
  is_cover: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExperienceRow {
  id: string;
  talent_id: string;
  studio_name: string;
  studio_id: string | null;
  role: string;
  period: string;
  start_year: number | null;
  end_year: number | null;
  detail: string | null;
  position: number;
  is_verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TalentScoreRow {
  talent_id: string;
  score: number;
  percentile: number;
  global_rank: number | null;
  discipline_rank: number | null;
  country_rank: number | null;
  tier: TierIdDb;
  breakdown: Record<string, number>;
  computed_at: string;
}

export interface ConversationRow {
  id: string;
  studio_id: string;
  talent_id: string;
  subject: string | null;
  last_message_at: string;
  last_message_preview: string | null;
  unread_for_talent: number;
  unread_for_studio: number;
  created_by: string;
  created_at: string;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  deleted_at: string | null;
  created_at: string;
}

export interface ShortlistRow {
  id: string;
  studio_id: string;
  created_by: string;
  name: string;
  brief: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShortlistItemRow {
  shortlist_id: string;
  talent_id: string;
  added_by: string | null;
  note: string | null;
  added_at: string;
}

export interface HiringRow {
  id: string;
  studio_id: string;
  talent_id: string;
  project_title: string | null;
  description: string | null;
  start_date: string;
  end_date: string | null;
  rate: string | null;
  status: HiringStatus;
  confirmed_at: string | null;
  ended_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface BadgeRow {
  id: string;
  label: string;
  tone: "green" | "amber" | "cyan" | "violet" | "pink" | "mist";
  description: string | null;
  is_auto: boolean;
}

export interface TalentBadgeRow {
  talent_id: string;
  badge_id: string;
  awarded_by: string | null;
  awarded_reason: string | null;
  awarded_at: string;
}

export interface EndorsementRow {
  id: string;
  talent_id: string;
  endorser_id: string;
  endorser_studio_id: string | null;
  note: string | null;
  created_at: string;
}

export interface StudioMemberRow {
  studio_id: string;
  user_id: string;
  role: "owner" | "recruiter" | "member";
  added_at: string;
  added_by: string | null;
}

export interface PublicTalentViewRow {
  id: string;
  username: string;
  display_name: string;
  avatar_initials: string;
  avatar_gradient: string;
  country_code: string;
  city: string | null;
  bio: string | null;
  last_seen_at: string;
  joined_at: string;
  discipline: DisciplineIdDb;
  tagline: string | null;
  years_experience: number;
  availability: AvailabilityStatus;
  availability_note: string | null;
  work_mode: WorkModeDb;
  contract_type: ContractTypeDb;
  hired_until: string | null;
  showreel_url: string | null;
  website_url: string | null;
  artstation_url: string | null;
  vimeo_url: string | null;
  youtube_url: string | null;
  linkedin_url: string | null;
  specialties: string[];
  software: string[];
  languages: string[];
  score: number;
  percentile: number;
  global_rank: number | null;
  discipline_rank: number | null;
  country_rank: number | null;
  tier: TierIdDb;
  breakdown: Record<string, number>;
  badges: string[];
  portfolio_count: number;
}

// ─── Database shape — minimal, lets supabase-js infer freely ──────────────
// We export Row types above so app code can consume them directly. The
// Database type below is intentionally lenient on Insert/Update (no required
// fields enforced at the type level) — we rely on Zod for runtime validation
// in server actions, and on Postgres constraints/RLS for the final check.
// This avoids fighting supabase-js's TS inference, which is fragile across
// versions when Insert types are highly specific.

// Insert/Update permissifs (Record<string, unknown>) parce que certaines
// colonnes (profession_id, sector, review_status, …) sont ajoutées par
// migrations récentes mais pas re-générées dans ce fichier hand-authored.
// On garde Row précis pour les select (.eq, .filter, .single() fonctionnent
// avec le type fort). Le runtime Postgres reste l'authority pour Insert/Update.
//
// IMPORTANT — `Relationships: never[]` est requis pour que postgrest-js
// reconnaisse la table comme GenericTable (sa définition interne exige cette
// propriété ; sans elle, Insert/Update tombent à `never` à l'inférence).
type LooseTable<R> = {
  Row: R;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: never[];
};

// Tables non explicitement typées (qcm_*, waitlist, interview_proposals,
// cvs, portfolios, talent_private…) sont créées par migrations mais pas
// re-générées dans ce fichier hand-authored. On les expose avec un Row
// générique Record<string, unknown> pour que TS arrête de râler.
// Le runtime Postgres reste l'authority via les contraintes/RLS.
type GenericRow = Record<string, unknown>;
// Pareil que LooseTable mais sans Row précis. Relationships obligatoire.
type GenericTable = {
  Row: GenericRow;
  Insert: GenericRow;
  Update: GenericRow;
  Relationships: never[];
};

export interface DatabaseTables {
  // Tables typées fortement
  profiles: LooseTable<ProfileRow>;
  talents: LooseTable<TalentRow>;
  studios: LooseTable<StudioRow>;
  portfolio_items: LooseTable<PortfolioItemRow>;
  experiences: LooseTable<ExperienceRow>;
  talent_scores: LooseTable<TalentScoreRow>;
  conversations: LooseTable<ConversationRow>;
  messages: LooseTable<MessageRow>;
  shortlists: LooseTable<ShortlistRow>;
  shortlist_items: LooseTable<ShortlistItemRow>;
  hirings: LooseTable<HiringRow>;
  badges: LooseTable<BadgeRow>;
  talent_badges: LooseTable<TalentBadgeRow>;
  endorsements: LooseTable<EndorsementRow>;
  studio_members: LooseTable<StudioMemberRow>;
  studio_verification_requests: LooseTable<{
    id: string;
    studio_id: string;
    submitted_by: string;
    evidence_url: string | null;
    notes: string | null;
    status: VerificationStatus;
    reviewed_by: string | null;
    reviewed_at: string | null;
    rejection_reason: string | null;
    created_at: string;
  }>;
  score_events: LooseTable<{
    id: string;
    talent_id: string;
    factor: string;
    old_value: number | null;
    new_value: number | null;
    reason: string | null;
    created_at: string;
  }>;
  // Tables QCM + utilitaires — typées en générique pour éviter de dupliquer
  // les schémas SQL ici. Ajoute un Row précis ici si tu veux du type safety.
  qcm_attempts: GenericTable;
  qcm_responses: GenericTable;
  qcm_results: GenericTable;
  qcm_flags: GenericTable;
  qcm_lockouts: GenericTable;
  qcm_answer_keys: GenericTable;
  qcm_attempt_questions: GenericTable;
  qcm_cooldowns: GenericTable;
  qcm_exposure: GenericTable;
  interview_proposals: GenericTable;
  waitlist: GenericTable;
  cvs: GenericTable;
  portfolios: GenericTable;
  talent_private: GenericTable;
  feedback: GenericTable;
}

export interface Database {
  public: {
    Tables: DatabaseTables;
    Views: {
      // Views non-updatable : Relationships obligatoire pour postgrest-js.
      public_talents: { Row: PublicTalentViewRow; Relationships: never[] };
      trending_talents: { Row: PublicTalentViewRow; Relationships: never[] };
    };
    Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown }>;
    Enums: {
      user_role: UserRole;
      availability_status: AvailabilityStatus;
      work_mode: WorkModeDb;
      contract_type: ContractTypeDb;
      discipline_id: DisciplineIdDb;
      tier_id: TierIdDb;
      hiring_status: HiringStatus;
      verification_status: VerificationStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
