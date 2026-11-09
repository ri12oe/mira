-- Demo controls: let a demo account fast-forward today's check-in, so a whole
-- day (ask → reminder → alerts → all-clear) can be shown in a few minutes.
--
-- How it fakes time: it never changes the clock. It moves today's check-in
-- for one demo person EARLIER, so the moment we want is "now". Then the normal
-- scheduler does what it would do anyway, for real: the reminder, the alerts,
-- the pushes and the live Home updates. Nothing else is touched, because:
--   * only accounts listed in demo_accounts can call these (the demo seed
--     fills it; nobody can add themselves)
--   * only for their own people (takers.caregiver_id = the caller)
--   * only today's scheduled check-in for that person
--
-- After each step it runs one scheduler tick and asks deliver-sends to go,
-- exactly like the every-minute pg_cron job (safe: both are written to be
-- run twice), so the demo doesn't wait up to a minute.
--
-- For the app:
--   is_demo_account()                → true for demo accounts: show the controls
--   demo_advance(taker, step)        → step is one of
--       'start'       today's check-in starts now (Mira asks them)
--       'window_end'  the window ends now (gentle reminder)
--       'alert'       the extra time is up now (missed: alert the caregiver)
--       'backups'     every backup's delay is up now (alert the backups)
--   demo_reply(taker)                → "Pretend Lin texted OK": records a
--                                      check-in the way they'd check in
--   Both return { status, window_starts_at, window_ends_at, alert_at }.
--   Errors: not_demo, paused, not_joined, no_check_in_today,
--           already_checked_in, unknown_step


-- ---------------------------------------------------------------- who is a demo account

create table public.demo_accounts (
  id uuid primary key references auth.users (id) on delete cascade
);

-- Only the server (and the seed) can read or change it
alter table public.demo_accounts enable row level security;
revoke all on public.demo_accounts from anon, authenticated;

create function public.is_demo_account()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.demo_accounts d where d.id = auth.uid());
$$;


-- ---------------------------------------------------------------- helpers

-- One of the caller's own people, if the caller is a demo account
create function public.demo_taker(p_taker_id uuid)
returns public.takers
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_taker public.takers;
begin
  select t.* into v_taker
  from public.takers t
  join public.demo_accounts d on d.id = t.caregiver_id
  where t.id = p_taker_id and t.caregiver_id = auth.uid();
  if v_taker.id is null then
    raise exception 'not_demo';
  end if;
  return v_taker;
end;
$$;

-- What the pg_cron job does every minute: one tick, then deliver
create function public.demo_kick()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.scheduler_tick();
  begin
    perform net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
             || '/functions/v1/deliver-sends',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-mira-cron-secret',
        (select decrypted_secret from vault.decrypted_secrets where name = 'mira_cron_secret')
      ),
      body := '{}'::jsonb
    );
  exception when others then
    -- Not fatal: the every-minute job delivers it anyway
    raise warning 'demo_kick could not call deliver-sends: %', sqlerrm;
  end;
end;
$$;

-- Today's check-in for a demo person, as the app shows it. (Not "stable":
-- it must see the changes demo_advance just made.)
create function public.demo_today(p_taker public.takers)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select coalesce(
    (select jsonb_build_object(
       'status', c.status,
       'window_starts_at', c.window_starts_at,
       'window_ends_at', c.window_ends_at,
       'alert_at', c.alert_at)
     from public.check_ins c
     where c.taker_id = p_taker.id
       and c.kind = 'scheduled'
       and c.local_date = (now() at time zone p_taker.time_zone)::date),
    jsonb_build_object('status', null));
$$;


-- ---------------------------------------------------------------- demo_advance

