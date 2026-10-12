-- Security check: signs in as two fake caregivers and tries what they shouldn't
-- be able to do. Runs inside a transaction that is rolled back, so nothing is kept.
-- Run: npx supabase db query --linked -f supabase/tests/security-check.sql
-- Prints ALL CHECKS PASSED, or an error naming the failed check (T1-T13).

begin;

do $$
declare
  a uuid := '00000000-0000-0000-0000-00000000000a';
  b uuid := '00000000-0000-0000-0000-00000000000b';
  a_taker uuid; b_taker uuid; n int; st public.taker_status; ph text;
begin
  -- Setup as admin: two sign-ups, one taker + check-in for B
  insert into auth.users (id, phone, aud, role) values
    (a, '13175550101', 'authenticated', 'authenticated'),
    (b, '13175550102', 'authenticated', 'authenticated');
  select phone into ph from public.caregivers where id = a;
  assert ph = '+13175550101', 'T1 sign-up trigger should create caregiver with +phone, got ' || coalesce(ph,'null');

  insert into public.takers (caregiver_id, first_name, phone, time_zone)
    values (b, 'Mom', '+13175550199', 'America/Indianapolis') returning id into b_taker;
  insert into public.check_ins (taker_id, local_date, window_starts_at, window_ends_at, alert_at)
    values (b_taker, current_date, now(), now(), now());

  -- Act as caregiver A
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;

  insert into public.takers (first_name, phone, time_zone)
    values ('Lin', '+13175550123', 'America/Indianapolis') returning id into a_taker;
  select count(*) into n from public.takers;
  assert n = 1, 'T2 A should see only own taker, saw ' || n;
  select count(*) into n from public.caregivers;
  assert n = 1, 'T3 A should see only own caregiver row, saw ' || n;
  select count(*) into n from public.check_ins;
  assert n = 0, 'T4 A should not see B''s check-ins, saw ' || n;

  update public.takers set first_name = 'Hacked' where id = b_taker;
  get diagnostics n = row_count;
  assert n = 0, 'T5 A should not update B''s taker';

  begin
    update public.takers set status = 'active' where id = a_taker;
    raise exception 'T6 FAIL: A could mark taker active';
  exception when insufficient_privilege then null; end;

  begin
    insert into public.takers (caregiver_id, first_name, phone, time_zone)
      values (b, 'Sneaky', '+13175550177', 'America/Indianapolis');
    raise exception 'T7 FAIL: A could add taker to B';
  exception when insufficient_privilege then null; end;

  begin
    insert into public.backups (taker_id, name, phone, position) values (b_taker, 'X', '+13175550111', 1);
    raise exception 'T8 FAIL: A could add backup to B''s taker';
  exception when insufficient_privilege then null; end;

  begin
    insert into public.check_ins (taker_id, local_date, window_starts_at, window_ends_at, alert_at)
      values (a_taker, current_date, now(), now(), now());
    raise exception 'T9 FAIL: A could fake a check-in';
  exception when insufficient_privilege then null; end;

  begin
    insert into public.takers (first_name, phone, time_zone) values ('Bad', '317-555', 'America/Indianapolis');
    raise exception 'T10 FAIL: bad phone accepted';
  exception when check_violation then null; end;

  begin
    insert into public.takers (first_name, phone, time_zone) values ('Bad', '+13175550144', 'Mars/Base');
    raise exception 'T11 FAIL: bad time zone accepted';
  exception when check_violation then null; end;

  -- Backups: add two, then swap their order
  insert into public.backups (taker_id, name, phone, position) values
    (a_taker, 'Sam', '+13175550131', 1), (a_taker, 'Ana', '+13175550132', 2);
  update public.backups set position = 2 where taker_id = a_taker and name = 'Sam';
  update public.backups set position = 1 where taker_id = a_taker and name = 'Ana';
  set constraints all immediate; -- force the order check now
  set constraints all deferred;

  -- Phone change resets a joined taker to draft
  reset role;
  update public.takers set status = 'active', joined_at = now() where id = a_taker;
  set local role authenticated;
  update public.takers set phone = '+13175550124' where id = a_taker;
  reset role;
  select status into st from public.takers where id = a_taker;
  assert st = 'draft', 'T12 phone change should reset to draft, got ' || st;

  -- Not signed in at all
  set local role anon;
  begin
    perform 1 from public.takers;
    raise exception 'T13 FAIL: anon could read takers';
  exception when insufficient_privilege then null; end;
  reset role;

  raise notice 'ALL CHECKS PASSED';
end $$;
select 'ALL CHECKS PASSED' as result;

rollback;
