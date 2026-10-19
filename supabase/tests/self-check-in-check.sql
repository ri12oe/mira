-- "I'm okay" for someone using Mira for themselves: early, on time, late
-- after backups were alerted, twice, on a day off, on a break, by the wrong
-- account. Replays the week of 2 November 2026. Rolled back at the end.
-- Run: npx supabase db query --linked -f supabase/tests/self-check-in-check.sql
-- Prints ALL CHECKS PASSED, or an error naming the failed check (CI1-CI9).
--
-- Ana: window 9:00-11:00, 30 min extra, Monday to Friday, backup Sam (said yes, 15 min)

begin;

do $$
declare
  a uuid := '00000000-0000-0000-0000-00000000000a';  -- Ana, for herself
  b uuid := '00000000-0000-0000-0000-00000000000b';  -- a caregiver
  me uuid := gen_random_uuid(); lin uuid := gen_random_uuid(); sam uuid := gen_random_uuid();
  wed date := '2026-11-04'; thu date := '2026-11-05'; fri date := '2026-11-06'; sat date := '2026-11-07';
  indy text := 'America/Indianapolis';
  n int; res text; st text; ci uuid;
begin
  insert into auth.users (id, phone, aud, role) values
    (a, '13175550101', 'authenticated', 'authenticated'),
    (b, '13175550102', 'authenticated', 'authenticated');
  insert into public.takers (id, caregiver_id, first_name, phone, time_zone, is_self, days)
    values (me, a, 'Ana', '+13175550101', indy, true, '{0,1,2,3,4}');
  insert into public.takers (id, caregiver_id, first_name, phone, time_zone, status, joined_at)
    values (lin, b, 'Lin', '+13175550161', indy, 'active', '2026-10-01');
  insert into public.backups (id, taker_id, name, phone, position, alert_after_minutes, confirmed_at)
    values (sam, me, 'Sam', '+13175550171', 1, 15, now());

  -- CI1: Wednesday 7:00, before the window: an early check-in counts, and at
  -- 9:00 the scheduler doesn't ask (or remind, or alert)
  select public.check_in_self_at(a, (wed + time '07:00') at time zone indy) into res;
  assert res = 'recorded', 'CI1 an early check-in should be recorded, got ' || res;
  select id, status::text into ci, st from public.check_ins where taker_id = me and local_date = wed;
  assert st = 'on_time', 'CI1 an early check-in is on time, is ' || coalesce(st, 'nothing');
  perform public.scheduler_tick((wed + time '09:00') at time zone indy);
  perform public.scheduler_tick((wed + time '11:00') at time zone indy);
  perform public.scheduler_tick((wed + time '12:00') at time zone indy);
  select count(*) into n from public.sends where check_in_id = ci;
  assert n = 0, 'CI1 after checking in early nothing should be sent, got ' || n;
  select count(*) into n from public.check_ins where taker_id = me and local_date = wed;
  assert n = 1, 'CI1 still one check-in for the day, got ' || n;

  -- CI2: tapping again the same day
  select public.check_in_self_at(a, (wed + time '13:00') at time zone indy) into res;
  assert res = 'already', 'CI2 a second tap should say already, got ' || res;

  -- CI3: Thursday, asked at 9:00, taps at 9:40: on time, no reminder later
  perform public.scheduler_tick((thu + time '09:00') at time zone indy);
  select public.check_in_self_at(a, (thu + time '09:40') at time zone indy) into res;
  assert res = 'recorded', 'CI3 a tap in the window should be recorded, got ' || res;
  select id, status::text into ci, st from public.check_ins where taker_id = me and local_date = thu;
  assert st = 'on_time', 'CI3 should be on time, is ' || st;
  perform public.scheduler_tick((thu + time '11:00') at time zone indy);
  select count(*) into n from public.sends where check_in_id = ci and purpose = 'reminder';
  assert n = 0, 'CI3 no reminder after checking in, got ' || n;

  -- CI4: Friday, missed; Sam is alerted at 11:45; Ana taps at 12:10: late,
  -- and Sam gets an all-clear
  perform public.scheduler_tick((fri + time '09:00') at time zone indy);
  perform public.scheduler_tick((fri + time '11:30') at time zone indy);
  perform public.scheduler_tick((fri + time '11:45') at time zone indy);
  select id into ci from public.check_ins where taker_id = me and local_date = fri;
  update public.sends set status = 'sent' where check_in_id = ci and purpose = 'backup_alert';
  select public.check_in_self_at(a, (fri + time '12:10') at time zone indy) into res;
  assert res = 'recorded', 'CI4 a late tap should be recorded, got ' || res;
  select status::text into st from public.check_ins where id = ci;
  assert st = 'late', 'CI4 should be late, is ' || st;
  perform public.scheduler_tick((fri + time '12:11') at time zone indy);
  select count(*) into n from public.sends where check_in_id = ci and purpose = 'all_clear' and to_phone = '+13175550171';
  assert n = 1, 'CI4 Sam should get one all-clear, got ' || n;

  -- CI5: Saturday isn't one of Ana's days
  select public.check_in_self_at(a, (sat + time '10:00') at time zone indy) into res;
  assert res = 'not_today', 'CI5 Saturday should be not_today, got ' || res;
  select count(*) into n from public.check_ins where taker_id = me and local_date = sat;
  assert n = 0, 'CI5 no check-in should be made on a day off';

  -- CI6: on a break, nothing is recorded
  update public.takers set paused = true where id = me;
  select public.check_in_self_at(a, ('2026-11-09'::date + time '07:00') at time zone indy) into res;
  assert res = 'paused', 'CI6 on a break should say paused, got ' || res;
  select count(*) into n from public.check_ins where taker_id = me and local_date = '2026-11-09';
  assert n = 0, 'CI6 no check-in on a break';
  update public.takers set paused = false where id = me;

  -- CI7: an account that looks after someone has no "me" to check in
  begin
    perform public.check_in_self_at(b, (thu + time '10:00') at time zone indy);
    raise exception 'CI7 FAIL: a caregiver account checked in as a self user';
  exception when raise_exception then
    if sqlerrm <> 'not_found' then raise exception 'CI7 wrong error: %', sqlerrm; end if;
  end;
  select count(*) into n from public.check_ins where taker_id = lin and responded_at is not null;
  assert n = 0, 'CI7 Lin must not be checked in by anyone else';

  -- CI8: the app can call check_in_myself (its own clock), not the one that takes a time
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    perform public.check_in_self_at(a, now() - interval '1 day');
    raise exception 'CI8 FAIL: the app chose the time of its check-in';
  exception when insufficient_privilege then null; end;
  select public.check_in_myself() into res;
  assert res in ('recorded', 'already', 'not_today', 'nothing_open'), 'CI8 check_in_myself gave ' || res;
  reset role;

  -- CI9: signed out (no account), nothing happens
  perform set_config('request.jwt.claims', '', true);
  begin
    perform public.check_in_myself();
    raise exception 'CI9 FAIL: checked in without an account';
  exception when raise_exception then
    if sqlerrm <> 'not_found' then raise exception 'CI9 wrong error: %', sqlerrm; end if;
  end;
end $$;

select 'ALL CHECKS PASSED' as result;

rollback;
