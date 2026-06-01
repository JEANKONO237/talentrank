-- TalentRank — 0001 — Extensions & shared enums
-- ---------------------------------------------------------------------------
-- This is the foundation: pgcrypto for UUIDs, citext for case-insensitive
-- usernames, and the enums shared across talents, studios and the score
-- system. All enums are strongly typed to keep the schema self-documenting
-- and to make TypeScript code-gen produce safe unions.

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ─── User role ────────────────────────────────────────────────────────────
do $$ begin
  create type user_role as enum ('talent', 'studio', 'admin');
exception when duplicate_object then null; end $$;

-- ─── Availability ─────────────────────────────────────────────────────────
-- 'hired' is set automatically when a studio-confirmed hiring is active.
-- Talents in 'hired' are excluded from rankings + explore (see views).
do $$ begin
  create type availability_status as enum (
    'available',     -- open to take a brief immediately
    'open',          -- open to senior offers but not aggressively looking
    'on-mission',    -- working but visible
    'unavailable',   -- not visible to recruiters
    'hired'          -- confirmed mission, auto-hidden from rankings
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type work_mode as enum ('remote', 'hybrid', 'onsite');
exception when duplicate_object then null; end $$;

do $$ begin
  create type contract_type as enum ('freelance', 'fulltime', 'studio', 'any');
exception when duplicate_object then null; end $$;

do $$ begin
  create type discipline_id as enum (
    'animation-3d',
    'unreal',
    'motion-design',
    'vfx',
    'storyboard',
    'character-art',
    'environment-art',
    'generalist-3d',
    'editing',
    'visual-direction'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type tier_id as enum ('elite', 'senior', 'trending', 'rising', 'emerging', 'new');
exception when duplicate_object then null; end $$;

do $$ begin
  create type hiring_status as enum ('pending', 'confirmed', 'disputed', 'ended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type verification_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

-- ─── Generic updated_at trigger ───────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
