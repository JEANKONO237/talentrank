-- TalentRank — 0015 — Profession taxonomy expansion
-- ---------------------------------------------------------------------------
-- Pivot from "creative-only disciplines" to "all professions ranked".
-- Adds a proper professions catalogue table + category, and extends the
-- discipline_id enum with cross-sector roles. The enum is kept for backward
-- compatibility; new sign-ups can use either the enum value or the catalogue
-- by setting `talents.profession_id` (text FK to professions.id).

create extension if not exists "pg_trgm";

-- ─── Profession categories (master table) ────────────────────────────────
create table if not exists public.profession_categories (
  id text primary key,
  label text not null,
  ordinal int not null default 0,
  color text not null default '#22D3EE'
);

insert into public.profession_categories (id, label, ordinal, color) values
  ('tech',         'Technology & Engineering', 0,  '#22D3EE'),
  ('creative',     'Creative & Visual',         1,  '#F472B6'),
  ('business',     'Business & Strategy',       2,  '#A78BFA'),
  ('finance',      'Finance & Legal',           3,  '#10F0A0'),
  ('marketing',    'Marketing & Growth',        4,  '#FBBF24'),
  ('product',      'Product & UX',              5,  '#67E8F9'),
  ('data',         'Data & AI',                 6,  '#A78BFA'),
  ('engineering',  'Hardware & Industrial',     7,  '#94A3B8'),
  ('health',       'Health & Care',             8,  '#F472B6'),
  ('education',    'Education & Research',      9,  '#FBBF24'),
  ('hospitality',  'Hospitality & Service',     10, '#FCD34D'),
  ('logistics',    'Logistics & Operations',    11, '#94A3B8'),
  ('media',        'Media & Communication',     12, '#67E8F9'),
  ('music',        'Music & Audio',             13, '#F472B6'),
  ('architecture', 'Architecture & Construction', 14, '#FBBF24'),
  ('legal',        'Legal',                     15, '#A78BFA'),
  ('hr',           'People & HR',               16, '#10F0A0'),
  ('other',        'Other',                     17, '#94A3B8')
on conflict (id) do update set label = excluded.label, ordinal = excluded.ordinal, color = excluded.color;

-- ─── Professions catalogue ──────────────────────────────────────────────
-- `id` is the slug used in URLs (e.g. "software-engineer", "ux-designer").
-- A profession can map to one of the legacy `discipline_id` enum values
-- (column `legacy_discipline`) for talents created before this migration.

create table if not exists public.professions (
  id text primary key,
  category_id text not null references public.profession_categories(id),
  label text not null,
  short_label text,
  description text,
  default_gradient text not null default 'from-cyan-400 via-cyan-600 to-indigo-900',
  legacy_discipline discipline_id,
  ordinal int not null default 0
);

create index if not exists professions_category_idx on public.professions (category_id, ordinal);
create index if not exists professions_label_trgm on public.professions using gin (label gin_trgm_ops);

