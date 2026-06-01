-- TalentRank — Dev seed
-- ---------------------------------------------------------------------------
-- Populates the database with 30 talents matching the visual mock data.
-- Run AFTER all migrations, ideally via `supabase db reset`.
--
-- Note: this seed creates rows in `profiles` / `talents` directly (bypassing
-- auth.users). For local Supabase dev with `supabase db reset --seed`, this
-- works because RLS is suspended for the seed step. In a hosted environment,
-- prefer running this via `psql` using the service-role-equivalent connection.

-- ─── Studio prestige seed (used by the score function) ──────────────────
-- We don't have studio rows for famous studios yet; create placeholder ones
-- with prestige_weights so verified experiences score higher.
-- (skipped here — onboarded studios will set their own prestige_weight)

-- ─── Helper to seed a talent ────────────────────────────────────────────
create or replace function public._seed_talent(
  p_uuid uuid,
  p_username text,
  p_display_name text,
  p_initials text,
  p_country char(2),
  p_city text,
  p_avatar_gradient text,
  p_discipline discipline_id,
  p_tagline text,
  p_bio text,
  p_years int,
  p_availability availability_status,
  p_availability_note text,
  p_work_mode work_mode,
  p_contract contract_type,
  p_showreel text,
  p_specialties text[],
  p_software text[],
  p_languages text[]
) returns void language plpgsql security definer as $$
begin
  insert into public.profiles (id, role, username, display_name, avatar_initials, country_code, city, bio, avatar_gradient)
  values (p_uuid, 'talent', p_username, p_display_name, p_initials, p_country, p_city, p_bio, p_avatar_gradient)
  on conflict (id) do update set
    username = excluded.username,
    display_name = excluded.display_name,
    avatar_initials = excluded.avatar_initials,
    country_code = excluded.country_code,
    city = excluded.city,
    bio = excluded.bio,
    avatar_gradient = excluded.avatar_gradient;

  insert into public.talents (id, discipline, tagline, years_experience, availability, availability_note,
                              work_mode, contract_type, showreel_url, specialties, software, languages)
  values (p_uuid, p_discipline, p_tagline, p_years, p_availability, p_availability_note,
          p_work_mode, p_contract, p_showreel, p_specialties, p_software, p_languages)
  on conflict (id) do update set
    discipline = excluded.discipline,
    tagline = excluded.tagline,
    years_experience = excluded.years_experience,
    availability = excluded.availability,
    availability_note = excluded.availability_note,
    work_mode = excluded.work_mode,
    contract_type = excluded.contract_type,
    showreel_url = excluded.showreel_url,
    specialties = excluded.specialties,
    software = excluded.software,
    languages = excluded.languages;
end $$;

-- ─── 30 talents ─────────────────────────────────────────────────────────
-- UUIDs are deterministic (md5 of the slug) so re-running the seed is idempotent.

select public._seed_talent(
  '00000001-0000-0000-0000-000000000001', 'jean-onana', 'Jean Marie O.', 'JM',
  'CM', 'Yaoundé / Paris', 'from-cyan-400 via-cyan-600 to-indigo-900',
  'generalist-3d', 'Shot-ownership generalist. Cinematic to the frame.',
  '3D Generalist & Animator with a cinematic eye. I move between animation, lighting and FX to ship shots end-to-end.',
  6, 'available', 'Open to projects from June 2026', 'hybrid', 'any',
  'https://vimeo.com/showcase/jeanmarie',
  array['Character Animation','Cinematic FX','Look-Dev'],
  array['Maya','Unreal Engine','Substance Painter','ZBrush','Houdini','Nuke'],
  array['French','English']
);

select public._seed_talent(
  '00000001-0000-0000-0000-000000000002', 'lina-park', 'Lina Park', 'LP',
  'KR', 'Seoul', 'from-amber-300 via-orange-500 to-rose-800',
  'unreal', 'Real-time worlds, film-quality light.',
  'Virtual production specialist. I build photoreal Unreal worlds for ad and film clients.',
  8, 'available', null, 'hybrid', 'freelance',
  null,
  array['Virtual Production','Nanite Worlds','Real-time Lighting'],
  array['Unreal Engine','Maya','Substance Designer','Houdini','RealityCapture'],
  array['Korean','English']
);

