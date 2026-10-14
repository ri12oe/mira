-- "Check in now": the caregiver asks right away, outside the usual time.
--
-- It's a check-in with kind = 'on_demand'. The scheduler already treats those
-- specially (no reminder; only the caregiver is alerted). This adds what the
-- Check in now screen lets you choose, for this one check-in:
--   * how to reach them (text / call / app) and the words to use
--   * how long to wait before alerting (default 15 minutes)
--   * who else to alert (default nobody: "Only you"); may include someone
--     who isn't a saved backup, so they're kept as a snapshot on the check-in


alter table public.check_ins
  -- The caregiver's own words for this check-in (null: Mira's usual words)
  add column prompt_message text check (length(prompt_message) <= 300),
  -- Extra people to alert for this check-in, in order:
  -- [{ "name": "Sam", "phone": "+1…", "alert_after_minutes": 15 }, …]
  add column alert_contacts jsonb not null default '[]'::jsonb
    check (jsonb_typeof(alert_contacts) = 'array');


-- ---------------------------------------------------------------- start / cancel (called by the app)

-- Starts a Check in now for one of your own people and queues the prompt.
-- If one is already waiting, returns that one instead of starting another.
-- Errors: not_found, not_joined, paused, bad_wait, bad_contacts, too_many
create function public.start_check_in_now(
  p_taker_id uuid,
  p_method public.check_in_method,
  p_wait_minutes int default 15,
  p_message text default null,
  p_contacts jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_taker public.takers%rowtype;
  v_id uuid;
  v_now timestamptz := now();
  v_contacts jsonb := coalesce(p_contacts, '[]'::jsonb);
begin
  select * into v_taker
  from public.takers
  where id = p_taker_id and caregiver_id = auth.uid()
  for update; -- one start at a time per person
  if not found then raise exception 'not_found'; end if;
  if v_taker.status <> 'active' then raise exception 'not_joined'; end if;
  if v_taker.paused then raise exception 'paused'; end if;
  if p_wait_minutes is null or p_wait_minutes not between 1 and 720 then raise exception 'bad_wait'; end if;

  if jsonb_typeof(v_contacts) <> 'array'
     or jsonb_array_length(v_contacts) > 5
     or exists (
       select 1 from jsonb_array_elements(v_contacts) c
       where coalesce(c ->> 'phone', '') !~ '^\+[1-9][0-9]{6,14}$'
          or coalesce(length(trim(c ->> 'name')), 0) = 0
          or coalesce((c ->> 'alert_after_minutes')::int, -1) not between 0 and 720
     ) then
    raise exception 'bad_contacts';
  end if;

  -- Already waiting on one: show that one
  select c.id into v_id
  from public.check_ins c
  where c.taker_id = p_taker_id and c.kind = 'on_demand'
    and c.status = 'pending' and c.responded_at is null
  limit 1;
  if found then return v_id; end if;

  if (
    select count(*) from public.check_ins c
    where c.taker_id = p_taker_id and c.kind = 'on_demand' and c.created_at > v_now - interval '1 day'
  ) >= 10 then
    raise exception 'too_many';
  end if;

  insert into public.check_ins (
    taker_id, kind, local_date, window_starts_at, window_ends_at, alert_at, prompt_message, alert_contacts
  )
  values (
    p_taker_id, 'on_demand', (v_now at time zone v_taker.time_zone)::date,
    v_now,
    v_now + make_interval(mins => p_wait_minutes),
    v_now + make_interval(mins => p_wait_minutes),
    nullif(trim(p_message), ''),
    v_contacts
  )
  returning id into v_id;

  -- Ask right away, by the method chosen on the screen (delivered within a minute).
  -- Same dedupe key the scheduler would use, so it can't be queued twice.
  insert into public.sends (caregiver_id, taker_id, check_in_id, purpose, channel, to_phone, dedupe_key, due_at)
  values (
    v_taker.caregiver_id, p_taker_id, v_id, 'check_in_prompt',
    (case p_method when 'text' then 'sms' when 'call' then 'call' else 'push' end)::public.send_channel,
    v_taker.phone, 'check_in:' || v_id || ':prompt', v_now
  );

  return v_id;
end;
$$;

-- "Cancel this check-in": nobody gets alerted. Returns false if it had
-- already finished (answered, missed) or isn't yours.
create function public.cancel_check_in_now(p_check_in_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count int;
begin
  update public.check_ins c
  set status = 'skipped'
  from public.takers t
  where c.id = p_check_in_id
    and c.taker_id = t.id
    and t.caregiver_id = auth.uid()
    and c.kind = 'on_demand'
    and c.status = 'pending'
    and c.responded_at is null;
  get diagnostics v_count = row_count;

  -- Don't wait for the scheduler: stop anything not yet sent right now
  update public.sends s
  set status = 'cancelled'
  where s.check_in_id = p_check_in_id
    and s.status = 'queued'
    and s.claimed_at is null
    and v_count > 0;

  return v_count > 0;
end;
$$;

revoke execute on function public.start_check_in_now(uuid, public.check_in_method, int, text, jsonb) from public, anon;
revoke execute on function public.cancel_check_in_now(uuid) from public, anon;
grant execute on function public.start_check_in_now(uuid, public.check_in_method, int, text, jsonb) to authenticated;
grant execute on function public.cancel_check_in_now(uuid) to authenticated;


-- ---------------------------------------------------------------- scheduler: alert the chosen contacts too
-- Same as before, plus step 7b for Check in now's extra contacts.

create or replace function public.scheduler_tick(p_now timestamptz default now())
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

  -- 7. Daily check-ins: then each saved backup in alert order, each one their
  --    own delay after the person before them.
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

  -- 7b. Check in now: only the contacts chosen for that check-in (usually
  --     nobody: "Only you"), in order, each after their own delay.
  insert into public.sends (caregiver_id, taker_id, check_in_id, purpose, channel, to_phone, dedupe_key, due_at)
  select t.caregiver_id, t.id, c.id, 'backup_alert', ch.channel, x.contact ->> 'phone',
         'check_in:' || c.id || ':contact:' || x.ord || ':' || ch.channel, p_now
  from public.check_ins c
  join public.takers t on t.id = c.taker_id
  cross join lateral (
    select e.contact, e.ord,
           sum((e.contact ->> 'alert_after_minutes')::int) over (order by e.ord)::int as after_minutes
    from jsonb_array_elements(c.alert_contacts) with ordinality as e (contact, ord)
  ) x
  cross join (values ('sms'::public.send_channel), ('call')) ch (channel)
  where c.kind = 'on_demand'
    and c.status = 'missed'
    and c.responded_at is null
    and p_now >= c.alert_at + make_interval(mins => x.after_minutes)
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


-- ---------------------------------------------------------------- the caregiver's words reach the message
-- claim_due_sends and get_send_details also return prompt_message now. Their
-- result shape changes, so they're dropped and created again.

drop function public.claim_due_sends(int, timestamptz);
drop function public.get_send_details(uuid);

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
  checked_in_at timestamptz,
  prompt_message text
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
         ci.kind, ci.responded_at, ci.prompt_message
  from claimed cl
  left join public.takers t on t.id = cl.taker_id
  left join public.caregivers g on g.id = cl.caregiver_id
  left join public.backups b on b.id = cl.backup_id
  left join public.check_ins ci on ci.id = cl.check_in_id;
end;
$$;

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
  checked_in_at timestamptz,
  prompt_message text
)
language sql
stable
security definer
set search_path = ''
as $$
  select s.id, s.purpose, s.channel, s.to_phone::text, s.attempts,
         t.first_name, g.first_name, b.name,
         t.time_zone, t.window_start, t.window_end,
         ci.kind, ci.responded_at, ci.prompt_message
  from public.sends s
  left join public.takers t on t.id = s.taker_id
  left join public.caregivers g on g.id = s.caregiver_id
  left join public.backups b on b.id = s.backup_id
  left join public.check_ins ci on ci.id = s.check_in_id
  where s.id = p_send_id;
$$;

revoke execute on function public.claim_due_sends(int, timestamptz) from public, anon, authenticated;
revoke execute on function public.get_send_details(uuid) from public, anon, authenticated;
grant execute on function public.claim_due_sends(int, timestamptz) to service_role;
grant execute on function public.get_send_details(uuid) to service_role;
