-- TalentRank — 0014 — Sign-up handlers
-- ---------------------------------------------------------------------------
-- When a user signs up via Supabase Auth, the metadata they send in
-- `options.data` carries their requested role, display name, etc. We use a
-- trigger on auth.users to materialise the profile row atomically, so RLS
-- never has to deal with "user exists but no profile".
--
-- Required metadata at sign-up:
--   { role: 'talent' | 'studio', username, display_name,
--     country_code (optional), discipline (only if role='talent') }

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role user_role;
  v_username text;
  v_display_name text;
  v_country text;
  v_discipline discipline_id;
  v_studio_name text;
begin
  -- Defaults
  v_role := coalesce((new.raw_user_meta_data->>'role')::user_role, 'talent'::user_role);
  v_username := lower(coalesce(
    new.raw_user_meta_data->>'username',
    'user-' || substring(new.id::text, 1, 8)
  ));
  v_display_name := coalesce(new.raw_user_meta_data->>'display_name', new.email);
  v_country := upper(coalesce(new.raw_user_meta_data->>'country_code', 'XX'));

  -- Create profile (will fail loudly if username collides — caller retries)
  insert into public.profiles (id, role, username, display_name, country_code, avatar_initials)
  values (
    new.id, v_role, v_username, v_display_name, v_country,
    upper(substring(regexp_replace(v_display_name, '[^a-zA-Z]', '', 'g'), 1, 2))
  );

  -- Role-specific
  if v_role = 'talent' then
    v_discipline := coalesce((new.raw_user_meta_data->>'discipline')::discipline_id, 'generalist-3d'::discipline_id);
    insert into public.talents (id, discipline) values (new.id, v_discipline);
    -- Initial score = 0 placeholder
    insert into public.talent_scores (talent_id) values (new.id);
  elsif v_role = 'studio' then
    v_studio_name := coalesce(new.raw_user_meta_data->>'studio_name', v_display_name);
    insert into public.studios (id, legal_name) values (new.id, v_studio_name);
    -- Creator becomes the owner
    insert into public.studio_members (studio_id, user_id, role, added_by)
    values (new.id, new.id, 'owner', new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ─── Username availability check (RPC for sign-up form) ──────────────────
create or replace function public.is_username_available(p_username text)
returns boolean
language sql
stable
as $$
  select not exists (
    select 1 from public.profiles where username = lower(p_username)
  );
$$;
