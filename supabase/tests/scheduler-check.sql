-- Scheduler check: replays Wednesday 14 October 2026 minute by minute and
-- checks every rule. Runs in a transaction that is rolled back.
-- Run: npx supabase db query --linked -f supabase/tests/scheduler-check.sql
-- Prints ALL CHECKS PASSED, or an error naming the failed check (C1-C16).
--
-- People (all looked after by caregiver A, window 9:00-11:00, 30 min extra):
--   Lin  Indianapolis, every day, backups Sam (15 min) then Ana (60 min)
--   Mo   Los Angeles (3 hours behind)
--   Pat  Indianapolis, gets paused mid-morning
--   Dee  Mondays only
--   Ivy  invited, hasn't replied YES
--   Joe  joined at 11:10, after today's window

begin;

do $$
declare
  a uuid := '00000000-0000-0000-0000-00000000000a';
  lin uuid := gen_random_uuid(); mo uuid := gen_random_uuid(); pat uuid := gen_random_uuid();
  dee uuid := gen_random_uuid(); ivy uuid := gen_random_uuid(); joe uuid := gen_random_uuid();
  sam uuid := gen_random_uuid(); ana uuid := gen_random_uuid();
  day date := '2026-10-14'; -- a Wednesday (day 2)
  indy text := 'America/Indianapolis';
  lin_ci uuid; n int; st text; r record; fail_id uuid; due timestamptz;
