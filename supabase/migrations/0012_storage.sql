-- TalentRank — 0012 — Storage buckets & policies
-- ---------------------------------------------------------------------------
-- Buckets:
--   • portfolios  — public-read, owner-write. Path: `${talent_id}/<filename>`.
--   • studio-logos — public-read, studio-owner-write. Path: `${studio_id}/...`
--
-- Owner check uses the first segment of the path against auth.uid() (standard
-- Supabase pattern). For studio uploads, we look up membership.

-- ─── Create buckets (idempotent) ─────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('portfolios',   'portfolios',   true,  524288000, array['image/png','image/jpeg','image/webp','image/avif','video/mp4','video/webm','video/quicktime']),
  ('studio-logos','studio-logos',  true,  10485760,  array['image/png','image/jpeg','image/webp','image/svg+xml'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ─── portfolios policies ────────────────────────────────────────────────
drop policy if exists "portfolios read public" on storage.objects;
create policy "portfolios read public" on storage.objects
  for select using (bucket_id = 'portfolios');

drop policy if exists "portfolios insert owner" on storage.objects;
create policy "portfolios insert owner" on storage.objects
  for insert with check (
    bucket_id = 'portfolios'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "portfolios update owner" on storage.objects;
create policy "portfolios update owner" on storage.objects
  for update using (
    bucket_id = 'portfolios'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "portfolios delete owner" on storage.objects;
create policy "portfolios delete owner" on storage.objects
  for delete using (
    bucket_id = 'portfolios'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ─── studio-logos policies ──────────────────────────────────────────────
drop policy if exists "studio-logos read public" on storage.objects;
create policy "studio-logos read public" on storage.objects
  for select using (bucket_id = 'studio-logos');

drop policy if exists "studio-logos insert member" on storage.objects;
create policy "studio-logos insert member" on storage.objects
  for insert with check (
    bucket_id = 'studio-logos'
    and exists (
      select 1 from public.studio_members sm
      where sm.studio_id::text = (storage.foldername(name))[1]
        and sm.user_id = auth.uid()
    )
  );

drop policy if exists "studio-logos update member" on storage.objects;
create policy "studio-logos update member" on storage.objects
  for update using (
    bucket_id = 'studio-logos'
    and exists (
      select 1 from public.studio_members sm
      where sm.studio_id::text = (storage.foldername(name))[1]
        and sm.user_id = auth.uid()
    )
  );

drop policy if exists "studio-logos delete owner" on storage.objects;
create policy "studio-logos delete owner" on storage.objects
  for delete using (
    bucket_id = 'studio-logos'
    and exists (
      select 1 from public.studio_members sm
      where sm.studio_id::text = (storage.foldername(name))[1]
        and sm.user_id = auth.uid()
        and sm.role = 'owner'
    )
  );
