# TalentRank

**A private, ranked marketplace for the world's professionals — across every field.**

Companies don't post jobs. They browse ranked talents and propose interviews directly. Candidates create a profile once, get a transparent **Talent Score**, climb the ranking, and receive structured interview proposals — no cover letters, no spam, no ATS.

**Stack:** Next.js 15 (App Router) · TypeScript strict · Tailwind · Framer Motion · Supabase (Auth + Postgres + Storage + Realtime) · Zod

---

## Product principles

1. **Ranked, not listed.** Every talent has a transparent score across 11 factors. Tiers are valorising (`Elite · Senior Verified · Trending · Rising · Emerging`) — never raw "#1425".
2. **Hunt, don't apply.** Companies search and shortlist. Candidates never write cover letters. Recruiters click "Propose interview"; talents accept / hold / decline.
3. **Private CV.** Public surfaces show pseudo + role + score + badges + ranking + public portfolio + city + nationality + availability. Email, phone, CV file are visible **only** to verified studios with a relationship (shortlist or proposal).
4. **No social.** No feed, no posts, no comments, no influencers. The product is a tool, not a platform.
5. **All professions.** Tech, design, finance, marketing, legal, health, music, architecture, hospitality, education — same ranking engine.
6. **Hidden when hired.** A confirmed hiring auto-removes the talent from search and ranking. The profile survives; the noise doesn't.

---

## Run locally

```bash
npm install
npm run dev
```

→ http://localhost:3000

The site renders on 35 seeded mock talents until you connect Supabase.

---

## Wire Supabase

```bash
npm i -g supabase
supabase start
supabase db reset     # applies 19 migrations + seed.sql
```

Copy `.env.example` → `.env.local` and paste the printed credentials. Restart `npm run dev`.

See **[`supabase/README.md`](./supabase/README.md)** for the full schema + score formula reference.

---

## What's shipped

### Sprint 1 — Visual MVP

- Cinematic landing (hero + particles + aurora + scrolling talent marquee)
- `/explore`, `/ranking` (podium + tiered list), `/talent/[username]`
- `/dashboard/talent`, `/dashboard/recruiter`, `/studios`, `/pricing`
- Mobile-first responsive · 60fps animations

### Sprint 2 — Production-ready architecture

**Database (19 migrations)**

- 18 tables, 2 views (`public_talents`, `trending_talents`), 14 functions
- RLS on every table
- Triggers: auto-create profile on sign-up · auto-recompute score on portfolio/exp/endorsement/badge change · auto-flip availability on hiring confirmation · maintain conversation timestamps + unread counters
- Realtime publication: `messages`, `conversations`, `interview_proposals`
- Storage buckets: `portfolios` (public), `studio-logos` (public), `cvs` (private — verified-studio-only)

**Profession taxonomy (Sprint 2 pivot)**

- 18 categories: `tech`, `creative`, `business`, `finance`, `marketing`, `product`, `data`, `engineering`, `health`, `education`, `hospitality`, `logistics`, `media`, `music`, `architecture`, `legal`, `hr`, `other`
- 70+ professions seeded in DB + `lib/professions.ts`
- Existing creative disciplines kept for backward compatibility (mapped via `legacy_discipline`)

**Visibility tiers**

- `talent_private` table (email, phone, CV path, expected salary, full address, private note) gated by RLS to verified studios with a shortlist / proposal / hiring relationship
- Storage: `cvs` bucket with same gating at the file level

**Interview proposal workflow** (replaces "apply with CV")

- `interview_proposals` table with structured payload (role, contract, location, salary range, work mode, start window, expiry)
- Statuses: `pending → accepted | declined | held | expired | withdrawn`
- On accept: auto-creates a `conversations` row, unlocks free-form messaging
- RLS: only **verified** studios can send proposals · cold-DMs forbidden (talent must accept first)

**Score system**

- 11 transparent factors capped to 100 — see formula in `supabase/README.md`
- Snapshots stored daily in `talent_score_history` for the "market-value evolution" curve
- Auto-recompute via triggers · global / discipline / country ranks via scheduled `refresh_all_ranks()` (Supabase Cron)

**Auth flow**

- `/sign-up` form lets the user pick "I'm a creative" / "I'm a studio"
- Server actions (Zod-validated) call `supabase.auth.signUp` with metadata
- Postgres trigger `on_auth_user_created` materialises the profile + talent/studio atomically
- `/auth/callback` exchanges the PKCE code · `/auth/signout` POST handler
- Auth-aware navbar with avatar menu (dashboard / public profile / edit / portfolio / sign out)

**i18n FR / EN scaffolding**

- `lib/i18n/dictionaries.ts` with flat keys
- Cookie-based locale (`tr_locale`) negotiated from `Accept-Language` on first visit
- `LocaleSwitcher` in the navbar (EN / FR pills)
- API route `POST /api/locale` to persist the choice
- Sprint 3 will migrate to `/fr` / `/en` URL prefixes

