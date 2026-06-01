-- TalentRank — 0011 — Row-Level Security
-- ---------------------------------------------------------------------------
-- Rules of thumb:
--   • Everything readable on the public site is `select` w/ `using (true)` or
--     a "not hidden" filter. Writes are always scoped to the row's owner.
--   • Studio data uses helper functions `is_studio_member` / `is_studio_owner`
--     (defined in 0004) instead of inlining the lookup. Easier to evolve.
--   • Score tables (`talent_scores`, `score_events`) are read-only to clients;
--     only SECURITY DEFINER functions (service role) write to them.
--   • `talent_badges` is writable by admins or by SECURITY DEFINER badge job.

-- ─── Enable RLS ─────────────────────────────────────────────────────────
alter table public.profiles                       enable row level security;
alter table public.talents                        enable row level security;
alter table public.studios                        enable row level security;
alter table public.studio_members                 enable row level security;
alter table public.studio_verification_requests   enable row level security;
alter table public.portfolio_items                enable row level security;
alter table public.experiences                    enable row level security;
alter table public.talent_scores                  enable row level security;
alter table public.score_events                   enable row level security;
alter table public.endorsements                   enable row level security;
alter table public.shortlists                     enable row level security;
alter table public.shortlist_items                enable row level security;
alter table public.hirings                        enable row level security;
alter table public.conversations                  enable row level security;
alter table public.messages                       enable row level security;
alter table public.badges                         enable row level security;
alter table public.talent_badges                  enable row level security;

-- ─── Profiles ──────────────────────────────────────────────────────────
drop policy if exists profiles_select_public on public.profiles;
create policy profiles_select_public on public.profiles
  for select using (true);

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ─── Talents ───────────────────────────────────────────────────────────
drop policy if exists talents_select_visible on public.talents;
create policy talents_select_visible on public.talents
  for select using (
    not is_hidden or auth.uid() = id
  );

drop policy if exists talents_insert_self on public.talents;
create policy talents_insert_self on public.talents
  for insert with check (auth.uid() = id);

drop policy if exists talents_update_self on public.talents;
create policy talents_update_self on public.talents
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ─── Studios ───────────────────────────────────────────────────────────
drop policy if exists studios_select_public on public.studios;
create policy studios_select_public on public.studios
  for select using (true);

drop policy if exists studios_insert_signed_in on public.studios;
create policy studios_insert_signed_in on public.studios
  for insert with check (auth.uid() is not null);

drop policy if exists studios_update_owner on public.studios;
create policy studios_update_owner on public.studios
  for update using (public.is_studio_owner(id)) with check (public.is_studio_owner(id));

-- ─── Studio members ────────────────────────────────────────────────────
drop policy if exists studio_members_select on public.studio_members;
create policy studio_members_select on public.studio_members
  for select using (public.is_studio_member(studio_id) or user_id = auth.uid());

drop policy if exists studio_members_cud_owner on public.studio_members;
create policy studio_members_cud_owner on public.studio_members
  for all using (public.is_studio_owner(studio_id)) with check (public.is_studio_owner(studio_id));

-- ─── Studio verification ───────────────────────────────────────────────
drop policy if exists studio_verifications_select on public.studio_verification_requests;
create policy studio_verifications_select on public.studio_verification_requests
  for select using (public.is_studio_member(studio_id));

drop policy if exists studio_verifications_insert on public.studio_verification_requests;
create policy studio_verifications_insert on public.studio_verification_requests
  for insert with check (public.is_studio_owner(studio_id));

-- ─── Portfolio items ───────────────────────────────────────────────────
drop policy if exists portfolio_select on public.portfolio_items;
create policy portfolio_select on public.portfolio_items
  for select using (
    auth.uid() = talent_id
    or exists (
      select 1 from public.talents t
      where t.id = talent_id and not t.is_hidden
    )
  );

drop policy if exists portfolio_cud_self on public.portfolio_items;
create policy portfolio_cud_self on public.portfolio_items
  for all using (auth.uid() = talent_id) with check (auth.uid() = talent_id);

-- ─── Experiences ───────────────────────────────────────────────────────
drop policy if exists experiences_select on public.experiences;
create policy experiences_select on public.experiences
  for select using (
    auth.uid() = talent_id
    or exists (select 1 from public.talents t where t.id = talent_id and not t.is_hidden)
  );

drop policy if exists experiences_cud_self on public.experiences;
create policy experiences_cud_self on public.experiences
  for all using (auth.uid() = talent_id) with check (auth.uid() = talent_id);

