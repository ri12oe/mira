-- Invites: the "Reply YES to start" text, and the YES that comes back.
--
-- Both functions are only callable by the server (service_role, used inside
-- Edge Functions). The app never calls them directly.


-- ---------------------------------------------------------------- prepare_invite
-- Called by the send-invite Edge Function before it texts anyone. In one
-- transaction it checks ownership and limits, records the invite and a `sends`
-- row, and marks the taker as invited. It returns the send to perform.
--
-- The app makes the invite id, so a retry of the same invite returns the
-- existing send instead of creating (and texting) a second one.
--
-- Errors (raised with these messages, for the Edge Function to translate):
--   not_found           not this caregiver's taker
--   already_joined      the taker already replied YES
--   too_many_for_taker  3 invites to this person in the last 24 hours
--   too_many_today      10 invites from this caregiver in the last 24 hours

create function public.prepare_invite(
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
    where taker_id = p_taker_id and created_at > now() - interval '1 day'
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
  where taker_id = p_taker_id and status = 'pending';

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

revoke execute on function public.prepare_invite(uuid, uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.prepare_invite(uuid, uuid, uuid, text) to service_role;


-- ---------------------------------------------------------------- accept_invite
-- Called by the twilio-inbound webhook when a phone replies YES. Accepts every
-- pending invite for that number (two caregivers may look after the same
-- person) and returns who joined, for the "you're all set" reply.

create function public.accept_invite(p_phone text)
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

revoke execute on function public.accept_invite(text) from public, anon, authenticated;
grant execute on function public.accept_invite(text) to service_role;


-- ---------------------------------------------------------------- realtime
-- The Connected screen listens for its taker's status to change to 'active'.
-- Realtime respects RLS, so a caregiver only hears about their own takers.

alter publication supabase_realtime add table public.takers;