insert into public.professions (id, category_id, label, short_label, default_gradient, legacy_discipline, ordinal) values
  -- Tech & Engineering
  ('software-engineer',         'tech',    'Software Engineer',          'Software Eng.',  'from-cyan-400 via-blue-600 to-indigo-900', null, 0),
  ('frontend-engineer',         'tech',    'Frontend Engineer',          'Frontend',       'from-cyan-300 via-sky-600 to-blue-900',     null, 1),
  ('backend-engineer',          'tech',    'Backend Engineer',           'Backend',        'from-teal-300 via-cyan-700 to-slate-900',   null, 2),
  ('fullstack-engineer',        'tech',    'Full-Stack Engineer',        'Full-Stack',     'from-emerald-300 via-teal-600 to-slate-900', null, 3),
  ('mobile-engineer',           'tech',    'Mobile Engineer',            'Mobile',         'from-violet-300 via-indigo-600 to-slate-900', null, 4),
  ('devops-sre',                'tech',    'DevOps / SRE',               'DevOps',         'from-orange-300 via-red-600 to-zinc-900',   null, 5),
  ('security-engineer',         'tech',    'Security Engineer',          'Security',       'from-rose-300 via-red-700 to-zinc-900',     null, 6),
  ('game-developer',            'tech',    'Game Developer',             'Game Dev',       'from-amber-300 via-orange-600 to-rose-900', null, 7),
  ('embedded-engineer',         'tech',    'Embedded / Firmware',        'Embedded',       'from-yellow-300 via-amber-600 to-zinc-900', null, 8),

  -- Data & AI
  ('data-scientist',            'data',    'Data Scientist',             'Data Sci.',      'from-violet-300 via-purple-600 to-indigo-900', null, 0),
  ('ml-engineer',               'data',    'ML / AI Engineer',           'ML Eng.',        'from-fuchsia-300 via-violet-600 to-indigo-900', null, 1),
  ('data-engineer',             'data',    'Data Engineer',              'Data Eng.',      'from-cyan-300 via-blue-700 to-slate-900',   null, 2),
  ('data-analyst',              'data',    'Data Analyst',               'Analyst',        'from-emerald-300 via-teal-700 to-slate-900', null, 3),

  -- Creative & Visual
  ('animation-3d',              'creative','3D Animator',                'Animator',       'from-cyan-400 via-cyan-600 to-indigo-900',  'animation-3d',     0),
  ('unreal-artist',             'creative','Unreal Engine Artist',       'Unreal',         'from-amber-300 via-orange-500 to-rose-800', 'unreal',           1),
  ('motion-designer',           'creative','Motion Designer',            'Motion',         'from-violet-400 via-fuchsia-500 to-indigo-900', 'motion-design', 2),
  ('vfx-artist',                'creative','VFX Artist',                 'VFX',            'from-emerald-300 via-teal-600 to-slate-900', 'vfx',             3),
  ('storyboard-artist',         'creative','Storyboard Artist',          'Storyboard',     'from-yellow-200 via-amber-500 to-zinc-900', 'storyboard',      4),
  ('character-artist',          'creative','Character Artist',           'Character',      'from-rose-300 via-pink-500 to-purple-900',  'character-art',   5),
  ('environment-artist',        'creative','Environment Artist',         'Environment',    'from-teal-300 via-cyan-500 to-blue-800',    'environment-art', 6),
  ('3d-generalist',             'creative','3D Generalist',              'Generalist',     'from-violet-400 via-indigo-500 to-blue-800', 'generalist-3d',  7),
  ('video-editor',              'creative','Video Editor',               'Editor',         'from-yellow-300 via-amber-500 to-red-800',  'editing',         8),
  ('visual-director',           'creative','Visual Director',            'Visual Dir.',    'from-cyan-300 via-blue-500 to-indigo-900',  'visual-direction',9),
  ('graphic-designer',          'creative','Graphic Designer',           'Graphic',        'from-pink-300 via-fuchsia-500 to-purple-900', null, 10),
  ('illustrator',               'creative','Illustrator',                'Illustrator',    'from-amber-300 via-pink-500 to-violet-900', null, 11),
  ('photographer',              'creative','Photographer',               'Photographer',   'from-sky-300 via-cyan-600 to-slate-900',    null, 12),

  -- Product & UX
  ('product-manager',           'product', 'Product Manager',            'PM',             'from-amber-300 via-orange-500 to-rose-800', null, 0),
  ('ux-designer',               'product', 'UX Designer',                'UX',             'from-violet-300 via-fuchsia-500 to-rose-700', null, 1),
  ('ui-designer',               'product', 'UI Designer',                'UI',             'from-cyan-300 via-sky-500 to-indigo-900',   null, 2),
  ('product-designer',          'product', 'Product Designer',           'Product Des.',   'from-rose-300 via-pink-500 to-violet-900',  null, 3),
  ('ux-researcher',             'product', 'UX Researcher',              'Researcher',     'from-emerald-300 via-teal-500 to-slate-900', null, 4),

  -- Marketing & Growth
  ('growth-marketer',           'marketing','Growth Marketer',           'Growth',         'from-yellow-300 via-amber-500 to-red-800',  null, 0),
  ('content-marketer',          'marketing','Content Marketer',          'Content',        'from-pink-300 via-fuchsia-500 to-purple-900', null, 1),
  ('seo-specialist',            'marketing','SEO Specialist',            'SEO',            'from-cyan-300 via-sky-500 to-blue-900',     null, 2),
  ('social-media-manager',      'marketing','Social Media Manager',      'Social',         'from-violet-300 via-fuchsia-500 to-indigo-900', null, 3),
  ('brand-strategist',          'marketing','Brand Strategist',          'Brand',          'from-rose-300 via-pink-500 to-violet-900',  null, 4),

  -- Business & Strategy
  ('strategy-consultant',       'business','Strategy Consultant',        'Strategy',       'from-amber-300 via-orange-500 to-rose-800', null, 0),
  ('business-analyst',          'business','Business Analyst',           'Biz Analyst',    'from-emerald-300 via-teal-500 to-slate-900', null, 1),
  ('operations-manager',        'business','Operations Manager',         'Ops',            'from-violet-300 via-indigo-500 to-slate-900', null, 2),
  ('sales-executive',           'business','Sales Executive',            'Sales',          'from-yellow-300 via-amber-500 to-red-800',  null, 3),

  -- Finance & Legal
  ('financial-analyst',         'finance', 'Financial Analyst',          'Fin. Analyst',   'from-emerald-300 via-teal-500 to-slate-900', null, 0),
  ('accountant',                'finance', 'Accountant',                 'Accountant',     'from-cyan-300 via-teal-500 to-blue-900',    null, 1),
  ('investment-analyst',        'finance', 'Investment Analyst',         'Investment',     'from-yellow-200 via-amber-500 to-zinc-900', null, 2),
  ('corporate-lawyer',          'legal',   'Corporate Lawyer',           'Lawyer',         'from-violet-300 via-indigo-500 to-slate-900', null, 0),
  ('ip-lawyer',                 'legal',   'IP Lawyer',                  'IP',             'from-fuchsia-300 via-violet-500 to-slate-900', null, 1),

  -- People & HR
  ('hr-manager',                'hr',      'HR Manager',                 'HR',             'from-emerald-300 via-teal-500 to-slate-900', null, 0),
  ('talent-acquisition',        'hr',      'Talent Acquisition',         'Recruiter',      'from-cyan-300 via-sky-500 to-blue-900',     null, 1),
  ('people-ops',                'hr',      'People Ops',                 'People Ops',     'from-rose-300 via-pink-500 to-purple-900',  null, 2),

  -- Music & Audio
  ('composer',                  'music',   'Composer',                   'Composer',       'from-amber-300 via-orange-500 to-rose-800', null, 0),
  ('music-producer',            'music',   'Music Producer',             'Producer',       'from-violet-300 via-fuchsia-500 to-indigo-900', null, 1),
  ('sound-designer',            'music',   'Sound Designer',             'Sound',          'from-cyan-300 via-sky-500 to-indigo-900',   null, 2),
  ('mixing-engineer',           'music',   'Mixing Engineer',            'Mixing',         'from-yellow-300 via-amber-500 to-red-800',  null, 3),

  -- Architecture & Construction
  ('architect',                 'architecture','Architect',              'Architect',      'from-yellow-200 via-amber-500 to-zinc-900', null, 0),
  ('interior-designer',         'architecture','Interior Designer',      'Interior',       'from-rose-300 via-pink-500 to-purple-900',  null, 1),
  ('urban-planner',             'architecture','Urban Planner',          'Urban',          'from-emerald-300 via-teal-600 to-slate-900', null, 2),

  -- Hardware & Industrial
  ('mechanical-engineer',       'engineering','Mechanical Engineer',     'Mechanical',     'from-violet-300 via-indigo-500 to-slate-900', null, 0),
  ('electrical-engineer',       'engineering','Electrical Engineer',     'Electrical',     'from-cyan-300 via-sky-500 to-blue-900',     null, 1),
  ('industrial-designer',       'engineering','Industrial Designer',     'Industrial',     'from-rose-300 via-pink-500 to-purple-900',  null, 2),

  -- Health
  ('medical-doctor',            'health',  'Medical Doctor',             'Doctor',         'from-rose-300 via-red-500 to-purple-900',   null, 0),
  ('nurse',                     'health',  'Nurse',                      'Nurse',          'from-pink-300 via-rose-500 to-red-800',     null, 1),
  ('physiotherapist',           'health',  'Physiotherapist',            'Physio',         'from-emerald-300 via-teal-500 to-slate-900', null, 2),

  -- Education & Research
  ('researcher',                'education','Researcher',                'Research',       'from-violet-300 via-indigo-500 to-slate-900', null, 0),
  ('teacher',                   'education','Teacher / Trainer',         'Teacher',        'from-amber-300 via-orange-500 to-rose-800', null, 1),

  -- Media & Communication
  ('journalist',                'media',   'Journalist',                 'Journalist',     'from-cyan-300 via-sky-500 to-indigo-900',   null, 0),
  ('copywriter',                'media',   'Copywriter',                 'Copywriter',     'from-yellow-300 via-amber-500 to-red-800',  null, 1),
  ('translator',                'media',   'Translator',                 'Translator',     'from-violet-300 via-fuchsia-500 to-indigo-900', null, 2),

  -- Logistics & Operations
  ('supply-chain-manager',      'logistics','Supply Chain Manager',      'Supply Chain',   'from-emerald-300 via-teal-500 to-slate-900', null, 0),
  ('logistics-coordinator',     'logistics','Logistics Coordinator',     'Logistics',      'from-cyan-300 via-sky-500 to-slate-900',    null, 1),

  -- Hospitality
  ('chef',                      'hospitality','Chef',                    'Chef',           'from-amber-300 via-orange-500 to-red-800',  null, 0),
  ('hotel-manager',             'hospitality','Hotel Manager',           'Hotel',          'from-yellow-200 via-amber-500 to-zinc-900', null, 1),

  ('other',                     'other',   'Other',                      'Other',          'from-mist-300 via-mist-500 to-slate-900',   null, 0)