-- Studios can flip is_verified=true on experiences linked to them.
drop policy if exists experiences_verify_by_studio on public.experiences;
create policy experiences_verify_by_studio on public.experiences
  for update using (studio_id is not null and public.is_studio_member(studio_id))
  with check (studio_id is not null and public.is_studio_member(studio_id));

-- ─── Talent scores (read-only to clients) ──────────────────────────────
drop policy if exists scores_select on public.talent_scores;
create policy scores_select on public.talent_scores
  for select using (true);

drop policy if exists score_events_select_self on public.score_events;
create policy score_events_select_self on public.score_events
  for select using (auth.uid() = talent_id);

-- ─── Endorsements ──────────────────────────────────────────────────────
drop policy if exists endorsements_select on public.endorsements;
create policy endorsements_select on public.endorsements
  for select using (true);

drop policy if exists endorsements_insert on public.endorsements;
create policy endorsements_insert on public.endorsements
  for insert with check (
    auth.uid() = endorser_id
    and endorser_id <> talent_id  -- can't endorse yourself
  );

drop policy if exists endorsements_delete_self on public.endorsements;
create policy endorsements_delete_self on public.endorsements
  for delete using (auth.uid() = endorser_id);

-- ─── Shortlists (private to the studio) ────────────────────────────────
drop policy if exists shortlists_select_member on public.shortlists;
create policy shortlists_select_member on public.shortlists
  for select using (public.is_studio_member(studio_id));

drop policy if exists shortlists_cud_member on public.shortlists;
create policy shortlists_cud_member on public.shortlists
  for all using (public.is_studio_member(studio_id))
  with check (public.is_studio_member(studio_id));

drop policy if exists shortlist_items_select on public.shortlist_items;
create policy shortlist_items_select on public.shortlist_items
  for select using (
    exists (select 1 from public.shortlists s
      where s.id = shortlist_id and public.is_studio_member(s.studio_id))
  );

drop policy if exists shortlist_items_cud on public.shortlist_items;
create policy shortlist_items_cud on public.shortlist_items
  for all using (
    exists (select 1 from public.shortlists s
      where s.id = shortlist_id and public.is_studio_member(s.studio_id))
  )
  with check (
    exists (select 1 from public.shortlists s
      where s.id = shortlist_id and public.is_studio_member(s.studio_id))
  );

-- ─── Hirings ───────────────────────────────────────────────────────────
drop policy if exists hirings_select_participants on public.hirings;
create policy hirings_select_participants on public.hirings
  for select using (
    auth.uid() = talent_id or public.is_studio_member(studio_id)
  );

drop policy if exists hirings_insert_studio on public.hirings;
create policy hirings_insert_studio on public.hirings
  for insert with check (
    public.is_studio_member(studio_id) and created_by = auth.uid()
  );

-- Talents may update status (confirm/dispute); studios may also update.
drop policy if exists hirings_update_participants on public.hirings;
create policy hirings_update_participants on public.hirings
  for update using (
    auth.uid() = talent_id or public.is_studio_member(studio_id)
  )
  with check (
    auth.uid() = talent_id or public.is_studio_member(studio_id)
  );

-- ─── Messaging ─────────────────────────────────────────────────────────
drop policy if exists conversations_select_participant on public.conversations;
create policy conversations_select_participant on public.conversations
  for select using (
    auth.uid() = talent_id or public.is_studio_member(studio_id)
  );

drop policy if exists conversations_insert_studio on public.conversations;
create policy conversations_insert_studio on public.conversations
  for insert with check (
    public.is_studio_member(studio_id) and created_by = auth.uid()
  );

drop policy if exists conversations_update_participant on public.conversations;
create policy conversations_update_participant on public.conversations
  for update using (
    auth.uid() = talent_id or public.is_studio_member(studio_id)
  );

drop policy if exists messages_select_participant on public.messages;
create policy messages_select_participant on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.talent_id = auth.uid() or public.is_studio_member(c.studio_id))
    )
  );

drop policy if exists messages_insert_participant on public.messages;
create policy messages_insert_participant on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.talent_id = auth.uid() or public.is_studio_member(c.studio_id))
    )
  );

-- ─── Badges ────────────────────────────────────────────────────────────
drop policy if exists badges_select_all on public.badges;
create policy badges_select_all on public.badges
  for select using (true);

drop policy if exists talent_badges_select_all on public.talent_badges;
create policy talent_badges_select_all on public.talent_badges
  for select using (true);
-- Insertion/deletion only via SECURITY DEFINER functions
