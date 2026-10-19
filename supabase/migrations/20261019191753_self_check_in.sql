-- Self flow, step 6: "I'm okay" — someone using Mira for themselves checks in.
--
-- check_in_myself() is what the app calls when they tap the big button. It
-- always uses the server's clock and only their own "me" row, so a check-in
-- can't be backdated or made for someone else. The work is done by
-- check_in_self_at(), which takes the time so the tests can replay a day;
-- only the server can call that one.
--
-- Returns:
--   recorded     counted (on time, late, or early: before today's window)
--   already      today's check-in was already done
--   not_today    today isn't one of their check-in days
--   paused       they're taking a break
--   nothing_open nothing to check in for (e.g. today was skipped)
-- Error: not_found (this account doesn't use Mira for itself)

create function public.check_in_self_at(p_account_id uuid, p_now timestamptz)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_taker public.takers%rowtype;
  v_today date;
  v_recorded int;
  v_inserted int := 0;
begin
  select * into v_taker
  from public.takers
  where caregiver_id = p_account_id and is_self
  for update; -- one tap at a time
  if not found then
    raise exception 'not_found';
  end if;

  if v_taker.paused then
    return 'paused';
  end if;

  -- Anything open (today's window, or a missed day still being alerted):
  -- record it. The scheduler then cancels what's still queued and sends
  -- all-clears to anyone already alerted.
  v_recorded := public.record_check_in(v_taker.id, 'app', false, p_now);

  -- Before today's window opens there's no check-in yet: make today's, already
  -- answered, so the scheduler won't ask (same times it would have used)
  v_today := (p_now at time zone v_taker.time_zone)::date;
  if (extract(isodow from v_today)::int - 1) = any (v_taker.days) then
    insert into public.check_ins (
      taker_id, kind, local_date, window_starts_at, window_ends_at, alert_at,
      status, responded_at, responded_via
    )
    select v_taker.id, 'scheduled', v_today, w.starts_at, w.ends_at, w.alert_at,
           'on_time', p_now, 'app'
    from (
      select
        (v_today + make_interval(mins => v_taker.window_start)) at time zone v_taker.time_zone as starts_at,
        (v_today + make_interval(mins => v_taker.window_end)) at time zone v_taker.time_zone as ends_at,
        (v_today + make_interval(mins => v_taker.window_end + v_taker.extra_minutes)) at time zone v_taker.time_zone as alert_at
    ) w
    where p_now < w.starts_at
    on conflict (taker_id, local_date) where kind = 'scheduled' do nothing;
    get diagnostics v_inserted = row_count;
  end if;

  if v_recorded > 0 or v_inserted > 0 then
    return 'recorded';
  end if;

  if exists (
    select 1 from public.check_ins c
    where c.taker_id = v_taker.id and c.kind = 'scheduled'
      and c.local_date = v_today and c.responded_at is not null
  ) then
    return 'already';
  end if;

  if not ((extract(isodow from v_today)::int - 1) = any (v_taker.days)) then
    return 'not_today';
  end if;

  return 'nothing_open';
end;
$$;

revoke execute on function public.check_in_self_at(uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.check_in_self_at(uuid, timestamptz) to service_role;


-- What the app calls: you, now
create function public.check_in_myself()
returns text
language sql
security definer
set search_path = ''
as $$
  select public.check_in_self_at(auth.uid(), now());
$$;

revoke execute on function public.check_in_myself() from public, anon;
grant execute on function public.check_in_myself() to authenticated;