select public._seed_talent(
  '00000001-0000-0000-0000-000000000003', 'kofi-mensah', 'Kofi Mensah', 'KM',
  'NG', 'Lagos', 'from-violet-400 via-fuchsia-500 to-indigo-900',
  'motion-design', 'Rhythmic, type-first motion that earns the screen.',
  'Motion designer working across brand and streaming clients.',
  5, 'available', null, 'remote', 'freelance', null,
  array['Brand Motion','Type in Motion','3D Mograph'],
  array['After Effects','Cinema 4D','Octane','Illustrator'],
  array['English','French']
);

select public._seed_talent(
  '00000001-0000-0000-0000-000000000004', 'sofia-marquez', 'Sofía Márquez', 'SM',
  'ES', 'Barcelona', 'from-orange-400 via-red-600 to-zinc-900',
  'vfx', 'Sims that read in a single frame.',
  'FX TD with a soft spot for explosions that read in a single frame.',
  7, 'on-mission', 'On mission until September 2026', 'hybrid', 'studio', null,
  array['FX Sims','Pyro & Destruction','Compositing'],
  array['Houdini','Nuke','Maya','Substance Painter'],
  array['Spanish','English','Catalan']
);

select public._seed_talent(
  '00000001-0000-0000-0000-000000000005', 'akira-tanaka', 'Akira Tanaka', 'AT',
  'JP', 'Tokyo', 'from-amber-300 via-orange-500 to-rose-800',
  'character-art', 'Stylized realism, skin that breathes.',
  'Character artist between film and games, focused on stylized realism.',
  9, 'available', null, 'remote', 'freelance', null,
  array['Stylized Characters','Grooming','Look-dev'],
  array['ZBrush','Maya','Substance Painter','Marvelous Designer','Marmoset Toolbag'],
  array['Japanese','English']
);

select public._seed_talent(
  '00000001-0000-0000-0000-000000000006', 'elena-petrova', 'Elena Petrova', 'EP',
  'UA', 'Kyiv / Berlin', 'from-sky-300 via-blue-600 to-slate-900',
  'environment-art', 'Cinematic worlds, lived-in light.',
  'Environment artist with a passion for moody, lived-in cinematic worlds.',
  6, 'open', 'Listening to senior offers', 'remote', 'studio', null,
  array['Modular Kits','Lighting','World Building'],
  array['Unreal Engine','Maya','Substance Designer','ZBrush'],
  array['Ukrainian','English','German']
);

select public._seed_talent(
  '00000001-0000-0000-0000-000000000007', 'mateo-silva', 'Mateo Silva', 'MS',
  'BR', 'São Paulo', 'from-amber-300 via-orange-500 to-rose-800',
  'animation-3d', 'Subtle performance over big poses.',
  'Character animator focused on subtle, performance-driven acting.',
  4, 'available', null, 'remote', 'freelance', null,
  array['Character Animation','Acting','Crowds'],
  array['Maya','Blender','Substance Painter'],
  array['Portuguese','Spanish','English']
);

select public._seed_talent(
  '00000001-0000-0000-0000-000000000008', 'noa-bensaid', 'Noa Ben Saïd', 'NB',
  'MA', 'Casablanca', 'from-yellow-200 via-amber-500 to-zinc-900',
  'storyboard', 'Shots that already know how to be cut.',
  'Storyboarder with a strong shot-language background in action and drama.',
  7, 'available', null, 'hybrid', 'freelance', null,
  array['Feature Film','Pre-vis','Action Sequences'],
  array['Photoshop','Toon Boom','Procreate'],
  array['French','Arabic','English']
);

select public._seed_talent(
  '00000001-0000-0000-0000-000000000009', 'ines-laurent', 'Inès Laurent', 'IL',
  'FR', 'Paris', 'from-rose-300 via-pink-500 to-purple-900',
  'visual-direction', 'Direction first. Pixels follow.',
  'Visual director shaping language for premium brands and film projects.',
  10, 'open', null, 'hybrid', 'any', null,
  array['Art Direction','Pitch Films','Brand Worlds'],
  array['After Effects','Cinema 4D','Photoshop','Illustrator'],
  array['French','English']
);

select public._seed_talent(
  '00000001-0000-0000-0000-000000000010', 'henry-okafor', 'Henry Okafor', 'HO',
  'GB', 'London', 'from-amber-300 via-orange-500 to-rose-800',
  'unreal', 'Camera-ready Unreal cinematics.',
  'Unreal artist between commercials and high-end virtual production.',
  6, 'open', null, 'onsite', 'fulltime', null,
  array['LED Volumes','Cinematics','Look-dev'],
  array['Unreal Engine','Maya','Substance Painter','Nuke'],
  array['English']
);

