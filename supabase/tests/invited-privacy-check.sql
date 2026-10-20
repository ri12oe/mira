-- Privacy and deleting an account, for someone a caregiver set up (Lin).
-- Rolled back at the end.
-- Run: npx supabase db query --linked -f supabase/tests/invited-privacy-check.sql
-- Prints ALL CHECKS PASSED, or an error naming the failed check (IV1-IV8).
--
-- Jordan (J) looks after Lin (text) and Mo; Lin's backup is Sam.
-- Maya (M) also looks after Lin ("Mom", app). Lin's account is L.

begin;

do $$
declare
  j uuid := '00000000-0000-0000-0000-0000000000c1';
  m uuid := '00000000-0000-0000-0000-0000000000c2';
  l uuid := '00000000-0000-0000-0000-0000000000c3';
  lin_j uuid := gen_random_uuid(); lin_m uuid := gen_random_uuid(); mo uuid := gen_random_uuid();
  indy text := 'America/Indianapolis';
  n int; fn text; res jsonb; r record;
begin
  insert into auth.users (id, phone, aud, role) values
    (j, '13175550401', 'authenticated', 'authenticated'),
    (m, '13175550402', 'authenticated', 'authenticated');
  update public.caregivers set first_name = 'Jordan' where id = j;
  update public.caregivers set first_name = 'Maya' where id = m;
  insert into public.takers (id, caregiver_id, first_name, phone, time_zone, method)
    values (lin_j, j, 'Lin', '+13175550461', indy, 'text'),
           (lin_m, m, 'Mom', '+13175550461', indy, 'app'),
           (mo, j, 'Mo', '+13175550462', indy, 'text');
  insert into public.backups (taker_id, name, phone, position) values (lin_j, 'Sam', '+13175550471', 1);
  set local role service_role;
  perform public.prepare_invite(j, lin_j, gen_random_uuid(), 'Hi Lin');
  perform public.prepare_invite(m, lin_m, gen_random_uuid(), 'Hi Mom');
  reset role;

  -- Lin signs in from "Someone invited me" (her YES to both), on one phone
  insert into auth.users (id, phone, aud, role) values (l, '13175550461', 'authenticated', 'authenticated');
  perform set_config('request.jwt.claims', json_build_object('sub', l, 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform public.join_as_invited();
  reset role;
  insert into public.push_tokens (caregiver_id, token, platform) values (l, 'ExponentPushToken[lin-phone]', 'android');
  -- A day: missed, Jordan and Sam alerted
  insert into public.check_ins (taker_id, local_date, window_starts_at, window_ends_at, alert_at)
    select id, current_date, now() - interval '3 hours', now() - interval '2 hours', now() - interval '1 hour'
    from public.takers where id in (lin_j, lin_m, mo);
  perform public.scheduler_tick(now());

  -- IV1: Lin can't see any of her caregivers' rows: not herself as their
  -- person, not Mo, backups, invites, check-ins, sends, or the caregivers
  set local role authenticated;
  select (select count(*) from public.takers)
       + (select count(*) from public.backups)
       + (select count(*) from public.invites)
       + (select count(*) from public.check_ins)
       + (select count(*) from public.sends)
       + (select count(*) from public.caregivers where id <> l)
    into n;
  reset role;
  assert n = 0, 'IV1 Lin could see ' || n || ' of her caregivers'' rows';

  -- IV2: ...or change them (the rows just aren't there for her)
  set local role authenticated;
  update public.takers set paused = true where id in (lin_j, lin_m);
  update public.backups set name = 'Hacked' where taker_id = lin_j;
  begin
    delete from public.check_ins where taker_id in (lin_j, lin_m);
  exception when insufficient_privilege then
    null; -- even better: the app can't delete check-ins at all
  end;
  reset role;
  select count(*) into n from public.takers where id in (lin_j, lin_m) and paused;
  assert n = 0, 'IV2 Lin paused her own check-ins';
  select count(*) into n from public.backups where taker_id = lin_j and name = 'Sam';
  assert n = 1, 'IV2 Lin changed Jordan''s backup';
  select count(*) into n from public.check_ins where taker_id in (lin_j, lin_m);
  assert n = 2, 'IV2 Lin deleted check-ins';

  -- IV3: her day says only whether, when, and who to call: nothing about
  -- backups, other people, invites, messages or where anyone is
  fn := pg_get_function_result('public.my_invited_day()'::regprocedure);
  assert fn !~* '(backup|invite|message|body|location|latitude|longitude|reply|alert)',
    'IV3 my_invited_day shares too much: ' || fn;
  set local role authenticated;
  select count(*) into n from public.my_invited_day();
  reset role;
  assert n = 2, 'IV3 Lin should see 2 days (Jordan''s and Maya''s), not Mo''s, got ' || n;

  -- IV4: the server-only functions stay server-only
  set local role authenticated;
  foreach fn in array array[
    'select public.invited_phone_of(''' || j || ''')',
    'select * from public.invited_day_at(''' || j || ''', now())',
    'select public.check_in_invited_at(''' || l || ''', now())',
    'select * from public.invited_leaving(''' || l || ''')',
    'select public.invited_push_targets(gen_random_uuid())'
  ] loop
    begin
      execute fn;
      raise exception 'IV4 FAIL: an app user could run: %', fn;
    exception when insufficient_privilege then
      null;
    end;
  end loop;
  reset role;

  -- IV5: who to tell when she leaves: only Maya (she chose Mira app); and
  -- nothing for a caregiver's own account
  select count(*) into n from public.invited_leaving(l);
  assert n = 1, 'IV5 only Maya should be told, got ' || n;
  select * into r from public.invited_leaving(l);
  assert r.caregiver_id = m and r.taker_id = lin_m, 'IV5 should tell Maya about her person';
  select count(*) into n from public.invited_leaving(j);
  assert n = 0, 'IV5 a caregiver''s account isn''t an invited person''s';

  -- IV6: deleting Lin's account (what delete-account does) removes only her own rows
  delete from auth.users where id = l;
  select count(*) into n from public.caregivers where id = l;
  assert n = 0, 'IV6 Lin''s account row should be gone';
  select count(*) into n from public.push_tokens where caregiver_id = l;
  assert n = 0, 'IV6 Lin''s phone should be forgotten';
  select count(*) into n from public.takers where id in (lin_j, lin_m) and status = 'active';
  assert n = 2, 'IV6 the caregivers'' setups for Lin must stay joined, got ' || n;
  select count(*) into n from public.takers where id = mo;
  assert n = 1, 'IV6 Jordan''s other person must stay';
  select count(*) into n from public.check_ins where taker_id in (lin_j, lin_m);
  assert n = 2, 'IV6 the caregivers'' check-ins must stay';
  select count(*) into n from public.backups where taker_id = lin_j;
  assert n = 1, 'IV6 Jordan''s backup for Lin must stay';
  select count(*) into n from public.sends s where s.caregiver_id in (j, m);
  assert n > 0, 'IV6 the caregivers'' alerts log must stay';

  -- IV7: the app asks now have nobody to go to (logged as failed, not sent)
  select count(*) into n from public.caregivers where phone = '+13175550461';
  assert n = 0, 'IV7 no account should have Lin''s number any more';

  -- IV8: she can come back: signing in again joins both caregivers again
  insert into auth.users (id, phone, aud, role) values (l, '13175550461', 'authenticated', 'authenticated');
  set local role authenticated;
  res := public.join_as_invited();
  reset role;
  assert (res ->> 'checks_in_for')::int = 2, 'IV8 Lin should be able to come back, got ' || res;
end $$;

select 'ALL CHECKS PASSED' as result;

rollback;
