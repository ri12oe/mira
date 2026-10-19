-- Self scheduler check: replays Wednesday 4 November 2026 for someone using
-- Mira for themselves, next to a caregiver's taker. Rolled back at the end.
-- Run: npx supabase db query --linked -f supabase/tests/self-scheduler-check.sql
-- Prints ALL CHECKS PASSED, or an error naming the failed check (SS1-SS9).
--
-- Ana uses Mira for herself (window 9:00-11:00, 30 min extra, app), backups:
--   Sam  said yes, 15 min
--   Kim  hasn't said yes, 15 min   (never alerted)
--   Lee  said yes, 30 min          (counted after Sam, since Kim is skipped)
-- Lin is looked after by caregiver B; her backup Bo never needs to say yes.

begin;

do $$
declare
  a uuid := '00000000-0000-0000-0000-00000000000a';  -- Ana, for herself
  b uuid := '00000000-0000-0000-0000-00000000000b';  -- a caregiver
  me uuid := gen_random_uuid(); lin uuid := gen_random_uuid();
  sam uuid := gen_random_uuid(); kim uuid := gen_random_uuid();
  lee uuid := gen_random_uuid(); bo uuid := gen_random_uuid();
  day date := '2026-11-04'; -- a Wednesday, after "now", so Ana has joined by then
  indy text := 'America/Indianapolis';
  me_ci uuid; lin_ci uuid; n int; r record; sam_sms uuid; lin_prompt uuid;