select public._seed_talent(
  '00000001-0000-0000-0000-000000000011', 'amelie-roy', 'Amélie Roy', 'AR',
  'CA', 'Montréal', 'from-emerald-300 via-teal-600 to-slate-900',
  'animation-3d', 'Creatures that earn their weight.',
  'Senior creature animator across feature pipelines.',
  11, 'on-mission', 'On mission until July 2026', 'hybrid', 'studio', null,
  array['Creature Animation','Feature Film'],
  array['Maya','ZBrush','Houdini'], array['French','English']
);

select public._seed_talent(
  '00000001-0000-0000-0000-000000000012', 'rohan-iyer', 'Rohan Iyer', 'RI',
  'IN', 'Mumbai', 'from-violet-400 via-fuchsia-500 to-indigo-900',
  'vfx', 'Comps that hide the work.',
  'Senior compositor with feature credits across Marvel and Netflix shows.',
  5, 'available', null, 'remote', 'freelance', null,
  array['Compositing','DMP Integration','Roto / Paint'],
  array['Nuke','Maya','Photoshop'], array['English','Hindi']
);

select public._seed_talent(
  '00000001-0000-0000-0000-000000000013', 'yuki-shibata', 'Yuki Shibata', 'YS',
  'JP', 'Kyoto', 'from-cyan-400 via-cyan-600 to-indigo-900',
  'motion-design', 'Editorial pace, product clarity.',
  'Motion designer focused on editorial and UI motion.',
  4, 'available', null, 'remote', 'freelance', null,
  array['Editorial Motion','Typography','UI Motion'],
  array['After Effects','Cinema 4D','Figma'], array['Japanese','English']
);

select public._seed_talent(
  '00000001-0000-0000-0000-000000000014', 'marcus-weiss', 'Marcus Weiss', 'MW',
  'DE', 'Berlin', 'from-sky-300 via-blue-600 to-slate-900',
  'editing', 'Cuts that breathe.',
  'Editor across docs and brand work. Soundtrack-led pacing.',
  12, 'open', null, 'hybrid', 'freelance', null,
  array['Documentary','Commercials','Pacing'],
  array['DaVinci Resolve','Premiere','After Effects'], array['German','English']
);

select public._seed_talent(
  '00000001-0000-0000-0000-000000000015', 'diana-popescu', 'Diana Popescu', 'DP',
  'FR', 'Lyon', 'from-amber-300 via-orange-500 to-rose-800',
  'generalist-3d', 'Blender-first, light-led.',
  'Generalist with a sharp lighting eye, Blender-first pipeline.',
  5, 'available', null, 'remote', 'freelance', null,
  array['Cinematics','Look-dev','Lighting'],
  array['Blender','Substance Painter','Unreal Engine'],
  array['French','Romanian','English']
);

select public._seed_talent(
  '00000001-0000-0000-0000-000000000016', 'tomas-novak', 'Tomas Novak', 'TN',
  'PL', 'Warsaw', 'from-yellow-200 via-amber-500 to-zinc-900',
  'environment-art', 'Materials that scale.',
  'Procedural material specialist for AAA worlds.',
  8, 'open', null, 'remote', 'fulltime', null,
  array['Procedural Worlds','Substance Designer','Materials'],
  array['Substance Designer','Maya','Houdini','Unreal Engine'],
  array['Polish','English']
);

select public._seed_talent(
  '00000001-0000-0000-0000-000000000017', 'isla-thompson', 'Isla Thompson', 'IT',
  'GB', 'Bristol', 'from-rose-300 via-pink-500 to-purple-900',
  'character-art', 'Stylized characters that ship.',
  'Character artist for indie and AA titles.',
  6, 'available', null, 'remote', 'freelance', null,
  array['Stylized','Game Characters','Hair & Cloth'],
  array['ZBrush','Marvelous Designer','Substance Painter','Maya'],
  array['English']
);

select public._seed_talent(
  '00000001-0000-0000-0000-000000000018', 'andre-silva', 'André Silva', 'AS',
  'PT', 'Lisbon', 'from-sky-300 via-blue-600 to-slate-900',
  'vfx', 'Water that wants to be cinema.',
  'Houdini FX artist focused on water and smoke.',
  4, 'available', null, 'remote', 'freelance', null,
  array['Houdini FX','Water','Smoke'],
  array['Houdini','Nuke','Mantra','Karma'], array['Portuguese','English']
);

