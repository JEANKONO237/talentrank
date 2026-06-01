-- TalentRank — 0017 — Interview Proposals
-- ---------------------------------------------------------------------------
-- The product rejects the "apply with a CV" model. Recruiters propose
-- interviews directly from a profile, with a structured payload. Talents
-- accept / decline / hold. Free-form chat (`messages`) is unlocked once
-- the proposal is accepted, not before — keeps the inbox clean and signal-only.

do $$ begin
  create type proposal_status as enum (
    'pending',   -- waiting for talent action
    'accepted',  -- talent accepted → conversation unlocked
    'declined',  -- talent declined
    'held',      -- talent pressed "hold" — recruiter notified, can revise
    'expired',   -- past expires_at without action
    'withdrawn'  -- recruiter pulled it
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type proposal_contract as enum ('fulltime', 'freelance', 'studio', 'internship', 'apprenticeship', 'any');
exception when duplicate_object then null; end $$;

create table if not exists public.interview_proposals (
  id uuid primary key default gen_random_uuid(),

  studio_id uuid not null references public.studios(id) on delete cascade,
  talent_id uuid not null references public.talents(id) on delete cascade,

  -- Authoring + audit
  created_by uuid not null references public.profiles(id),
  status proposal_status not null default 'pending',

  -- The actual proposal — minimal, structured, no cover-letter required.
  role_title text not null check (char_length(role_title) between 2 and 120),
  message text check (message is null or char_length(message) <= 2000),

  contract_type proposal_contract not null default 'fulltime',
  work_mode work_mode not null default 'hybrid',
  location text,                          -- e.g. "Paris" or "Remote (EU)"
  start_date_earliest date,
  start_date_latest date,

  salary_min int,                         -- EUR-cents
  salary_max int,
  salary_currency char(3) default 'EUR',

  -- Optional: a deadline after which the proposal auto-expires.
  expires_at timestamptz,

  -- Linked conversation (created on accept). Optional until then.
  conversation_id uuid references public.conversations(id) on delete set null,

  -- Lifecycle audit
  accepted_at timestamptz,
  declined_at timestamptz,
  declined_reason text,
  withdrawn_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists proposals_talent_idx on public.interview_proposals (talent_id, status);
create index if not exists proposals_studio_idx on public.interview_proposals (studio_id, status);
create index if not exists proposals_pending_idx on public.interview_proposals (talent_id) where status = 'pending';

drop trigger if exists proposals_updated_at on public.interview_proposals;
create trigger proposals_updated_at
  before update on public.interview_proposals
  for each row execute function public.set_updated_at();

-- ─── RLS ────────────────────────────────────────────────────────────────
alter table public.interview_proposals enable row level security;

drop policy if exists proposals_select_participant on public.interview_proposals;
create policy proposals_select_participant on public.interview_proposals
  for select using (
    auth.uid() = talent_id or public.is_studio_member(studio_id)
  );

drop policy if exists proposals_insert_studio on public.interview_proposals;
create policy proposals_insert_studio on public.interview_proposals
  for insert with check (
    public.is_studio_member(studio_id)
    and created_by = auth.uid()
    -- Only verified studios may send proposals.
    and exists (select 1 from public.studios s where s.id = studio_id and s.is_verified)
  );

-- Talent updates status; studio can withdraw.
drop policy if exists proposals_update_participants on public.interview_proposals;
create policy proposals_update_participants on public.interview_proposals
  for update using (
    auth.uid() = talent_id or public.is_studio_member(studio_id)
  )
  with check (
    auth.uid() = talent_id or public.is_studio_member(studio_id)
  );

-- ─── Helpers ────────────────────────────────────────────────────────────
-- Send a proposal (studio only). Returns the inserted row id.
create or replace function public.send_interview_proposal(
  p_studio_id uuid,
  p_talent_id uuid,
  p_role_title text,
  p_message text default null,
  p_contract_type proposal_contract default 'fulltime',
  p_work_mode work_mode default 'hybrid',
  p_location text default null,
  p_start_earliest date default null,
  p_start_latest date default null,
  p_salary_min int default null,
  p_salary_max int default null,
  p_currency char(3) default 'EUR',
  p_expires_at timestamptz default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.is_studio_member(p_studio_id) then
    raise exception 'forbidden: not a studio member';
  end if;

  insert into public.interview_proposals (
    studio_id, talent_id, created_by, role_title, message, contract_type, work_mode,
    location, start_date_earliest, start_date_latest,
    salary_min, salary_max, salary_currency, expires_at
  )
  values (
    p_studio_id, p_talent_id, auth.uid(), p_role_title, p_message, p_contract_type, p_work_mode,
    p_location, p_start_earliest, p_start_latest,
    p_salary_min, p_salary_max, p_currency, p_expires_at
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- Talent accepts → unlock a conversation.
create or replace function public.accept_interview_proposal(p_proposal_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_proposal record;
  v_conversation_id uuid;
begin
  select * into v_proposal from public.interview_proposals where id = p_proposal_id;
  if not found then raise exception 'proposal not found'; end if;
  if v_proposal.talent_id <> auth.uid() then raise exception 'forbidden'; end if;
  if v_proposal.status <> 'pending' then raise exception 'proposal not pending'; end if;

  -- Find or create the conversation
  insert into public.conversations (studio_id, talent_id, subject, created_by)
  values (v_proposal.studio_id, v_proposal.talent_id,
          'Interview proposal: ' || v_proposal.role_title, v_proposal.created_by)
  on conflict (studio_id, talent_id) do update set
    subject = coalesce(public.conversations.subject, excluded.subject)
  returning id into v_conversation_id;

  update public.interview_proposals
     set status = 'accepted', accepted_at = now(), conversation_id = v_conversation_id
   where id = p_proposal_id;

  return v_conversation_id;
end;
$$;

create or replace function public.decline_interview_proposal(p_proposal_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_talent uuid;
  v_status proposal_status;
begin
  select talent_id, status into v_talent, v_status from public.interview_proposals where id = p_proposal_id;
  if v_talent is null then raise exception 'proposal not found'; end if;
  if v_talent <> auth.uid() then raise exception 'forbidden'; end if;
  if v_status <> 'pending' and v_status <> 'held' then raise exception 'cannot decline at this stage'; end if;

  update public.interview_proposals
     set status = 'declined', declined_at = now(), declined_reason = p_reason
   where id = p_proposal_id;
end;
$$;

create or replace function public.hold_interview_proposal(p_proposal_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_talent uuid;
begin
  select talent_id into v_talent from public.interview_proposals where id = p_proposal_id;
  if v_talent <> auth.uid() then raise exception 'forbidden'; end if;
  update public.interview_proposals set status = 'held' where id = p_proposal_id and status = 'pending';
end;
$$;

create or replace function public.withdraw_interview_proposal(p_proposal_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_studio uuid;
begin
  select studio_id into v_studio from public.interview_proposals where id = p_proposal_id;
  if not public.is_studio_member(v_studio) then raise exception 'forbidden'; end if;
  update public.interview_proposals
     set status = 'withdrawn', withdrawn_at = now()
   where id = p_proposal_id and status in ('pending', 'held');
end;
$$;

-- ─── Messages gate ──────────────────────────────────────────────────────
-- Refine the messages_insert_participant policy: studios can only send a
-- message in a conversation that's linked to an accepted proposal OR a
-- hiring. This enforces "no cold-DM" — the talent must accept first.

drop policy if exists messages_insert_participant on public.messages;
create policy messages_insert_participant on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (
        -- Talent can always reply in their own conversation
        c.talent_id = auth.uid()
        -- Studio members can send only if conversation has an accepted proposal or hiring
        or (
          public.is_studio_member(c.studio_id)
          and (
            exists (
              select 1 from public.interview_proposals ip
              where ip.conversation_id = c.id and ip.status = 'accepted'
            )
            or exists (
              select 1 from public.hirings h
              where h.talent_id = c.talent_id and h.studio_id = c.studio_id
            )
          )
        )
      )
    )
  );

-- Realtime publication
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.interview_proposals;
  end if;
exception when duplicate_object then null; end $$;