on conflict (id) do update set
  category_id = excluded.category_id,
  label = excluded.label,
  short_label = excluded.short_label,
  default_gradient = excluded.default_gradient,
  legacy_discipline = excluded.legacy_discipline,
  ordinal = excluded.ordinal;

-- ─── Wire talents to the new catalogue ──────────────────────────────────
-- `profession_id` is the new canonical field. Old `discipline` enum stays
-- (defaultable) so existing data doesn't break. A small backfill maps every
-- legacy discipline to its profession.

alter table public.talents
  add column if not exists profession_id text references public.professions(id);

create index if not exists talents_profession_idx on public.talents (profession_id);

update public.talents t
   set profession_id = p.id
  from public.professions p
 where p.legacy_discipline = t.discipline
   and t.profession_id is null;

-- ─── Update public_talents view to expose profession + category ─────────
drop view if exists public.public_talents cascade;
create or replace view public.public_talents
with (security_invoker = true)
as
select
  p.id,
  p.username,
  p.display_name,
  p.avatar_initials,
  p.avatar_gradient,
  p.country_code,
  p.city,
  p.bio,
  p.last_seen_at,
  p.created_at as joined_at,
  t.discipline,
  t.profession_id,
  prof.label as profession_label,
  prof.short_label as profession_short_label,
  prof.category_id as profession_category,
  t.tagline,
  t.years_experience,
  t.availability,
  t.availability_note,
  t.work_mode,
  t.contract_type,
  t.showreel_url,
  t.website_url,
  t.artstation_url,
  t.vimeo_url,
  t.youtube_url,
  t.linkedin_url,
  t.specialties,
  t.software,
  t.languages,
  t.hired_until,
  coalesce(ts.score, 0) as score,
  coalesce(ts.percentile, 100) as percentile,
  ts.global_rank,
  ts.discipline_rank,
  ts.country_rank,
  coalesce(ts.tier, 'new'::tier_id) as tier,
  coalesce(ts.breakdown, '{}'::jsonb) as breakdown,
  coalesce(
    (select array_agg(badge_id order by awarded_at desc) from public.talent_badges where talent_id = t.id),
    '{}'::text[]
  ) as badges,
  coalesce(
    (select count(*)::int from public.portfolio_items where talent_id = t.id),
    0
  ) as portfolio_count
from public.profiles p
join public.talents t on t.id = p.id
left join public.professions prof on prof.id = t.profession_id
left join public.talent_scores ts on ts.talent_id = t.id
where not t.is_hidden and t.availability <> 'hired';

create or replace view public.trending_talents
with (security_invoker = true)
as
select pt.* from public.public_talents pt
where pt.last_seen_at > now() - interval '7 days'
order by pt.score desc, pt.last_seen_at desc;