**UI / pages added**

- `/dashboard/talent/profile` — full profile editor (identity, role, links, software, languages, availability)
- `/dashboard/talent/portfolio` — image / video upload (signed URLs to Storage) · cover / featured toggles · delete
- `/messages` — proposals + conversations inbox
- `/messages/proposals/[id]` — structured proposal view with `Accept / Hold / Decline` flow
- `/messages/[conversationId]` — realtime thread (Supabase Realtime subscription)

---

## File layout

```
app/
  page.tsx                       landing (server)
  explore/, ranking/             public discovery
  talent/[slug]/                 profile (uses data adapter)
  dashboard/
    talent/                      KPIs + climb tips
      profile/                   edit page
      portfolio/                 upload UI
    recruiter/                   recruiter dashboard
  messages/                      inbox
    [conversationId]/            realtime thread
    proposals/[id]/              structured proposal view
  sign-in/, sign-up/             auth pages
  auth/callback/route.ts         PKCE exchange
  auth/signout/route.ts          sign-out POST
  api/locale/route.ts            persist locale cookie
  pricing/, studios/             marketing
components/
  ui/                            Button, Card, Badge, Avatar, ScorePill, ScoreRing, AvailabilityDot
  effects/                       Aurora, GridBackground, Particles
  layout/                        Navbar (server) + NavbarClient + LocaleSwitcher + Footer
  landing/                       Hero, Marquee, Disciplines, FeaturedTalents, StudioCTA, FinalCTA
  talent/                        TalentCard, PortfolioGallery, ScoreBreakdown
  ranking/                       Podium, RankingRow, RankingClient
  explore/                       ExploreClient
  auth/                          AuthShell, SignInForm, SignUpForm, fields
  dashboard/                     TalentProfileEditor, PortfolioManager
  messages/                      ConversationThread, ProposalActions
lib/
  mock-talents.ts                35 seeded talents (8 swapped + 5 added for cross-sector)
  data/talents.ts                adapter — mock ↔ Supabase
  disciplines.ts                 legacy creative disciplines (kept for backward compat)
  professions.ts                 NEW — full cross-sector catalogue (70+ professions)
  badges.ts, tiers.ts, countries.ts, utils.ts
  i18n/
    dictionaries.ts              FR + EN dicts
    server.ts                    server-side locale negotiation
  supabase/
    env.ts, client.ts, server.ts, middleware.ts
    database.types.ts            hand-authored types
    rpc.ts                       loose-typed write/RPC helpers
  server-actions/
    auth.ts                      sign-up (role-aware), sign-in, sign-out, username check
    talent.ts                    update profile + talent (incl. new availability flags)
    studio.ts                    update studio + verification request
    portfolio.ts                 CRUD + signed upload URL
    private-data.ts              NEW — talent_private + CV upload signed URL
    proposals.ts                 NEW — send / accept / decline / hold / withdraw
    shortlist.ts, hiring.ts, messages.ts
middleware.ts                    Next.js root: refresh session
supabase/
  config.toml
  migrations/
    0001..0014                   Sprint 1+2 base (profiles, talents, studios, score…)
    0015_taxonomy_expansion      cross-sector professions + categories
    0016_visibility_tiers        talent_private + CV bucket RLS
    0017_interview_proposals     proposal table + status flow + cold-DM gate
    0018_score_history           daily snapshot + RLS
    0019_availability_extension  freelance_only / remote_only / available_in_days
  seed.sql
  README.md                      schema + score formula reference
```

---

## Build status

```
✓ Compiled successfully
✓ 53 routes
✓ 35 talent profiles pre-rendered as static HTML
✓ Middleware 88.5 kB
✓ Landing 169 kB First Load JS
```

---

## Sprint 3 (next, deferred — and why)

These were considered for Sprint 2 but cut to ship a coherent foundation rather than a half-finished bundle:

- **Intelligent onboarding questionnaire** (Duolingo-flavour, score-calibration aware). This is a sprint of its own — UX progressive disclosure + branching logic + score calibration require careful design before code.
- **Score evolution chart** on the talent dashboard. DB ready (`talent_score_history`), UI only.
- **Recruiter "Propose interview" UI** on the talent profile page. Server actions ready (`sendInterviewProposal`); needs the modal + form.
- **Localised URL prefixes** `/fr` and `/en`. Will move from cookie-based to path-based in Sprint 3 after a full translation pass.
- **Studio verification admin flow** + verified badge surface across cards.
- **Stripe** for Talent Pro + Studio + Enterprise plans.
- **OG image generation** per talent profile.
- **Cron schedule** for `refresh_all_ranks`, `refresh_auto_badges`, `snapshot_all_scores`.
- **Anti-fake-profile signals** (cross-validation by studios on linked experiences).
