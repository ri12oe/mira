-- Replies: recording a check-in, whichever way it arrives.
--
--   * a text reply "OK"         → twilio-inbound   → record_check_in_by_phone
--   * pressing 1 on Mira's call → twilio-voice     → record_call_answer
--   * the caregiver taps "Lin checked in" in the app → mark_checked_in
--
-- All of them end in record_check_in, so the on-time/late rules live in one
-- place. Recording a check-in is what stops the escalation: scheduler_tick
-- cancels unsent alerts and sends an all-clear to anyone already alerted.


-- The caregiver confirmed it (e.g. Lin phoned them), rather than Lin replying to Mira
alter table public.check_ins
  add column confirmed_by_caregiver boolean not null default false;


-- ---------------------------------------------------------------- record_check_in
-- Records a check-in on every open check-in for this taker (normally one; two if
-- a "Check in now" overlaps the daily one). Returns how many were recorded.
--   inside the window            → on_time
--   after it (even after alerts) → late
-- Before today's window opens there's nothing open, so nothing is recorded.

create function public.record_check_in(
  p_taker_id uuid,
  p_via public.check_in_method,
  p_by_caregiver boolean default false,
  p_at timestamptz default now()
)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count int;
begin
  update public.check_ins c
  set responded_at = p_at,
      responded_via = p_via,
      confirmed_by_caregiver = p_by_caregiver,
      status = case when p_at <= c.window_ends_at then 'on_time' else 'late' end::public.check_in_status
  where c.taker_id = p_taker_id
    and c.responded_at is null
    and c.status in ('pending', 'missed')
    and p_at >= c.window_starts_at
    and p_at < c.alert_at + interval '12 hours';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;


-- ---------------------------------------------------------------- by phone (text reply)
-- A reply comes from a phone number. Two caregivers may look after the same
-- person, so record it for every joined taker with that number. Returns one row
-- per taker that had something open, with names for the "thanks" reply.

create function public.record_check_in_by_phone(
  p_phone text,
  p_via public.check_in_method,
  p_at timestamptz default now()
)
returns table (taker_name text, caregiver_name text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  t record;
begin
  for t in
    select tk.id, tk.first_name, g.first_name as caregiver_first_name
    from public.takers tk
    join public.caregivers g on g.id = tk.caregiver_id
    where tk.phone = p_phone and tk.status = 'active'
  loop
    if public.record_check_in(t.id, p_via, false, p_at) > 0 then
      taker_name := t.first_name;
      caregiver_name := t.caregiver_first_name;
      return next;
    end if;
  end loop;
end;
$$;


-- ---------------------------------------------------------------- press 1 on a call
-- The call belongs to one send (its id is in the call's URL), so the press
-- counts for that send's taker.

create function public.record_call_answer(p_send_id uuid, p_at timestamptz default now())
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_taker_id uuid;
begin
  select s.taker_id into v_taker_id
  from public.sends s
  where s.id = p_send_id
    and s.channel = 'call'
    and s.purpose in ('check_in_prompt', 'reminder');
  if v_taker_id is null then
    return 0;
  end if;
  return public.record_check_in(v_taker_id, 'call', false, p_at);
end;
$$;


-- ---------------------------------------------------------------- the caregiver confirms
-- Called by the app: "Lin checked in" (e.g. she phoned you). Only for your own
-- takers. Returns 'recorded', or 'nothing_open' if no check-in is waiting.

create function public.mark_checked_in(p_taker_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.takers t
    where t.id = p_taker_id and t.caregiver_id = auth.uid()
  ) then
    raise exception 'not_found';
  end if;

  if public.record_check_in(p_taker_id, 'app', true) > 0 then
    return 'recorded';
  end if;
  return 'nothing_open';
end;
$$;


-- ---------------------------------------------------------------- what a call should say
-- twilio-voice looks up its send to know what to say (same fields deliver-sends gets).

create function public.get_send_details(p_send_id uuid)
returns table (
  send_id uuid,
  send_purpose public.send_purpose,
  send_channel public.send_channel,
  send_to text,
  attempt smallint,
  taker_name text,
  caregiver_name text,
  backup_name text,
  taker_time_zone text,
  taker_window_start smallint,
  taker_window_end smallint,
  check_in_kind public.check_in_kind,
  checked_in_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select s.id, s.purpose, s.channel, s.to_phone::text, s.attempts,
         t.first_name, g.first_name, b.name,
         t.time_zone, t.window_start, t.window_end,
         ci.kind, ci.responded_at
  from public.sends s
  left join public.takers t on t.id = s.taker_id
  left join public.caregivers g on g.id = s.caregiver_id
  left join public.backups b on b.id = s.backup_id
  left join public.check_ins ci on ci.id = s.check_in_id
  where s.id = p_send_id;
$$;


-- ---------------------------------------------------------------- who may call what

revoke execute on function public.record_check_in(uuid, public.check_in_method, boolean, timestamptz) from public, anon, authenticated;
revoke execute on function public.record_check_in_by_phone(text, public.check_in_method, timestamptz) from public, anon, authenticated;
revoke execute on function public.record_call_answer(uuid, timestamptz) from public, anon, authenticated;
revoke execute on function public.get_send_details(uuid) from public, anon, authenticated;
revoke execute on function public.mark_checked_in(uuid) from public, anon;

grant execute on function public.record_check_in(uuid, public.check_in_method, boolean, timestamptz) to service_role;
grant execute on function public.record_check_in_by_phone(text, public.check_in_method, timestamptz) to service_role;
grant execute on function public.record_call_answer(uuid, timestamptz) to service_role;
grant execute on function public.get_send_details(uuid) to service_role;
grant execute on function public.mark_checked_in(uuid) to authenticated;
