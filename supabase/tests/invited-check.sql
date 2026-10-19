-- Invited person: Lin signs in with the number Jordan and Maya invited, which
-- counts as her YES; she sees only her own day; one "I'm okay" counts for
-- both. Replays the week of 2 November 2026. Rolled back at the end.
-- Run: npx supabase db query --linked -f supabase/tests/invited-check.sql
-- Prints ALL CHECKS PASSED, or an error naming the failed check (I1-I12).
--
-- Jordan (J) looks after Lin (text, 9:00-11:00) and Mo; Lin's backup is Sam.
-- Maya (M) also looks after Lin (app, 10:00-12:00). Lin's account is L.
-- X has a number nobody invited.

begin;

do $$
declare
  j uuid := '00000000-0000-0000-0000-0000000000a1';
  m uuid := '00000000-0000-0000-0000-0000000000a2';
  l uuid := '00000000-0000-0000-0000-0000000000a3';
  x uuid := '00000000-0000-0000-0000-0000000000a4';
  lin_j uuid := gen_random_uuid(); lin_m uuid := gen_random_uuid(); mo uuid := gen_random_uuid();
  wed date := '2026-11-04'; thu date := '2026-11-05'; sat date := '2026-11-07';
  indy text := 'America/Indianapolis';
  n int; res text; r record; st text;