select public._seed_talent(
  '00000001-0000-0000-0000-000000000019', 'maya-cohen', 'Maya Cohen', 'MC',
  'US', 'Los Angeles', 'from-amber-300 via-orange-500 to-rose-800',
  'animation-3d', 'Performance-first animation.',
  'Senior animator with cinematic credits across AAA games.',
  9, 'on-mission', 'On mission until November 2026', 'hybrid', 'fulltime', null,
  array['Acting Animation','Game Cinematics'],
  array['Maya','MotionBuilder','Unreal Engine'], array['English']
);

select public._seed_talent(
  '00000001-0000-0000-0000-000000000020', 'lukas-eriksson', 'Lukas Eriksson', 'LE',
  'SE', 'Stockholm', 'from-cyan-400 via-cyan-600 to-indigo-900',
  'unreal', 'Real-time FX with TD eyes.',
  'Unreal artist with TD chops. Niagara obsessive.',
  7, 'available', null, 'remote', 'freelance', null,
  array['Niagara FX','Real-time Cinematics','Tooling'],
  array['Unreal Engine','Houdini','Maya'], array['Swedish','English']
);

select public._seed_talent(
  '00000001-0000-0000-0000-000000000021', 'ana-rodriguez', 'Ana Rodríguez', 'AR',
  'MX', 'Mexico City', 'from-rose-300 via-pink-500 to-purple-900',
  'motion-design', 'Mograph that earns the next frame.',
  'Mograph designer between editorial and brand work.',
  5, 'available', null, 'remote', 'freelance', null,
  array['3D Mograph','Type','Editorial'],
  array['Cinema 4D','After Effects','Octane'], array['Spanish','English']
);

select public._seed_talent(
  '00000001-0000-0000-0000-000000000022', 'yara-nahas', 'Yara Nahas', 'YN',
  'EG', 'Cairo', 'from-amber-300 via-orange-500 to-rose-800',
  'storyboard', 'Storyboards that already feel cut.',
  'Storyboarder across animation series and feature pre-vis.',
  6, 'available', null, 'remote', 'freelance', null,
  array['Animation Features','Series','Pre-vis'],
  array['Toon Boom','Procreate','Photoshop'], array['Arabic','English','French']
);

select public._seed_talent(
  '00000001-0000-0000-0000-000000000023', 'victor-chen', 'Victor Chen', 'VC',
  'CN', 'Shanghai', 'from-yellow-200 via-amber-500 to-zinc-900',
  'environment-art', 'Worlds scanned from real ones.',
  'Cinematic environment lead. Photogrammetry-first pipelines.',
  9, 'on-mission', null, 'onsite', 'fulltime', null,
  array['Cinematic Environments','Photogrammetry'],
  array['Unreal Engine','Maya','RealityCapture','Substance Designer'],
  array['Mandarin','English']
);

select public._seed_talent(
  '00000001-0000-0000-0000-000000000024', 'olivia-andersson', 'Olivia Andersson', 'OA',
  'NO', 'Oslo', 'from-sky-300 via-blue-600 to-slate-900',
  'visual-direction', 'Editorial silence over loud design.',
  'Visual director with a soft, editorial Nordic vocabulary.',
  8, 'available', null, 'remote', 'freelance', null,
  array['Branded Content','Pitch Decks','Editorial'],
  array['After Effects','Illustrator','Photoshop','Figma'], array['Norwegian','English']
);

select public._seed_talent(
  '00000001-0000-0000-0000-000000000025', 'ibrahim-keita', 'Ibrahim Keïta', 'IK',
  'CM', 'Douala', 'from-amber-300 via-orange-500 to-rose-800',
  'animation-3d', 'Stylized acting, rising fast.',
  'Rising character animator with stylized acting reel.',
  3, 'available', null, 'remote', 'freelance', null,
  array['Character Animation','Stylized'],
  array['Blender','Maya'], array['French','English']
);

select public._seed_talent(
  '00000001-0000-0000-0000-000000000026', 'claire-dupont', 'Claire Dupont', 'CD',
  'FR', 'Annecy', 'from-yellow-200 via-amber-500 to-zinc-900',
  'editing', 'Editing as the second direction.',
  'Animation editor across feature films.',
  11, 'open', null, 'hybrid', 'studio', null,
  array['Animation Feature','Series'],
  array['DaVinci Resolve','Premiere','Avid'], array['French','English']
);

