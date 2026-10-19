-- Self flow, step 1: the schema for someone using Mira for themselves.
--
-- A self user has a normal account and is their OWN taker (is_self). Their
-- backups must say YES to an invite before they're alerted (confirmed_at).
-- Invites can now be for a backup (backup_id) as well as for a taker.


-- ---------------------------------------------------------------- takers.is_self

alter table public.takers
  add column is_self boolean not null default false;

-- At most one "me" per account
create unique index takers_one_self_per_account on public.takers (caregiver_id) where is_self;

-- A self taker is the account holder, so:
--   * their phone is always the account's verified sign-in number (so "self"
--     can't be used to skip the invite for someone else's number)
--   * they're active straight away (no invite to themselves)
--   * the flag can't be switched later
create function public.takers_self_rules()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_phone text;
begin
  if tg_op = 'UPDATE' and new.is_self is distinct from old.is_self then
    raise exception 'cannot_change_is_self';
  end if;
  if new.is_self then
    select g.phone into v_phone from public.caregivers g where g.id = new.caregiver_id;
    if v_phone is null then
      raise exception 'no_verified_phone';
    end if;
    new.phone := v_phone;
    if tg_op = 'INSERT' then
      new.status := 'active';
      new.joined_at := now();
    else
      -- (the phone-change trigger may have run first; a self taker stays joined)
      new.status := old.status;
      new.joined_at := old.joined_at;
    end if;
  end if;
  return new;
end;
$$;

create trigger takers_self_rules
  before insert or update on public.takers
  for each row execute function public.takers_self_rules();

-- The app may say "this is me" when creating; never change it afterwards
grant insert (is_self) on public.takers to authenticated;


-- ---------------------------------------------------------------- backups.confirmed_at

-- When this backup said YES to being a backup. Only the server sets it.
alter table public.backups
  add column confirmed_at timestamptz;

-- The app can still add, edit, reorder and remove backups, but not confirm them
revoke insert, update on public.backups from authenticated;
grant insert (id, taker_id, name, phone, relationship, position, alert_after_minutes)
  on public.backups to authenticated;
grant update (name, phone, relationship, position, alert_after_minutes)
  on public.backups to authenticated;

-- A new number hasn't agreed to anything: they have to say yes again
create function public.backups_phone_changed()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.phone is distinct from old.phone then
    new.confirmed_at := null;
  end if;
  return new;
end;
$$;

create trigger backups_phone_changed
  before update of phone on public.backups
  for each row execute function public.backups_phone_changed();


-- ---------------------------------------------------------------- invites.backup_id

-- An invite to a backup (backup_id set) rather than to the taker (backup_id null)
alter table public.invites
  add column backup_id uuid references public.backups (id) on delete cascade;

create index invites_backup_id on public.invites (backup_id);

-- One pending invite per taker (taker invites) and per backup (backup invites)
drop index public.invites_one_pending_per_taker;
create unique index invites_one_pending_per_taker
  on public.invites (taker_id) where status = 'pending' and backup_id is null;
create unique index invites_one_pending_per_backup
  on public.invites (backup_id) where status = 'pending' and backup_id is not null;


-- ---------------------------------------------------------------- the taker-invite functions ignore backup invites
-- Same as before; each now only looks at invites where backup_id is null.

create or replace function public.prepare_invite(
  p_caregiver_id uuid,
  p_taker_id uuid,
  p_invite_id uuid,
  p_message text
)
returns table (send_id uuid, to_phone text, send_status public.send_status)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_taker public.takers%rowtype;
  v_send public.sends%rowtype;
begin
  select * into v_taker
  from public.takers
  where id = p_taker_id and caregiver_id = p_caregiver_id
  for update; -- one invite at a time per taker

  if not found then
    raise exception 'not_found';
  end if;

  -- Same invite again (a retry): hand back the existing send
  select * into v_send from public.sends where invite_id = p_invite_id;
  if found then
    return query select v_send.id, v_send.to_phone::text, v_send.status;
    return;
  end if;

  if v_taker.status = 'active' then
    raise exception 'already_joined';
  end if;

  if (
    select count(*) from public.invites
    where taker_id = p_taker_id and backup_id is null and created_at > now() - interval '1 day'
  ) >= 3 then
    raise exception 'too_many_for_taker';
  end if;

  if (
    select count(*) from public.invites i
    join public.takers t on t.id = i.taker_id
    where t.caregiver_id = p_caregiver_id and i.created_at > now() - interval '1 day'
  ) >= 10 then
    raise exception 'too_many_today';
  end if;

  -- Only the newest invite can be accepted
  update public.invites set status = 'cancelled'
  where taker_id = p_taker_id and backup_id is null and status = 'pending';

  insert into public.invites (id, taker_id, message)
  values (p_invite_id, p_taker_id, p_message);

  insert into public.sends (
    caregiver_id, taker_id, invite_id, purpose, channel, to_phone, dedupe_key
  )
  values (
    p_caregiver_id, p_taker_id, p_invite_id, 'invite', 'sms', v_taker.phone,
    'invite:' || p_invite_id || ':sms'
  )
  returning * into v_send;

  update public.takers set status = 'invited' where id = p_taker_id;

  return query select v_send.id, v_send.to_phone::text, v_send.status;
end;
$$;


create or replace function public.accept_invite(p_phone text)
returns table (joined_taker_id uuid, joined_first_name text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  with accepted as (
    update public.invites i
    set status = 'accepted', accepted_at = now()
    from public.takers t
    where i.taker_id = t.id
      and i.status = 'pending'
      and i.backup_id is null
      and t.status = 'invited'
      and t.phone = p_phone
    returning i.taker_id
  )
  update public.takers t
  set status = 'active', joined_at = now()
  where t.id in (select a.taker_id from accepted a)
  returning t.id, t.first_name;
end;
$$;


create or replace function public.accept_invite_for_taker(p_caregiver_id uuid, p_taker_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_found boolean;
begin
  with accepted as (
    update public.invites i
    set status = 'accepted', accepted_at = now()
    from public.takers t
    where i.taker_id = t.id
      and t.id = p_taker_id
      and t.caregiver_id = p_caregiver_id
      and t.status = 'invited'
      and i.status = 'pending'
      and i.backup_id is null
    returning i.taker_id
  ),
  joined as (
    update public.takers t
    set status = 'active', joined_at = now()
    where t.id in (select a.taker_id from accepted a)
    returning t.id
  )
  select exists (select 1 from joined) into v_found;
  return v_found;
end;
$$;