begin
  insert into auth.users (id, phone, aud, role) values (a, '13175550101', 'authenticated', 'authenticated');
  insert into public.takers (id, caregiver_id, first_name, phone, time_zone, status, joined_at) values
    (lin, a, 'Lin', '+13175550161', indy, 'active', '2026-10-01'),
    (mo,  a, 'Mo',  '+13175550162', 'America/Los_Angeles', 'active', '2026-10-01'),
    (pat, a, 'Pat', '+13175550163', indy, 'active', '2026-10-01'),
    (dee, a, 'Dee', '+13175550164', indy, 'active', '2026-10-01'),
    (ivy, a, 'Ivy', '+13175550165', indy, 'invited', null),
    (joe, a, 'Joe', '+13175550166', indy, 'active', (day + time '11:10') at time zone indy);
  update public.takers set days = '{0}' where id = dee;
  insert into public.backups (id, taker_id, name, phone, position, alert_after_minutes) values
    (sam, lin, 'Sam', '+13175550171', 1, 15),
    (ana, lin, 'Ana', '+13175550172', 2, 60);

  -- C1: 8:59, nothing yet
  perform public.scheduler_tick((day + time '08:59') at time zone indy);
  select count(*) into n from public.check_ins c join public.takers t on t.id = c.taker_id where t.caregiver_id = a;
  assert n = 0, 'C1 no check-ins before 9:00, found ' || n;

  -- C2: 9:00, Lin and Pat start (Mo is 6:00 in LA; Dee is Mondays; Ivy hasn't joined)
  perform public.scheduler_tick((day + time '09:00') at time zone indy);
  select count(*) into n from public.check_ins c join public.takers t on t.id = c.taker_id where t.caregiver_id = a;
  assert n = 2, 'C2 Lin and Pat should start at 9:00, found ' || n;
  select id into lin_ci from public.check_ins where taker_id = lin;
  select count(*) into n from public.sends where check_in_id = lin_ci and purpose = 'check_in_prompt' and channel = 'sms';
  assert n = 1, 'C2 Lin should get 1 text prompt, got ' || n;

  -- C3: running again in the same minute adds nothing
  perform public.scheduler_tick((day + time '09:00') at time zone indy);
  perform public.scheduler_tick((day + time '09:00:30') at time zone indy);
  select count(*) into n from public.sends where check_in_id = lin_ci;
  assert n = 1, 'C3 re-running should not add sends, Lin has ' || n;

  -- C4: Pat is paused at 9:30: today is skipped and the unsent prompt cancelled
  update public.takers set paused = true where id = pat;
  perform public.scheduler_tick((day + time '09:31') at time zone indy);
  select c.status::text into st from public.check_ins c where c.taker_id = pat;
  assert st = 'skipped', 'C4 Pat''s check-in should be skipped, is ' || st;
  select count(*) into n from public.sends s join public.check_ins c on c.id = s.check_in_id
    where c.taker_id = pat and s.status = 'cancelled';
  assert n = 1, 'C4 Pat''s prompt should be cancelled';

  -- C5: 10:59 no reminder yet; 11:00 one reminder
  perform public.scheduler_tick((day + time '10:59') at time zone indy);
  select count(*) into n from public.sends where check_in_id = lin_ci and purpose = 'reminder';
  assert n = 0, 'C5 no reminder before 11:00';
  perform public.scheduler_tick((day + time '11:00') at time zone indy);
  select count(*) into n from public.sends where check_in_id = lin_ci and purpose = 'reminder';
  assert n = 1, 'C5 one reminder at 11:00, got ' || n;

  -- C6: Joe joined at 11:10, after today's window: he starts tomorrow
  perform public.scheduler_tick((day + time '11:15') at time zone indy);
  select count(*) into n from public.check_ins where taker_id = joe;
  assert n = 0, 'C6 Joe should not start today';

  -- C7: 11:29 still pending; 11:30 missed and the caregiver is alerted (text, call, push)
  perform public.scheduler_tick((day + time '11:29') at time zone indy);
  select status::text into st from public.check_ins where id = lin_ci;
  assert st = 'pending', 'C7 still pending at 11:29, is ' || st;
  perform public.scheduler_tick((day + time '11:30') at time zone indy);
  select status::text into st from public.check_ins where id = lin_ci;
  assert st = 'missed', 'C7 missed at 11:30, is ' || st;
  select count(*) into n from public.sends where check_in_id = lin_ci and purpose = 'caregiver_alert';
  assert n = 3, 'C7 caregiver gets text + call + push, got ' || n;
  select count(*) into n from public.sends where check_in_id = lin_ci and purpose = 'caregiver_alert' and to_phone = '+13175550101';
  assert n = 2, 'C7 text and call go to the caregiver''s phone';

  -- C10a: at 11:30 Indianapolis it's only 8:30 in Los Angeles: Mo hasn't started
  select count(*) into n from public.check_ins where taker_id = mo;
  assert n = 0, 'C10a Mo not before 9:00 LA time';

  -- C8: backups in order: Sam 15 min after the caregiver, Ana 60 min after Sam
  perform public.scheduler_tick((day + time '11:44') at time zone indy);
  select count(*) into n from public.sends where check_in_id = lin_ci and purpose = 'backup_alert';
  assert n = 0, 'C8 no backup before 11:45';
  perform public.scheduler_tick((day + time '11:45') at time zone indy);
  select count(*) into n from public.sends where check_in_id = lin_ci and backup_id = sam;
  assert n = 2, 'C8 Sam gets text + call at 11:45, got ' || n;
  perform public.scheduler_tick((day + time '12:44') at time zone indy);
  select count(*) into n from public.sends where check_in_id = lin_ci and backup_id = ana;
  assert n = 0, 'C8 Ana not before 12:45';
  perform public.scheduler_tick((day + time '12:45') at time zone indy);
  perform public.scheduler_tick((day + time '12:45') at time zone indy);
  perform public.scheduler_tick((day + time '12:45:59') at time zone indy);
  select count(*) into n from public.sends where check_in_id = lin_ci and backup_id = ana;
  assert n = 2, 'C8 Ana gets text + call at 12:45 (once), got ' || n;

  -- C9: Lin's whole day, after running 3 times at 12:45: exactly 9 sends
  --     (prompt, reminder, 3 caregiver, 2 Sam, 2 Ana)
  select count(*) into n from public.sends where check_in_id = lin_ci;
  assert n = 9, 'C9 Lin should have exactly 9 sends, has ' || n;

  -- C10: Mo (Los Angeles) started once the 12:00+ ticks ran, with a window of
  --      9:00-11:00 LA time (= 12:00-14:00 Indianapolis)
  select count(*) into n from public.check_ins where taker_id = mo
    and window_starts_at = (day + time '09:00') at time zone 'America/Los_Angeles'
    and window_starts_at = (day + time '12:00') at time zone indy
    and local_date = day;
  assert n = 1, 'C10 Mo''s window should be 9:00 LA time';

  -- C11: Mo checks in on time at 9:10 LA: no reminder, no alerts later
  update public.check_ins set responded_at = (day + time '09:10') at time zone 'America/Los_Angeles',
    responded_via = 'text', status = 'on_time' where taker_id = mo;
  perform public.scheduler_tick((day + time '15:00') at time zone indy);
  select count(*) into n from public.sends s join public.check_ins c on c.id = s.check_in_id
    where c.taker_id = mo and s.purpose <> 'check_in_prompt';
  assert n = 0, 'C11 Mo checked in: no reminder or alerts, found ' || n;

  -- C12: Dee (Mondays only) and Ivy (not joined) never started
  select count(*) into n from public.check_ins where taker_id in (dee, ivy);
  assert n = 0, 'C12 Dee and Ivy should have no check-ins';

  -- C13: delivery claims each due send once; a second claim gets nothing
  select count(*) into n from public.claim_due_sends(50, (day + time '12:46') at time zone indy) x
    where x.send_id in (select id from public.sends where check_in_id = lin_ci);
  assert n = 9, 'C13 all 9 of Lin''s sends are claimable, got ' || n;
  select count(*) into n from public.claim_due_sends(50, (day + time '12:46') at time zone indy);
  assert n = 0, 'C13 a second claim gets nothing, got ' || n;

  -- C14: all succeed except Ana's call, which fails: retried at +2 min, +4 min, then failed
  select id into fail_id from public.sends where check_in_id = lin_ci and backup_id = ana and channel = 'call';
  for r in select id from public.sends where check_in_id = lin_ci and id <> fail_id loop
    perform public.finish_send(r.id, true, 'test-ok', null, (day + time '12:46') at time zone indy);
  end loop;
  perform public.finish_send(fail_id, false, null, 'busy', (day + time '12:46') at time zone indy);
  select status::text, due_at into st, due from public.sends where id = fail_id;
  assert st = 'queued' and due = (day + time '12:48') at time zone indy, 'C14 1st failure retries at 12:48, got ' || st || ' ' || due;
  select count(*) into n from public.claim_due_sends(50, (day + time '12:47') at time zone indy) x where x.send_id = fail_id;
  assert n = 0, 'C14 not retried before 12:48';
  perform public.claim_due_sends(50, (day + time '12:48') at time zone indy);
  perform public.finish_send(fail_id, false, null, 'busy', (day + time '12:48') at time zone indy);
  select due_at into due from public.sends where id = fail_id;
  assert due = (day + time '12:52') at time zone indy, 'C14 2nd failure retries at 12:52, got ' || due;
  perform public.claim_due_sends(50, (day + time '12:52') at time zone indy);
  perform public.finish_send(fail_id, false, null, 'busy', (day + time '12:52') at time zone indy);
  select status::text into st from public.sends where id = fail_id;
  assert st = 'failed', 'C14 3rd failure is final, status ' || st;

  -- C15: Lin checks in late at 13:00, after alerts: everyone alerted gets an
  --      all-clear text once (caregiver, Sam, Ana: Ana's text did go out)
  update public.check_ins set responded_at = (day + time '13:00') at time zone indy,
    responded_via = 'text', status = 'late' where id = lin_ci;
  perform public.scheduler_tick((day + time '13:01') at time zone indy);
  perform public.scheduler_tick((day + time '13:02') at time zone indy);
  select count(*) into n from public.sends where check_in_id = lin_ci and purpose = 'all_clear';
  assert n = 3, 'C15 3 all-clear texts (caregiver, Sam, Ana), got ' || n;

  -- C16: the app (and anyone signed out) can't run the scheduler
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    perform public.scheduler_tick();
    raise exception 'C16 FAIL: the app ran the scheduler';
  exception when insufficient_privilege then null; end;
  begin
    perform public.claim_due_sends();
    raise exception 'C16 FAIL: the app claimed sends';
  exception when insufficient_privilege then null; end;
  reset role;
end $$;

select 'ALL CHECKS PASSED' as result;

rollback;