begin
  insert into auth.users (id, phone, aud, role) values
    (j, '13175550201', 'authenticated', 'authenticated'),
    (m, '13175550202', 'authenticated', 'authenticated'),
    (l, '13175550161', 'authenticated', 'authenticated'),
    (x, '13175550299', 'authenticated', 'authenticated');
  update public.caregivers set first_name = 'Jordan' where id = j;
  update public.caregivers set first_name = 'Maya' where id = m;
  insert into public.takers (id, caregiver_id, first_name, phone, time_zone, method, window_start, window_end, days)
    values (lin_j, j, 'Lin', '+13175550161', indy, 'text', 540, 660, '{0,1,2,3,4}'),
           (lin_m, m, 'Mom', '+13175550161', indy, 'app', 600, 720, '{0,1,2,3,4,5,6}'),
           (mo, j, 'Mo', '+13175550162', indy, 'text', 540, 660, '{0,1,2,3,4,5,6}');
  insert into public.backups (taker_id, name, phone, position) values (lin_j, 'Sam', '+13175550171', 1);

  -- I1: nobody has sent Lin an invite yet (both are drafts): nothing to join
  perform set_config('request.jwt.claims', json_build_object('sub', l, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    perform public.join_as_invited();
    raise exception 'I1 FAIL: joined without an invite';
  exception when raise_exception then
    if sqlerrm <> 'not_invited' then raise exception 'I1 wrong error: %', sqlerrm; end if;
  end;
  reset role;

  -- I2: Jordan invites; Lin signs in: that's her YES to Jordan (Maya's draft stays)
  set local role service_role;
  perform public.prepare_invite(j, lin_j, gen_random_uuid(), 'Hi Lin');
  reset role;
  set local role authenticated;
  select public.join_as_invited() into n;
  reset role;
  assert n = 1, 'I2 Lin should be connected with 1 caregiver, got ' || n;
  select status::text into st from public.takers where id = lin_j;
  assert st = 'active', 'I2 Lin should be active for Jordan, is ' || st;
  select count(*) into n from public.invites where taker_id = lin_j and status = 'accepted';
  assert n = 1, 'I2 Jordan''s invite should be accepted';
  select status::text into st from public.takers where id = lin_m;
  assert st = 'draft', 'I2 Maya hasn''t invited yet, so Lin stays a draft there, is ' || st;

  -- I3: Maya invites too; signing in again joins her as well
  set local role service_role;
  perform public.prepare_invite(m, lin_m, gen_random_uuid(), 'Hi Mom');
  reset role;
  set local role authenticated;
  select public.join_as_invited() into n;
  reset role;
  assert n = 2, 'I3 Lin should now be connected with 2 caregivers, got ' || n;

  -- I4: a number nobody invited
  perform set_config('request.jwt.claims', json_build_object('sub', x, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    perform public.join_as_invited();
    raise exception 'I4 FAIL: an uninvited number joined';
  exception when raise_exception then
    if sqlerrm <> 'not_invited' then raise exception 'I4 wrong error: %', sqlerrm; end if;
  end;
  reset role;

  -- I5: a caregiver's account can't also be an invited person
  perform set_config('request.jwt.claims', json_build_object('sub', j, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    perform public.join_as_invited();
    raise exception 'I5 FAIL: a caregiver account joined as invited';
  exception when raise_exception then
    if sqlerrm <> 'account_type_mismatch' then raise exception 'I5 wrong error: %', sqlerrm; end if;
  end;
  reset role;

  -- I6: her day: one row per caregiver, with their names and numbers, nothing else
  set local role service_role;
  select count(*) into n from public.invited_day_at(l, (wed + time '08:00') at time zone indy);
  assert n = 2, 'I6 Lin should see 2 caregivers, got ' || n;
  select count(*) into n from public.invited_day_at(l, (wed + time '08:00') at time zone indy) d
    where (d.caregiver_name, d.caregiver_phone, d.first_name) in (('Jordan', '+13175550201', 'Lin'), ('Maya', '+13175550202', 'Mom'));
  assert n = 2, 'I6 should show Jordan''s and Maya''s names and numbers';
  select count(*) into n from public.invited_day_at(l, (wed + time '08:00') at time zone indy) d
    where d.taker_id = mo;
  assert n = 0, 'I6 Lin must never see Mo (Jordan''s other person)';
  reset role;
  -- ...and no table access: as herself she sees no takers, backups or check-ins
  perform set_config('request.jwt.claims', json_build_object('sub', l, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select (select count(*) from public.takers) + (select count(*) from public.backups)
       + (select count(*) from public.check_ins) + (select count(*) from public.sends)
       + (select count(*) from public.invites) into n;
  reset role;
  assert n = 0, 'I6 Lin could read ' || n || ' rows from the tables directly';

  -- I7: Wednesday 8:00, before both windows: one tap is an early check-in for
  -- both, so neither asks her later
  set local role service_role;
  select public.check_in_invited_at(l, (wed + time '08:00') at time zone indy) into res;
  reset role;
  assert res = 'recorded', 'I7 an early check-in should be recorded, got ' || res;
  select count(*) into n from public.check_ins where taker_id in (lin_j, lin_m) and local_date = wed and status = 'on_time';
  assert n = 2, 'I7 both caregivers should see her on time, got ' || n;
  perform public.scheduler_tick((wed + time '10:30') at time zone indy);
  select count(*) into n from public.sends s join public.check_ins c on c.id = s.check_in_id
    where c.taker_id in (lin_j, lin_m) and c.local_date = wed;
  assert n = 0, 'I7 nothing should be sent after checking in early, got ' || n;

  -- I8: a second tap the same day
  set local role service_role;
  select public.check_in_invited_at(l, (wed + time '13:00') at time zone indy) into res;
  reset role;
  assert res = 'already', 'I8 a second tap should say already, got ' || res;

  -- I9: Thursday 10:30: inside Jordan's window and Maya's: on time for both
  perform public.scheduler_tick((thu + time '10:00') at time zone indy);
  set local role service_role;
  select public.check_in_invited_at(l, (thu + time '10:30') at time zone indy) into res;
  reset role;
  assert res = 'recorded', 'I9 should be recorded, got ' || res;
  select count(*) into n from public.check_ins where taker_id in (lin_j, lin_m) and local_date = thu and status = 'on_time' and responded_via = 'app';
  assert n = 2, 'I9 both should be on time by app, got ' || n;

  -- I10: Saturday: only Maya has Lin every day, so it counts for Maya
  set local role service_role;
  select public.check_in_invited_at(l, (sat + time '08:00') at time zone indy) into res;
  reset role;
  assert res = 'recorded', 'I10 Saturday should count for Maya, got ' || res;
  select count(*) into n from public.check_ins where taker_id = lin_j and local_date = sat;
  assert n = 0, 'I10 Saturday isn''t Jordan''s day for Lin';

  -- I11: both on a break: nothing recorded
  update public.takers set paused = true where id in (lin_j, lin_m);
  set local role service_role;
  select public.check_in_invited_at(l, ('2026-11-09'::date + time '08:00') at time zone indy) into res;
  reset role;
  assert res = 'paused', 'I11 on a break should say paused, got ' || res;
  select count(*) into n from public.check_ins where taker_id in (lin_j, lin_m) and local_date = '2026-11-09';
  assert n = 0, 'I11 nothing recorded on a break';
  update public.takers set paused = false where id in (lin_j, lin_m);

  -- I12: the app can call the "now" versions, never the ones that take a time
  set local role authenticated;
  begin
    perform public.check_in_invited_at(l, now() - interval '1 day');
    raise exception 'I12 FAIL: the app chose the time of its check-in';
  exception when insufficient_privilege then null; end;
  begin
    perform public.invited_day_at(j, now());
    raise exception 'I12 FAIL: the app read someone else''s day';
  exception when insufficient_privilege then null; end;
  select count(*) into n from public.my_invited_day();
  assert n = 2, 'I12 my_invited_day should show 2 caregivers, got ' || n;
  select public.check_in_as_invited() into res;
  assert res in ('recorded', 'already', 'nothing_open', 'not_today'), 'I12 check_in_as_invited gave ' || res;
  reset role;
  set local role anon;
  begin
    perform public.my_invited_day();
    raise exception 'I12 FAIL: signed out read a day';
  exception when insufficient_privilege then null; end;
  reset role;
end $$;

select 'ALL CHECKS PASSED' as result;

rollback;