create function public.demo_advance(p_taker_id uuid, p_step text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_taker public.takers := public.demo_taker(p_taker_id);
  v_today date := (now() at time zone v_taker.time_zone)::date;
  v_check_in public.check_ins;
  v_backup_minutes int;
  v_target timestamptz; -- the moment that should become "now"
  v_shift interval;
begin
  if v_taker.paused then
    raise exception 'paused';
  end if;
  if v_taker.status <> 'active' then
    raise exception 'not_joined';
  end if;

  if p_step = 'start' then
    -- A fresh check-in for today that opens now (keeps their window's length).
    -- The old one and its sends go, so the day can be shown again from the top.
    delete from public.check_ins c
    where c.taker_id = v_taker.id and c.kind = 'scheduled' and c.local_date = v_today;
    insert into public.check_ins (taker_id, kind, local_date, window_starts_at, window_ends_at, alert_at)
    values (
      v_taker.id, 'scheduled', v_today, now(),
      now() + make_interval(mins => v_taker.window_end - v_taker.window_start),
      now() + make_interval(mins => v_taker.window_end - v_taker.window_start + v_taker.extra_minutes)
    );
  else
    select c.* into v_check_in
    from public.check_ins c
    where c.taker_id = v_taker.id and c.kind = 'scheduled' and c.local_date = v_today;
    if v_check_in.id is null then
      raise exception 'no_check_in_today';
    end if;
    if v_check_in.responded_at is not null then
      raise exception 'already_checked_in';
    end if;

    if p_step = 'window_end' then
      v_target := v_check_in.window_ends_at;
    elsif p_step = 'alert' then
      v_target := v_check_in.alert_at;
    elsif p_step = 'backups' then
      -- The last backup's turn: alert time + every delay in the chain (for
      -- someone checking in for themselves, only backups who said yes count)
      select coalesce(sum(b.alert_after_minutes), 0)::int into v_backup_minutes
      from public.backups b
      where b.taker_id = v_taker.id
        and (not v_taker.is_self or b.confirmed_at is not null);
      v_target := v_check_in.alert_at + make_interval(mins => v_backup_minutes);
    else
      raise exception 'unknown_step';
    end if;

    -- Slide the whole check-in earlier so the target is now. Never later:
    -- a moment that's already passed stays as it is.
    v_shift := greatest(v_target - now(), interval '0');
    update public.check_ins c
    set window_starts_at = c.window_starts_at - v_shift,
        window_ends_at = c.window_ends_at - v_shift,
        alert_at = c.alert_at - v_shift
    where c.id = v_check_in.id;
  end if;

  perform public.demo_kick();
  return public.demo_today(v_taker);
end;
$$;


-- ---------------------------------------------------------------- demo_reply

-- "Pretend Lin texted OK": the same path as a real reply (record_check_in),
-- by the way they check in, so it's on time or late by the usual rules and
-- stops the alerts with an all-clear.
create function public.demo_reply(p_taker_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_taker public.takers := public.demo_taker(p_taker_id);
begin
  if exists (
    select 1 from public.check_ins c
    where c.taker_id = v_taker.id and c.kind = 'scheduled'
      and c.local_date = (now() at time zone v_taker.time_zone)::date
      and c.responded_at is not null
  ) then
    raise exception 'already_checked_in';
  end if;
  if public.record_check_in(v_taker.id, v_taker.method, false, now()) = 0 then
    raise exception 'no_check_in_today';
  end if;
  perform public.demo_kick();
  return public.demo_today(v_taker);
end;
$$;


-- ---------------------------------------------------------------- privileges

revoke execute on function public.is_demo_account() from public, anon;
revoke execute on function public.demo_taker(uuid) from public, anon, authenticated;
revoke execute on function public.demo_kick() from public, anon, authenticated;
revoke execute on function public.demo_today(public.takers) from public, anon, authenticated;
revoke execute on function public.demo_advance(uuid, text) from public, anon;
revoke execute on function public.demo_reply(uuid) from public, anon;

grant execute on function public.is_demo_account() to authenticated;
grant execute on function public.demo_advance(uuid, text) to authenticated;
grant execute on function public.demo_reply(uuid) to authenticated;
