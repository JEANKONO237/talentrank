-- TalentRank — 0008 — Messaging (realtime)
-- ---------------------------------------------------------------------------
-- One conversation per (studio, talent) pair. Multiple recruiters in a studio
-- see and contribute to the same thread. Messages are append-only; soft
-- delete via `deleted_at` if needed later.

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  talent_id uuid not null references public.talents(id) on delete cascade,

  subject text,
  last_message_at timestamptz not null default now(),
  last_message_preview text,

  -- Unread counters maintained by triggers
  unread_for_talent int not null default 0,
  unread_for_studio int not null default 0,

  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),

  unique (studio_id, talent_id)
);

create index if not exists conversations_talent_idx
  on public.conversations (talent_id, last_message_at desc);
create index if not exists conversations_studio_idx
  on public.conversations (studio_id, last_message_at desc);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,

  body text not null check (char_length(body) between 1 and 8000),

  read_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_idx
  on public.messages (conversation_id, created_at desc);
create index if not exists messages_unread_idx
  on public.messages (conversation_id) where read_at is null;

-- ─── Maintain conversation.last_message_at + previews + unread counters ──
create or replace function public.bump_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_studio_id uuid;
  v_talent_id uuid;
  v_sender_role user_role;
begin
  select studio_id, talent_id into v_studio_id, v_talent_id
  from public.conversations where id = new.conversation_id;

  select role into v_sender_role
  from public.profiles where id = new.sender_id;

  update public.conversations
     set last_message_at = new.created_at,
         last_message_preview = left(new.body, 140),
         unread_for_talent = case when v_sender_role = 'studio' then unread_for_talent + 1 else unread_for_talent end,
         unread_for_studio = case when v_sender_role = 'talent' then unread_for_studio + 1 else unread_for_studio end
   where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_bump_conversation on public.messages;
create trigger messages_bump_conversation
  after insert on public.messages
  for each row execute function public.bump_conversation_on_message();

-- ─── Mark conversation as read by current user ───────────────────────────
create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_studio_id uuid;
  v_talent_id uuid;
  v_role user_role;
begin
  select studio_id, talent_id into v_studio_id, v_talent_id
  from public.conversations where id = p_conversation_id;

  if not (auth.uid() = v_talent_id or public.is_studio_member(v_studio_id)) then
    raise exception 'forbidden';
  end if;

  select role into v_role from public.profiles where id = auth.uid();

  update public.messages
     set read_at = now()
   where conversation_id = p_conversation_id
     and read_at is null
     and sender_id <> auth.uid();

  update public.conversations
     set unread_for_talent = case when v_role = 'talent' then 0 else unread_for_talent end,
         unread_for_studio = case when v_role = 'studio' then 0 else unread_for_studio end
   where id = p_conversation_id;
end;
$$;

-- ─── Realtime publication ────────────────────────────────────────────────
-- Supabase auto-creates `supabase_realtime` publication. We add our tables.
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.messages;
    alter publication supabase_realtime add table public.conversations;
  end if;
exception when duplicate_object then null; end $$;
