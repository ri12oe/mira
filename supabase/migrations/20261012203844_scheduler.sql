-- Scheduler, part 2.
--
-- Every minute pg_cron runs scheduler_tick(), which DECIDES what should happen
-- (create today's check-ins, queue prompts/reminders/alerts, mark missed), then
-- calls the deliver-sends Edge Function, which SENDS what's queued.
--
-- Why it can't double-send:
--   * every send has a unique dedupe_key, so queueing the same thing twice
--     does nothing ("on conflict do nothing");
--   * deliver-sends claims sends with "for update skip locked", so two runs
--     can't pick up the same send.
--
-- scheduler_tick takes the time as a parameter, so tests can replay a day.


-- ---------------------------------------------------------------- sends: when, and who's on it

alter table public.sends
  add column due_at timestamptz not null default now(),
  add column claimed_at timestamptz; -- set while deliver-sends is sending it

create index sends_due on public.sends (due_at) where status = 'queued';


-- ---------------------------------------------------------------- scheduler_tick

create function public.scheduler_tick(p_now timestamptz default now())
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_created int;
  v_skipped int;
  v_cancelled int;
  v_missed int;
  v_queued int := 0;
  v_n int;
begin
  -- 1. Create today's check-in once the window opens, in each person's own
  --    time zone, for people who joined, aren't paused, and have today selected.
  insert into public.check_ins (taker_id, kind, local_date, window_starts_at, window_ends_at, alert_at)
  select t.id, 'scheduled', d.local_date, w.starts_at, w.ends_at, w.alert_at
  from public.takers t
  cross join lateral (select (p_now at time zone t.time_zone)::date as local_date) d
  cross join lateral (
    select
      (d.local_date + make_interval(mins => t.window_start)) at time zone t.time_zone as starts_at,
      (d.local_date + make_interval(mins => t.window_end)) at time zone t.time_zone as ends_at,
      (d.local_date + make_interval(mins => t.window_end + t.extra_minutes)) at time zone t.time_zone as alert_at
  ) w
  where t.status = 'active'
    and not t.paused
    and (extract(isodow from d.local_date)::int - 1) = any (t.days) -- 0 = Monday
    and p_now >= w.starts_at
    and p_now < w.alert_at                                       -- never start a day that's already over
    and coalesce(t.joined_at, '-infinity') <= w.ends_at          -- joined after today's window: start tomorrow
  on conflict (taker_id, local_date) where kind = 'scheduled' do nothing;
  get diagnostics v_created = row_count;

  -- 2. Paused (or no longer joined) mid-day: today's check-in is skipped
  update public.check_ins c
  set status = 'skipped'
  from public.takers t
  where c.taker_id = t.id
    and c.status = 'pending'
    and (t.paused or t.status <> 'active');
  get diagnostics v_skipped = row_count;

  -- 3. Cancel queued sends nobody needs any more: they checked in, or the day
  --    was skipped. (Not ones being sent right now, and never the all-clears.)
  update public.sends s
  set status = 'cancelled'
  from public.check_ins c
  where s.check_in_id = c.id
    and s.status = 'queued'
    and s.purpose <> 'all_clear'
    and (s.claimed_at is null or s.claimed_at < p_now - interval '5 minutes')
    and (c.responded_at is not null or c.status = 'skipped');
  get diagnostics v_cancelled = row_count;

  -- 4. Window opens: ask them (a text, a call, or the Mira app)
  insert into public.sends (caregiver_id, taker_id, check_in_id, purpose, channel, to_phone, dedupe_key, due_at)
  select t.caregiver_id, t.id, c.id, 'check_in_prompt', m.channel, t.phone,
         'check_in:' || c.id || ':prompt', p_now
  from public.check_ins c
  join public.takers t on t.id = c.taker_id
  cross join lateral (
    select (case t.method when 'text' then 'sms' when 'call' then 'call' else 'push' end)::public.send_channel as channel
  ) m
  where c.status = 'pending'
    and c.responded_at is null
    and p_now >= c.window_starts_at
  on conflict (dedupe_key) do nothing;
  get diagnostics v_n = row_count;
  v_queued := v_queued + v_n;

  -- 5. Window ends with no check-in: a gentle reminder (daily check-ins only)
  insert into public.sends (caregiver_id, taker_id, check_in_id, purpose, channel, to_phone, dedupe_key, due_at)
  select t.caregiver_id, t.id, c.id, 'reminder', m.channel, t.phone,
         'check_in:' || c.id || ':reminder', p_now
  from public.check_ins c
  join public.takers t on t.id = c.taker_id
  cross join lateral (
    select (case t.method when 'text' then 'sms' when 'call' then 'call' else 'push' end)::public.send_channel as channel
  ) m
  where c.kind = 'scheduled'
    and c.status = 'pending'
    and c.responded_at is null
    and p_now >= c.window_ends_at
    and p_now < c.alert_at -- past alert time a reminder is pointless
  on conflict (dedupe_key) do nothing;
  get diagnostics v_n = row_count;
  v_queued := v_queued + v_n;

  -- 6. Window end + extra time: it's missed. Alert the caregiver by text, call
  --    and (from step 10) push notification.
  update public.check_ins c
  set status = 'missed'
  where c.status = 'pending'
    and c.responded_at is null
    and p_now >= c.alert_at;
  get diagnostics v_missed = row_count;

  insert into public.sends (caregiver_id, taker_id, check_in_id, purpose, channel, to_phone, dedupe_key, due_at)
  select t.caregiver_id, t.id, c.id, 'caregiver_alert', ch.channel,
         case when ch.channel = 'push' then null else g.phone end,
         'check_in:' || c.id || ':caregiver_alert:' || ch.channel, p_now
  from public.check_ins c
  join public.takers t on t.id = c.taker_id
  join public.caregivers g on g.id = t.caregiver_id
  cross join (values ('sms'::public.send_channel), ('call'), ('push')) ch (channel)
  where c.status = 'missed'
    and c.responded_at is null
    and p_now >= c.alert_at
    and p_now < c.alert_at + interval '12 hours' -- don't alert about a day long gone
    and (ch.channel = 'push' or g.phone is not null)
  on conflict (dedupe_key) do nothing;
  get diagnostics v_n = row_count;
  v_queued := v_queued + v_n;

  -- 7. Then each backup in alert order, each one their own delay after the
  --    person before them (daily check-ins only; "Check in now" alerts just
  --    the caregiver).
  insert into public.sends (caregiver_id, taker_id, check_in_id, backup_id, purpose, channel, to_phone, dedupe_key, due_at)
  select t.caregiver_id, t.id, c.id, b.id, 'backup_alert', ch.channel, b.phone,
         'check_in:' || c.id || ':backup_alert:' || b.id || ':' || ch.channel, p_now
  from public.check_ins c
  join public.takers t on t.id = c.taker_id
  join lateral (
    select bk.id, bk.phone,
           sum(bk.alert_after_minutes) over (order by bk.position)::int as after_minutes
    from public.backups bk
    where bk.taker_id = t.id
  ) b on true
  cross join (values ('sms'::public.send_channel), ('call')) ch (channel)
  where c.kind = 'scheduled'
    and c.status = 'missed'
    and c.responded_at is null
    and p_now >= c.alert_at + make_interval(mins => b.after_minutes)
    and p_now < c.alert_at + interval '12 hours'
  on conflict (dedupe_key) do nothing;
  get diagnostics v_n = row_count;
  v_queued := v_queued + v_n;

  -- 8. They checked in after alerts went out: tell everyone who was alerted
  --    that it's all clear (one text per person).
  insert into public.sends (caregiver_id, taker_id, check_in_id, backup_id, purpose, channel, to_phone, dedupe_key, due_at)
  select distinct on (a.check_in_id, a.to_phone)
         a.caregiver_id, a.taker_id, a.check_in_id, a.backup_id, 'all_clear', 'sms', a.to_phone,
         'check_in:' || a.check_in_id || ':all_clear:' || a.to_phone, p_now
  from public.sends a
  join public.check_ins c on c.id = a.check_in_id
  where a.purpose in ('caregiver_alert', 'backup_alert')
    and a.status in ('sent', 'delivered')
    and a.channel in ('sms', 'call')
    and a.to_phone is not null
    and c.responded_at is not null
    and p_now < c.responded_at + interval '12 hours'
  order by a.check_in_id, a.to_phone
  on conflict (dedupe_key) do nothing;
  get diagnostics v_n = row_count;
  v_queued := v_queued + v_n;

  return jsonb_build_object(
    'created', v_created,
    'skipped', v_skipped,
    'missed', v_missed,
    'queued', v_queued,
    'cancelled', v_cancelled
  );
end;
$$;


-- ---------------------------------------------------------------- claim_due_sends / finish_send
-- Used by the deliver-sends Edge Function.

-- Takes up to p_limit due sends and marks them as being worked on. A send
-- claimed more than 5 minutes ago (deliver-sends crashed) can be claimed again.
-- Invites are sent by send-invite directly, so they're never picked up here.
create function public.claim_due_sends(p_limit int default 50, p_now timestamptz default now())
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
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  with due as (
    select s.id
    from public.sends s
    where s.status = 'queued'
      and s.purpose <> 'invite'
      and s.due_at <= p_now
      and (s.claimed_at is null or s.claimed_at < p_now - interval '5 minutes')
    order by s.due_at
    limit p_limit
    for update skip locked
  ),
  claimed as (
    update public.sends s
    set claimed_at = p_now, attempts = s.attempts + 1
    from due
    where s.id = due.id
    returning s.id, s.purpose, s.channel, s.to_phone, s.attempts,
              s.taker_id, s.caregiver_id, s.backup_id, s.check_in_id
  )
  select cl.id, cl.purpose, cl.channel, cl.to_phone::text, cl.attempts,
         t.first_name, g.first_name, b.name,
         t.time_zone, t.window_start, t.window_end,
         ci.kind, ci.responded_at
  from claimed cl
  left join public.takers t on t.id = cl.taker_id
  left join public.caregivers g on g.id = cl.caregiver_id
  left join public.backups b on b.id = cl.backup_id
  left join public.check_ins ci on ci.id = cl.check_in_id;
end;
$$;

-- Records how a send went. A failure is retried (after 2, then 4 minutes);
-- the 3rd failure is final and stays visible as 'failed'.
create function public.finish_send(
  p_send_id uuid,
  p_ok boolean,
  p_provider_id text,
  p_error text,
  p_now timestamptz default now()
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.sends s
  set status = case
        when p_ok then 'sent'::public.send_status
        when s.attempts >= 3 then 'failed'::public.send_status
        else 'queued'::public.send_status
      end,
      provider_id = coalesce(p_provider_id, s.provider_id),
      error = case when p_ok then null else p_error end,
      claimed_at = null,
      due_at = case
        when p_ok or s.attempts >= 3 then s.due_at
        else p_now + make_interval(mins => power(2, s.attempts)::int)
      end
  where s.id = p_send_id
    and s.status = 'queued'; -- don't overwrite a send that was cancelled meanwhile
end;
$$;

revoke execute on function public.scheduler_tick(timestamptz) from public, anon, authenticated;
revoke execute on function public.claim_due_sends(int, timestamptz) from public, anon, authenticated;
revoke execute on function public.finish_send(uuid, boolean, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.scheduler_tick(timestamptz) to service_role;
grant execute on function public.claim_due_sends(int, timestamptz) to service_role;
grant execute on function public.finish_send(uuid, boolean, text, text, timestamptz) to service_role;


-- ---------------------------------------------------------------- every minute

-- The project URL and the shared secret come from Vault (set outside git).
select cron.schedule(
  'mira-scheduler',
  '* * * * *',
  $job$
    select public.scheduler_tick();
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
             || '/functions/v1/deliver-sends',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-mira-cron-secret',
        (select decrypted_secret from vault.decrypted_secrets where name = 'mira_cron_secret')
      ),
      body := '{}'::jsonb
    );
  $job$
);
