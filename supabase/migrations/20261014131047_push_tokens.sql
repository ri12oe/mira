-- Push notifications for the caregiver (Expo push service).
--
-- push_tokens: one row per phone where the caregiver turned on alerts. The
-- token is the phone's "address" for push notifications; it isn't a secret,
-- but only its owner can see or change it (RLS).
--
-- The scheduler already queues caregiver alerts with channel 'push' (step 6);
-- deliver-sends now really sends them. This also adds a push all-clear to the
-- caregiver when someone checks in after a push alert went out.

create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  caregiver_id uuid not null default auth.uid()
    references public.caregivers (id) on delete cascade,
  token text not null unique check (token like 'ExponentPushToken[%]' or token like 'ExpoPushToken[%]'),
  platform text not null check (platform in ('android', 'ios')),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index push_tokens_caregiver_id on public.push_tokens (caregiver_id);

alter table public.push_tokens enable row level security;

revoke all on public.push_tokens from anon, authenticated;
grant select, delete on public.push_tokens to authenticated;
grant insert (token, platform) on public.push_tokens to authenticated;
grant update (last_seen_at) on public.push_tokens to authenticated;

create policy "Caregivers manage their own phones"
  on public.push_tokens for all to authenticated
  using (caregiver_id = (select auth.uid()))
  with check (caregiver_id = (select auth.uid()));

-- A phone that changes hands (someone else signs in on it) moves to the new
-- caregiver, so alerts never go to the previous person's phone owner by
-- mistake. Called by the app after sign-in.
create function public.register_push_token(p_token text, p_platform text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;
  insert into public.push_tokens (caregiver_id, token, platform)
  values (auth.uid(), p_token, p_platform)
  on conflict (token) do update
    set caregiver_id = excluded.caregiver_id,
        platform = excluded.platform,
        last_seen_at = now();
end;
$$;

revoke execute on function public.register_push_token(text, text) from public, anon;
grant execute on function public.register_push_token(text, text) to authenticated;


-- ---------------------------------------------------------------- scheduler: push all-clear
-- Same as before, plus step 8b (push all-clear to the caregiver).

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

  -- 8b. ...and if the caregiver got a push alert, a push all-clear too
  insert into public.sends (caregiver_id, taker_id, check_in_id, purpose, channel, to_phone, dedupe_key, due_at)
  select distinct a.caregiver_id, a.taker_id, a.check_in_id, 'all_clear'::public.send_purpose, 'push'::public.send_channel, null::public.phone_e164,
         'check_in:' || a.check_in_id || ':all_clear:push', p_now
  from public.sends a
  join public.check_ins c on c.id = a.check_in_id
  where a.purpose = 'caregiver_alert'
    and a.channel = 'push'
    and a.status in ('sent', 'delivered')
    and c.responded_at is not null
    and p_now < c.responded_at + interval '12 hours'
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

