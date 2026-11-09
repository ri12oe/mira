-- Demo data: resets the demo accounts to a clean, realistic starting point.
-- Run (any time, as often as you like):
--   npx supabase db query --linked -f supabase/seed-demo.sql
-- Then check it:
--   npx supabase db query --linked -f supabase/tests/seed-demo-check.sql
--
-- Who's in the demo (all in Chicago time; 555-01xx numbers are fictional):
--   Jordan  +1 312 555 0101  caregiver account, looks after Lin and Mo
--   Lin     +1 312 555 0102  Jordan's mom, checks in by text, 9:00-11:00, every day
--                            backup: Sam, 15 min after Jordan
--   Mo      +1 312 555 0103  Jordan's dad, checks in with the Mira app, 8:00-10:00, Mon-Sat
--                            has his own account ("Someone invited me")
--   Sam     +1 312 555 0104  neighbour/brother: Lin's and Ana's backup (no account)
--   Ana     +1 312 555 0105  checks in for herself with the app, 10:00-12:00, every day
--                            backup: Sam, who said yes
--
-- Each person gets the last 4 weeks of history (mostly on time, a few late,
-- one missed day with the alerts that went out, and a couple of skipped days).
-- Today is left alone: the scheduler creates it when the window opens, so
-- the demo runs live.
--
-- Only these fixed demo ids are ever deleted, so nobody else's data is touched.
-- The demo accounts themselves (and their phones' push sign-ins) are kept,
-- so the demo phones stay signed in across resets.

begin;

do $$
declare
  tz constant text := 'America/Chicago';

  -- accounts
  jordan constant uuid := 'd0000000-0000-4000-8000-000000000001';
  mo_acct constant uuid := 'd0000000-0000-4000-8000-000000000002';
  ana_acct constant uuid := 'd0000000-0000-4000-8000-000000000003';
  -- takers
  lin constant uuid := 'd0000000-0000-4000-8000-000000000011';
  mo constant uuid := 'd0000000-0000-4000-8000-000000000012';
  ana constant uuid := 'd0000000-0000-4000-8000-000000000013';
  -- backups (Sam, once for Lin and once for Ana)
  sam_for_lin constant uuid := 'd0000000-0000-4000-8000-000000000021';
  sam_for_ana constant uuid := 'd0000000-0000-4000-8000-000000000022';

  jordan_phone constant text := '+13125550101';
  sam_phone constant text := '+13125550104';

  today date := (now() at time zone tz)::date;
  t record;
  n int;
  d date;
  outcome text;
  v_starts timestamptz;
  v_ends timestamptz;
  v_alert_at timestamptz;
  answered_at timestamptz;
  ci uuid;
  v_channel public.send_channel;
begin
  -- 1. Wipe the old demo (cascades to backups, invites, check-ins and sends)
  delete from public.sends where caregiver_id in (jordan, mo_acct, ana_acct);
  delete from public.takers where caregiver_id in (jordan, mo_acct, ana_acct);

  -- 2. The sign-in accounts. Auth keeps phones without the "+". The token
  --    columns must be '' (not null) or Auth can't read the user back.
  --    Creating a user also creates its caregivers row (handle_new_user).
  insert into auth.users (
    instance_id, id, aud, role, phone, phone_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
  )
  select '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated',
         u.phone, now(), now(), now(),
         '{"provider": "phone", "providers": ["phone"]}'::jsonb, '{}'::jsonb,
         '', '', '', '', '', '', '', ''
  from (values
    (jordan, '13125550101'),
    (mo_acct, '13125550103'),
    (ana_acct, '13125550105')
  ) as u (id, phone)
  on conflict (id) do nothing;

  update public.caregivers set first_name = 'Jordan', email = null, photo_path = null where id = jordan;
  update public.caregivers set first_name = 'Mo', email = null, photo_path = null where id = mo_acct;
  update public.caregivers set first_name = 'Ana', email = null, photo_path = null where id = ana_acct;

  -- The accounts that get the demo controls (20261109120000_demo_controls.sql).
  -- Not Mo: he looks after nobody, so there's nothing for him to fast-forward.
  insert into public.demo_accounts (id) values (jordan), (ana_acct)
  on conflict (id) do nothing;

  -- 3. The people being looked after. Lin and Mo joined five weeks ago.
  insert into public.takers (
    id, caregiver_id, first_name, phone, caregiver_relationship, method, time_zone,
    window_start, window_end, days, extra_minutes, status, joined_at, created_at
  ) values
    (lin, jordan, 'Lin', '+13125550102', 'Mom', 'text', tz,
     540, 660, '{0,1,2,3,4,5,6}', 30, 'active', now() - interval '35 days', now() - interval '35 days'),
    (mo, jordan, 'Mo', '+13125550103', 'Dad', 'app', tz,
     480, 600, '{0,1,2,3,4,5}', 30, 'active', now() - interval '35 days', now() - interval '35 days');

  -- Ana is her own taker: takers_self_rules fills in her phone, 'app' and 'active'
  insert into public.takers (
    id, caregiver_id, first_name, phone, method, time_zone,
    window_start, window_end, days, extra_minutes, is_self, created_at
  ) values
    (ana, ana_acct, 'Ana', '+13125550105', 'app', tz,
     600, 720, '{0,1,2,3,4,5,6}', 30, true, now() - interval '35 days');

  insert into public.invites (taker_id, message, status, accepted_at, created_at) values
    (lin, 'Hi Mom, it''s Jordan. I set up Mira so I know you''re okay each day.',
     'accepted', now() - interval '35 days', now() - interval '35 days'),
    (mo, 'Hi Dad, it''s Jordan. Mira will ask you to tap once a day so I know you''re okay.',
     'accepted', now() - interval '35 days', now() - interval '35 days');

  -- 4. Backups. Sam said yes to Ana's backup invite.
  insert into public.backups (id, taker_id, name, phone, relationship, position, alert_after_minutes, confirmed_at) values
    (sam_for_lin, lin, 'Sam', sam_phone, 'Neighbor', 1, 15, null),
    (sam_for_ana, ana, 'Sam', sam_phone, 'Brother', 1, 30, now() - interval '33 days');

  insert into public.invites (taker_id, backup_id, message, status, accepted_at, created_at) values
    (ana, sam_for_ana, 'Hi Sam, it''s Ana. Can you be my backup on Mira?',
     'accepted', now() - interval '33 days', now() - interval '34 days');

  -- 5. Four weeks of history, oldest first
  for t in
    select tk.id, tk.caregiver_id, tk.phone, tk.method, tk.window_start, tk.window_end,
           tk.extra_minutes, tk.days, tk.is_self
    from public.takers tk
    where tk.id in (lin, mo, ana)
  loop
    v_channel := (case t.method when 'text' then 'sms' when 'call' then 'call' else 'push' end)::public.send_channel;

    for n in reverse 28..1 loop
      d := today - n;
      continue when not ((extract(isodow from d)::int - 1) = any (t.days)); -- 0 = Monday

      -- A few days that aren't on time, different for each person
      outcome := case
        when t.id = lin and n = 9 then 'missed'
        when t.id = lin and n in (4, 17) then 'late'
        when t.id = lin and n = 22 then 'skipped'
        when t.id = mo and n = 13 then 'missed'
        when t.id = mo and n = 6 then 'late'
        when t.id = mo and n in (19, 20) then 'skipped'
        when t.id = ana and n = 3 then 'missed'
        when t.id = ana and n = 11 then 'late'
        else 'on_time'
      end;

      v_starts := (d + make_interval(mins => t.window_start)) at time zone tz;
      v_ends := (d + make_interval(mins => t.window_end)) at time zone tz;
      v_alert_at := (d + make_interval(mins => t.window_end + t.extra_minutes)) at time zone tz;
      -- Varied but repeatable times: on time somewhere inside the window,
      -- late a little after it ends (before anyone is alerted)
      answered_at := case outcome
        when 'on_time' then v_starts + make_interval(mins => 4 + (n * 37 + t.window_start) % (t.window_end - t.window_start - 10))
        when 'late' then v_ends + make_interval(mins => 6 + n % 15)
      end;

      insert into public.check_ins (
        taker_id, kind, local_date, window_starts_at, window_ends_at, alert_at,
        status, responded_at, responded_via, created_at
      ) values (
        t.id, 'scheduled', d, v_starts, v_ends, v_alert_at,
        outcome::public.check_in_status, answered_at,
        case when answered_at is not null then t.method end,
        v_starts
      )
      returning id into ci;

      continue when outcome = 'skipped'; -- paused that day: nothing was sent

      -- What went out, recorded the way test mode records it (sent, test-… id)
      insert into public.sends (caregiver_id, taker_id, check_in_id, purpose, channel, to_phone,
                                dedupe_key, status, provider_id, attempts, due_at, created_at)
      values (t.caregiver_id, t.id, ci, 'check_in_prompt', v_channel,
              case when v_channel = 'push' then null else t.phone end,
              'check_in:' || ci || ':prompt', 'sent', 'test-' || gen_random_uuid(), 1, v_starts, v_starts);

      if outcome in ('late', 'missed') then
        insert into public.sends (caregiver_id, taker_id, check_in_id, purpose, channel, to_phone,
                                  dedupe_key, status, provider_id, attempts, due_at, created_at)
        values (t.caregiver_id, t.id, ci, 'reminder', v_channel,
                case when v_channel = 'push' then null else t.phone end,
                'check_in:' || ci || ':reminder', 'sent', 'test-' || gen_random_uuid(), 1, v_ends, v_ends);
      end if;

      if outcome = 'missed' then
        -- The caregiver: text, call and push (not for Ana, who is her own "caregiver")
        if not t.is_self then
          insert into public.sends (caregiver_id, taker_id, check_in_id, purpose, channel, to_phone,
                                    dedupe_key, status, provider_id, attempts, due_at, created_at)
          select t.caregiver_id, t.id, ci, 'caregiver_alert', ch.channel,
                 case when ch.channel = 'push' then null else jordan_phone end,
                 'check_in:' || ci || ':caregiver_alert:' || ch.channel,
                 'sent', 'test-' || gen_random_uuid(), 1, v_alert_at, v_alert_at
          from (values ('sms'::public.send_channel), ('call'), ('push')) ch (channel);
        end if;

        -- Then the backups, each after their own delay
        insert into public.sends (caregiver_id, taker_id, check_in_id, backup_id, purpose, channel, to_phone,
                                  dedupe_key, status, provider_id, attempts, due_at, created_at)
        select t.caregiver_id, t.id, ci, b.id, 'backup_alert', ch.channel, b.phone,
               'check_in:' || ci || ':backup_alert:' || b.id || ':' || ch.channel,
               'sent', 'test-' || gen_random_uuid(), 1,
               v_alert_at + make_interval(mins => b.alert_after_minutes),
               v_alert_at + make_interval(mins => b.alert_after_minutes)
        from public.backups b
        cross join (values ('sms'::public.send_channel), ('call')) ch (channel)
        where b.taker_id = t.id;
      end if;
    end loop;
  end loop;
end;
$$;

commit;

select 'DEMO READY: Jordan (+1 312 555 0101), Mo (+1 312 555 0103), Ana (+1 312 555 0105)' as result;