select public._seed_talent(
  '00000001-0000-0000-0000-000000000027', 'haruto-mori', 'Haruto Mori', 'HM',
  'JP', 'Osaka', 'from-sky-300 via-blue-600 to-slate-900',
  'character-art', 'Hyper-detail with restraint.',
  'Cinematic character artist. Hyper-detail look-dev specialty.',
  7, 'available', null, 'remote', 'freelance', null,
  array['Cinematic Characters','Look-dev'],
  array['ZBrush','Maya','Substance Painter','Marmoset Toolbag'],
  array['Japanese','English']
);

select public._seed_talent(
  '00000001-0000-0000-0000-000000000028', 'linnea-holm', 'Linnea Holm', 'LH',
  'FI', 'Helsinki', 'from-violet-400 via-fuchsia-500 to-indigo-900',
  'vfx', 'Atmospherics with weight.',
  'FX artist focused on atmospherics.',
  6, 'open', null, 'remote', 'freelance', null,
  array['Smoke','Pyro','Dust'],
  array['Houdini','Nuke'], array['Finnish','English']
);

select public._seed_talent(
  '00000001-0000-0000-0000-000000000029', 'diego-fernandez', 'Diego Fernández', 'DF',
  'AR', 'Buenos Aires', 'from-amber-300 via-orange-500 to-rose-800',
  'generalist-3d', 'Generalist with a colorist''s eye.',
  'Generalist with feature credits in cinematic short films.',
  7, 'available', null, 'remote', 'freelance', null,
  array['Look-dev','Lighting','Compositing'],
  array['Blender','Cycles','Nuke','Photoshop'], array['Spanish','English']
);

select public._seed_talent(
  '00000001-0000-0000-0000-000000000030', 'samuel-okeke', 'Samuel Okeke', 'SO',
  'KE', 'Nairobi', 'from-cyan-400 via-cyan-600 to-indigo-900',
  'unreal', 'Archviz that doesn''t look like archviz.',
  'Unreal artist between archviz and cinematic short-form.',
  4, 'available', null, 'remote', 'freelance', null,
  array['Architectural Visualization','Cinematics'],
  array['Unreal Engine','Twinmotion','Blender'], array['English','Swahili']
);

-- ─── Seed portfolio items for the first 6 talents (just enough to look good) ─
insert into public.portfolio_items (talent_id, kind, title, subtitle, ratio, gradient, position, is_featured, is_cover) values
  ('00000001-0000-0000-0000-000000000001', 'video', 'Fauves — Title Sequence', 'Director''s cut', '16/9', 'from-amber-300 via-orange-500 to-rose-800', 0, true, true),
  ('00000001-0000-0000-0000-000000000001', 'image', 'Coq Bleu — Concept Frame', null, '16/9', 'from-cyan-400 via-cyan-600 to-indigo-900', 1, false, false),
  ('00000001-0000-0000-0000-000000000001', 'image', 'Megacity — Lookdev', null, '4/5', 'from-violet-400 via-fuchsia-500 to-indigo-900', 2, false, false),
  ('00000001-0000-0000-0000-000000000001', 'image', 'Hero Shot 042', null, '1/1', 'from-sky-300 via-blue-600 to-slate-900', 3, false, false),
  ('00000001-0000-0000-0000-000000000001', 'video', 'Creature Run Cycle', null, '16/9', 'from-emerald-300 via-teal-600 to-slate-900', 4, false, false),
  ('00000001-0000-0000-0000-000000000001', 'image', 'Spec Project — Reaper', null, '4/5', 'from-orange-400 via-red-600 to-zinc-900', 5, false, false)
on conflict do nothing;

-- ─── Seed experiences ──────────────────────────────────────────────────
insert into public.experiences (talent_id, studio_name, role, period, start_year, end_year, position) values
  ('00000001-0000-0000-0000-000000000001', 'MOPA',                       'Animation Graduate Film',  '2022 – 2023',  2022, 2023, 0),
  ('00000001-0000-0000-0000-000000000001', 'Ynov Paris',                 '3D Generalist (BFA)',      '2018 – 2021',  2018, 2021, 1),
  ('00000001-0000-0000-0000-000000000001', 'Independent / Freelance',    'Cinematic Generalist',     '2023 – Present', 2023, null, 2)
on conflict do nothing;

-- ─── Final pass: compute scores + refresh ranks + auto-badges ──────────
do $$
declare r record;
begin
  for r in select id from public.talents loop
    perform public.refresh_talent_score(r.id);
  end loop;
end $$;

select public.refresh_all_ranks();
select public.refresh_auto_badges();

-- Cleanup
drop function if exists public._seed_talent(uuid, text, text, text, char(2), text, text, discipline_id, text, text, int, availability_status, text, work_mode, contract_type, text, text[], text[], text[]);
