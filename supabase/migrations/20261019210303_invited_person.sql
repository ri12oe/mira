-- Invited person, step 1: someone a caregiver set up (e.g. Lin) uses the
-- Mira app to check in.
--
-- Lin signs in with the number she was invited on (the SMS code proves it's
-- hers). Her account looks after nobody; it's linked to the people who set
-- her up only by that verified number. So everything here is keyed on the
-- caller's verified phone, and she gets NO table access: these functions
-- hand her just her own day and the caregivers' first names and numbers.
--
--   join_as_invited()      signing in counts as her YES
--   my_invited_day()       today, for each caregiver who set her up
--   check_in_as_invited()  "I'm okay": once, for every one of them
--
-- The last two use the server's clock; the work is done by *_at versions that
-- take a time, so the tests can replay a day. Only the server can call those.


-- ---------------------------------------------------------------- whose number is this?

-- The account's verified number, if it's an invited person's account: one
-- that looks after nobody (one account type per person).
-- Errors: no_verified_phone, account_type_mismatch
create function public.invited_phone_of(p_account_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_phone text;
begin
  select g.phone into v_phone from public.caregivers g where g.id = p_account_id;
  if v_phone is null then
    raise exception 'no_verified_phone';
  end if;
  if exists (select 1 from public.takers t where t.caregiver_id = p_account_id) then
    raise exception 'account_type_mismatch';
  end if;
  return v_phone;
end;
$$;

revoke execute on function public.invited_phone_of(uuid) from public, anon, authenticated;
grant execute on function public.invited_phone_of(uuid) to service_role;


-- ---------------------------------------------------------------- joining

-- Signing in counts as her YES: accepts every pending invite to her number
-- (the same as a YES text), then says how many caregivers she's connected
-- with. Error: not_invited (nobody has invited this number, or every invite
-- was cancelled), plus invited_phone_of's.
create function public.join_as_invited()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone text := public.invited_phone_of(auth.uid());
  v_count int;
begin
  perform public.accept_invite(v_phone);

  select count(*) into v_count
  from public.takers t
  where t.phone = v_phone and t.status = 'active' and not t.is_self;
  if v_count = 0 then
    raise exception 'not_invited';
  end if;
  return v_count;
end;
$$;

revoke execute on function public.join_as_invited() from public, anon;
grant execute on function public.join_as_invited() to authenticated;


-- ---------------------------------------------------------------- her day

-- One row per caregiver who set her up (and she's joined), with today's
-- check-in in her own time zone, if there is one yet. Nothing else of the
-- caregiver's: not their other people, backups or history.
create function public.invited_day_at(p_account_id uuid, p_now timestamptz)
returns table (
  taker_id uuid,
  first_name text,
  caregiver_name text,
  caregiver_phone text,
  method public.check_in_method,
  time_zone text,
  window_start smallint,
  window_end smallint,
  days smallint[],
  paused boolean,
  local_date date,
  check_in_status public.check_in_status,
  responded_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_phone text := public.invited_phone_of(p_account_id);
begin
  return query
  select t.id, t.first_name, g.first_name, g.phone::text,
         t.method, t.time_zone, t.window_start, t.window_end, t.days, t.paused,
         d.local_date, c.status, c.responded_at
  from public.takers t
  join public.caregivers g on g.id = t.caregiver_id
  cross join lateral (select (p_now at time zone t.time_zone)::date as local_date) d
  left join public.check_ins c
    on c.taker_id = t.id and c.kind = 'scheduled' and c.local_date = d.local_date
  where t.phone = v_phone and t.status = 'active' and not t.is_self
  order by g.first_name, t.created_at;
end;
$$;

revoke execute on function public.invited_day_at(uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.invited_day_at(uuid, timestamptz) to service_role;

-- What the app calls: you, now
create function public.my_invited_day()
returns table (
  taker_id uuid,
  first_name text,
  caregiver_name text,
  caregiver_phone text,
  method public.check_in_method,
  time_zone text,
  window_start smallint,
  window_end smallint,
  days smallint[],
  paused boolean,
  local_date date,
  check_in_status public.check_in_status,
  responded_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select * from public.invited_day_at(auth.uid(), now());
$$;

revoke execute on function public.my_invited_day() from public, anon;
grant execute on function public.my_invited_day() to authenticated;


-- ---------------------------------------------------------------- "I'm okay"

-- Records her check-in for every caregiver who set her up, the same way as
-- check_in_self_at: open check-ins (today's, a missed one still being
-- alerted, a "Check in now") count; before today's window it's an early
-- check-in, so nobody asks. Paused ones are left alone.
-- Returns the best of: recorded, already, nothing_open, not_today, paused.
-- Error: not_invited (no caregiver she's joined), plus invited_phone_of's.
create function public.check_in_invited_at(p_account_id uuid, p_now timestamptz)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone text := public.invited_phone_of(p_account_id);
  t public.takers%rowtype;
  v_today date;
  v_n int;
  v_found boolean := false;
  v_recorded boolean := false;
  v_already boolean := false;
  v_open_day boolean := false; -- a selected, unpaused day with nothing to answer
  v_day_off boolean := false;
begin
  for t in
    select * from public.takers tk
    where tk.phone = v_phone and tk.status = 'active' and not tk.is_self
    order by tk.id
    for update -- one tap at a time
  loop
    v_found := true;
    if t.paused then
      continue;
    end if;

    if public.record_check_in(t.id, 'app', false, p_now) > 0 then
      v_recorded := true;
    end if;

    v_today := (p_now at time zone t.time_zone)::date;
    if (extract(isodow from v_today)::int - 1) = any (t.days) then
      -- Before today's window opens: today's check-in, already answered
      insert into public.check_ins (
        taker_id, kind, local_date, window_starts_at, window_ends_at, alert_at,
        status, responded_at, responded_via
      )
      select t.id, 'scheduled', v_today, w.starts_at, w.ends_at, w.alert_at,
             'on_time', p_now, 'app'
      from (
        select
          (v_today + make_interval(mins => t.window_start)) at time zone t.time_zone as starts_at,
          (v_today + make_interval(mins => t.window_end)) at time zone t.time_zone as ends_at,
          (v_today + make_interval(mins => t.window_end + t.extra_minutes)) at time zone t.time_zone as alert_at
      ) w
      where p_now < w.starts_at
      on conflict (taker_id, local_date) where kind = 'scheduled' do nothing;
      get diagnostics v_n = row_count;
      if v_n > 0 then
        v_recorded := true;
      elsif exists (
        select 1 from public.check_ins c
        where c.taker_id = t.id and c.kind = 'scheduled'
          and c.local_date = v_today and c.responded_at is not null
      ) then
        v_already := true;
      else
        v_open_day := true;
      end if;
    else
      v_day_off := true;
    end if;
  end loop;

  if not v_found then
    raise exception 'not_invited';
  end if;
  if v_recorded then return 'recorded'; end if;
  if v_already then return 'already'; end if;
  if v_open_day then return 'nothing_open'; end if;
  if v_day_off then return 'not_today'; end if;
  return 'paused';
end;
$$;

revoke execute on function public.check_in_invited_at(uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.check_in_invited_at(uuid, timestamptz) to service_role;

-- What the app calls: you, now
create function public.check_in_as_invited()
returns text
language sql
security definer
set search_path = ''
as $$
  select public.check_in_invited_at(auth.uid(), now());
$$;

revoke execute on function public.check_in_as_invited() from public, anon;
grant execute on function public.check_in_as_invited() to authenticated;