begin
  insert into auth.users (id, phone, aud, role) values
    (a, '13175550101', 'authenticated', 'authenticated'),
    (b, '13175550102', 'authenticated', 'authenticated');
  insert into public.takers (id, caregiver_id, first_name, phone, time_zone, is_self)
    values (me, a, 'Ana', '+13175550101', indy, true);
  insert into public.takers (id, caregiver_id, first_name, phone, time_zone, status, joined_at)
    values (lin, b, 'Lin', '+13175550161', indy, 'active', '2026-10-01');
  insert into public.backups (id, taker_id, name, phone, position, alert_after_minutes, confirmed_at) values
    (sam, me, 'Sam', '+13175550171', 1, 15, now()),
    (kim, me, 'Kim', '+13175550172', 2, 15, null),
    (lee, me, 'Lee', '+13175550175', 3, 30, now()),
    (bo, lin, 'Bo', '+13175550181', 1, 15, null);

  -- SS1: 9:00, Ana's check-in starts and she's asked by push (she uses the app)
  perform public.scheduler_tick((day + time '09:00') at time zone indy);
  select id into me_ci from public.check_ins where taker_id = me and local_date = day;
  assert me_ci is not null, 'SS1 Ana''s check-in should start at 9:00';
  select count(*) into n from public.sends where check_in_id = me_ci and purpose = 'check_in_prompt' and channel = 'push';
  assert n = 1, 'SS1 Ana should get 1 push prompt, got ' || n;

  -- SS2: 11:00, a push reminder
  perform public.scheduler_tick((day + time '11:00') at time zone indy);
  select count(*) into n from public.sends where check_in_id = me_ci and purpose = 'reminder' and channel = 'push';
  assert n = 1, 'SS2 Ana should get 1 push reminder, got ' || n;

  -- SS3: 11:30, missed, but there's no caregiver step for Ana...
  perform public.scheduler_tick((day + time '11:30') at time zone indy);
  select count(*) into n from public.check_ins where id = me_ci and status = 'missed';
  assert n = 1, 'SS3 Ana''s check-in should be missed at 11:30';
  select count(*) into n from public.sends where check_in_id = me_ci and purpose = 'caregiver_alert';
  assert n = 0, 'SS3 nobody is Ana''s caregiver, yet ' || n || ' caregiver alert(s) were queued';
  -- ...while Lin's caregiver is alerted as before
  select id into lin_ci from public.check_ins where taker_id = lin and local_date = day;
  select count(*) into n from public.sends where check_in_id = lin_ci and purpose = 'caregiver_alert';
  assert n = 3, 'SS3 Lin''s caregiver should get text, call and push, got ' || n;

  -- SS4: 11:45, Sam (said yes, 15 min) is alerted; not Kim, not Lee yet
  perform public.scheduler_tick((day + time '11:45') at time zone indy);
  select count(*) into n from public.sends where check_in_id = me_ci and backup_id = sam and purpose = 'backup_alert';
  assert n = 2, 'SS4 Sam should get a text and a call, got ' || n;
  select count(*) into n from public.sends where check_in_id = me_ci and backup_id in (kim, lee);
  assert n = 0, 'SS4 Kim and Lee shouldn''t be alerted yet, got ' || n;
  -- Lin's Bo never had to say yes (caregivers' backups don't)
  select count(*) into n from public.sends where check_in_id = lin_ci and backup_id = bo;
  assert n = 2, 'SS4 Lin''s backup Bo should be alerted, got ' || n;

  -- SS5: 12:15, Lee is next (30 min after Sam; Kim doesn't count)
  perform public.scheduler_tick((day + time '12:14') at time zone indy);
  select count(*) into n from public.sends where check_in_id = me_ci and backup_id = lee;
  assert n = 0, 'SS5 Lee is due at 12:15, not 12:14';
  perform public.scheduler_tick((day + time '12:15') at time zone indy);
  select count(*) into n from public.sends where check_in_id = me_ci and backup_id = lee;
  assert n = 2, 'SS5 Lee should get a text and a call at 12:15, got ' || n;

  -- SS6: Kim never said yes, so Kim is never alerted
  perform public.scheduler_tick((day + time '15:00') at time zone indy);
  select count(*) into n from public.sends where backup_id = kim;
  assert n = 0, 'SS6 Kim hasn''t said yes and must never be alerted, got ' || n;

  -- SS7: running the same minutes again adds nothing (no double alerts)
  select count(*) into n from public.sends where check_in_id = me_ci;
  perform public.scheduler_tick((day + time '11:45') at time zone indy);
  perform public.scheduler_tick((day + time '12:15') at time zone indy);
  assert (select count(*) from public.sends where check_in_id = me_ci) = n, 'SS7 re-running must not add sends';

  -- SS8: delivery is told who's a self user (to push Ana's prompt to her own
  -- phone, and to word Sam's alert without "your family has been alerted")
  select id into sam_sms from public.sends where check_in_id = me_ci and backup_id = sam and channel = 'sms';
  select id into lin_prompt from public.sends where check_in_id = lin_ci and purpose = 'check_in_prompt';
  set local role service_role;
  select * into r from public.get_send_details(sam_sms);
  assert r.taker_is_self and r.taker_name = 'Ana' and r.backup_name = 'Sam', 'SS8 Sam''s alert should be marked as for a self user';
  select * into r from public.get_send_details(lin_prompt);
  assert not r.taker_is_self, 'SS8 Lin''s prompt is not for a self user';
  reset role;

  -- SS9: Ana checks in late: Sam and Lee (alerted) get an all-clear, Kim doesn't
  update public.sends set status = 'sent' where check_in_id = me_ci and purpose = 'backup_alert';
  perform public.record_check_in(me, 'app', false, (day + time '15:10') at time zone indy);
  perform public.scheduler_tick((day + time '15:11') at time zone indy);
  select count(*) into n from public.sends where check_in_id = me_ci and purpose = 'all_clear';
  assert n = 2, 'SS9 Sam and Lee should each get one all-clear, got ' || n;
  select count(*) into n from public.sends where check_in_id = me_ci and purpose = 'all_clear' and channel = 'push';
  assert n = 0, 'SS9 no push all-clear for Ana (she checked in herself)';
end $$;

select 'ALL CHECKS PASSED' as result;

rollback;
