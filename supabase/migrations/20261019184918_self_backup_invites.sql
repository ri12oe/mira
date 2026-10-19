-- Self flow, step 4: inviting backups.
--
-- Someone using Mira for themselves picks backups, and a backup is only
-- alerted once they've said YES (backups.confirmed_at). This mirrors the taker
-- invite: an invite row + a logged send (prepare_backup_invite), then either
--   * free mode: the user texts the invite from their own phone and taps
--     "Sam said yes" (accept_backup_invite_for, via confirm-invite), or
--   * live mode: Sam replies YES to Mira's number (accept_backup_invites,
--     via twilio-inbound).
-- All three are called by Edge Functions only (service role).


-- ---------------------------------------------------------------- record (and queue the text for) one backup invite

create function public.prepare_backup_invite(
  p_caregiver_id uuid,
  p_backup_id uuid,
  p_invite_id uuid,
  p_message text
)
returns table (send_id uuid, to_phone text, send_status public.send_status)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_backup public.backups%rowtype;
  v_send public.sends%rowtype;
begin
  -- Only the backups of the caller's own "me" (a caregiver's backups don't
  -- need to say yes)
  select b.* into v_backup
  from public.backups b
  join public.takers t on t.id = b.taker_id
  where b.id = p_backup_id and t.caregiver_id = p_caregiver_id and t.is_self
  for update of b; -- one invite at a time per backup

  if not found then
    raise exception 'not_found';
  end if;

  -- Same invite again (a retry): hand back the existing send
  select * into v_send from public.sends where invite_id = p_invite_id;
  if found then
    return query select v_send.id, v_send.to_phone::text, v_send.status;
    return;
  end if;

  if v_backup.confirmed_at is not null then
    raise exception 'already_joined';
  end if;

  if (
    select count(*) from public.invites
    where backup_id = p_backup_id and created_at > now() - interval '1 day'
  ) >= 3 then
    raise exception 'too_many_for_taker';
  end if;

  -- Same daily limit as taker invites: 10 per account, of either kind
  if (
    select count(*) from public.invites i
    join public.takers t on t.id = i.taker_id
    where t.caregiver_id = p_caregiver_id and i.created_at > now() - interval '1 day'
  ) >= 10 then
    raise exception 'too_many_today';
  end if;

  -- Only the newest invite can be accepted
  update public.invites set status = 'cancelled'
  where backup_id = p_backup_id and status = 'pending';

  insert into public.invites (id, taker_id, backup_id, message)
  values (p_invite_id, v_backup.taker_id, p_backup_id, p_message);

  insert into public.sends (
    caregiver_id, taker_id, backup_id, invite_id, purpose, channel, to_phone, dedupe_key
  )
  values (
    p_caregiver_id, v_backup.taker_id, p_backup_id, p_invite_id, 'invite', 'sms', v_backup.phone,
    'invite:' || p_invite_id || ':sms'
  )
  returning * into v_send;

  return query select v_send.id, v_send.to_phone::text, v_send.status;
end;
$$;

revoke execute on function public.prepare_backup_invite(uuid, uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.prepare_backup_invite(uuid, uuid, uuid, text) to service_role;


-- ---------------------------------------------------------------- free mode: "Sam said yes"

create function public.accept_backup_invite_for(p_caregiver_id uuid, p_backup_id uuid)
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
    from public.backups b
    join public.takers t on t.id = b.taker_id
    where i.backup_id = b.id
      and b.id = p_backup_id
      and t.caregiver_id = p_caregiver_id
      and t.is_self
      and b.confirmed_at is null
      and i.status = 'pending'
    returning i.backup_id
  ),
  confirmed as (
    update public.backups b
    set confirmed_at = now()
    where b.id in (select a.backup_id from accepted a)
    returning b.id
  )
  select exists (select 1 from confirmed) into v_found;
  return v_found;
end;
$$;

revoke execute on function public.accept_backup_invite_for(uuid, uuid) from public, anon, authenticated;
grant execute on function public.accept_backup_invite_for(uuid, uuid) to service_role;


-- ---------------------------------------------------------------- live mode: a YES from the backup's number

-- Accepts every pending backup invite to this number (each one asked them).
-- Returns who to tell: the account, and the backup's and the owner's names.
create function public.accept_backup_invites(p_phone text)
returns table (owner_id uuid, backup_name text, owner_name text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  with accepted as (
    update public.invites i
    set status = 'accepted', accepted_at = now()
    from public.backups b
    where i.backup_id = b.id
      and i.status = 'pending'
      and b.confirmed_at is null
      and b.phone = p_phone
    returning i.backup_id
  ),
  confirmed as (
    update public.backups b
    set confirmed_at = now()
    where b.id in (select a.backup_id from accepted a)
    returning b.taker_id, b.name
  )
  select t.caregiver_id, c.name, t.first_name
  from confirmed c
  join public.takers t on t.id = c.taker_id;
end;
$$;

revoke execute on function public.accept_backup_invites(text) from public, anon, authenticated;
grant execute on function public.accept_backup_invites(text) to service_role;


-- ---------------------------------------------------------------- a new number cancels the old invite

-- The invite went to the old number, so a YES to it means nothing now. Runs
-- with the owner's rights because the app can't change invites itself.
create or replace function public.backups_phone_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.phone is distinct from old.phone then
    new.confirmed_at := null;
    update public.invites set status = 'cancelled'
    where backup_id = new.id and status = 'pending';
  end if;
  return new;
end;
$$;
