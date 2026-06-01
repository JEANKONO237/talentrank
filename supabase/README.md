# TalentRank — Supabase setup

Production-ready schema for the TalentRank platform. Two ways to set this up.

---

## Option A — Local Supabase (recommended for dev)

Install the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
npm i -g supabase
```

From the repo root:

```bash
supabase start          # spins up local Postgres + Auth + Storage
supabase db reset       # applies all migrations + runs seed.sql
```

Then copy the local credentials into `.env.local`:

```bash
# values printed by `supabase start`
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...
SUPABASE_SERVICE_ROLE_KEY=ey...
```

---

## Option B — Hosted project

1. Create a new project at [supabase.com](https://supabase.com).
2. From `Settings → API`, copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (server-only)
3. Link the project:
   ```bash
   supabase link --project-ref <ref-from-dashboard>
   supabase db push       # applies migrations in order
   ```
4. (Optional) Run the seed:
   ```bash
   psql "$DATABASE_URL" -f supabase/seed.sql
   ```

---

## What gets created

### Tables (16)
- `profiles` — base identity (1:1 with `auth.users`), with `username` (citext, unique), `role` enum, `country_code`.
- `talents` — creative profile, arrays for software/languages/specialties, `availability` enum, `is_hidden`.
- `studios` — org profile, `is_verified`, `prestige_weight` for score weighting.
- `studio_members` — M:N user↔studio with role (owner/recruiter/member).
- `studio_verification_requests` — admin approval flow.
- `portfolio_items` — image/video work with `position`, `is_cover`, `is_featured`.
- `experiences` — career history, verifiable by linked studios.
- `talent_scores` — current snapshot (score, percentile, ranks, tier, breakdown JSONB).
- `score_events` — audit trail of factor changes.
- `endorsements` — peers & studios endorse talents.
- `shortlists` / `shortlist_items` — recruiter shortlists.
- `hirings` — formal hire records; talent confirms → availability flips to 'hired'.
- `conversations` / `messages` — realtime messaging (publication added).
- `badges` / `talent_badges` — derived signals.

### Views (2)
- `public_talents` — what `/explore`, `/ranking`, talent cards read from. Excludes hidden & hired.
- `trending_talents` — last 7 days, score-ordered.

### Functions
- `compute_talent_score(uuid) returns jsonb` — pure scoring function. 11 factors, caps at 100.
- `refresh_talent_score(uuid)` — write snapshot + recompute percentile + tier.
- `refresh_all_ranks()` — global / discipline / country ranks (run on a schedule).
- `refresh_auto_badges()` — idempotent auto-badge job.
- `open_conversation(studio_id, talent_id, subject)` — find-or-create.
- `confirm_hiring(hiring_id)` — flips availability to 'hired'.
- `end_hiring(hiring_id)` — restores availability.
- `is_username_available(text)` — sign-up form live check.
- `touch_last_seen()` — bumps `profiles.last_seen_at`.
- `my_profile_metrics()` — talent dashboard aggregates.

### Triggers
- `on_auth_user_created` — materialises a profile + talent/studio row on sign-up.
- `*_score_trg` — auto-recompute score on portfolio/experience/endorsement/talent/badge changes.
- `hirings_sync_availability` — flips talent availability on confirm/end.
- `messages_bump_conversation` — maintains `last_message_at` + unread counters.
- `*_updated_at` — generic `set_updated_at()`.

### RLS
Every table has RLS enabled. See `0011_rls_policies.sql` for the full rules.
Helpers `is_studio_member(uuid)` and `is_studio_owner(uuid)` simplify policy auth.

### Storage
- `portfolios` bucket (500 MB cap, image/video MIMEs), path = `${talent_id}/...`
- `studio-logos` bucket (10 MB, images only), path = `${studio_id}/...`

---

## Talent Score formula (transparent)

Each factor caps at its max. Total caps at 100. The exact code lives in
`0006_score_system.sql:compute_talent_score`.

| Factor               | Max | Logic                                                                   |
|----------------------|----:|-------------------------------------------------------------------------|
| Experience           |  15 | `15 * ln(1 + years) / ln(16)` — log curve, plateau at ~15y              |
| Notable studios      |  15 | sum of verified-experience prestige_weights × 2.5                       |
| Portfolio            |  12 | `count × 1.0 + featured × 1.5`                                          |
| Activity             |  10 | 10 / 7 / 4 / 1 by last_seen recency (7d / 30d / 90d / older)            |
| Endorsements         |  12 | studio endorsements weigh 2×, capped                                    |
| Engagement           |   8 | profile completion (tagline, bio, specialties, languages, city)         |
| Showreel             |   6 | binary — 6 if URL set                                                   |
| Software mastery     |   8 | `sqrt(count) × 2.5` — sub-linear, rewards diversity without farming     |
| Badges               |   6 | `count × 0.9`, capped (most badges are derived, not free points)        |
| Rarity               |   4 | based on discipline scarcity (sub-linear)                               |
| Completed projects   |   4 | `ended hirings × 0.5`                                                   |

The system is "prestige + signal" — not gamification. Recomputing is cheap
(single row write) and runs on triggers. Ranks are recomputed by
`refresh_all_ranks()` — recommended every 5 min via Supabase Cron.

---

## Scheduled jobs (recommended)

In the Supabase dashboard, set up **Cron** entries:

```sql
-- Every 5 min: refresh global/discipline/country ranks
select public.refresh_all_ranks();

-- Every 30 min: refresh auto-awarded badges
select public.refresh_auto_badges();
```

---

## Hiring lifecycle

1. **Studio** creates a hiring (`status='pending'`).
2. **Talent** confirms via `confirm_hiring(id)` — trigger sets
   `talents.availability='hired'` and `hired_until = end_date`.
3. Talent disappears from `public_talents` view (excluded from
   Explore + Ranking + Trending).
4. When the project ends, either party calls `end_hiring(id)`. Trigger
   restores `availability='available'`, `hired_until=null`.

This gives every studio a way to flag "this person is taken" without
deleting the profile or losing score history.
