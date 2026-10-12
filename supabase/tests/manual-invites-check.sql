-- Free-mode check: accept_invite_for_taker (the caregiver confirms a YES that
-- came to their own phone). Runs in a transaction that is rolled back.
-- Run: npx supabase db query --linked -f supabase/tests/manual-invites-check.sql

begin;

do $$
declare
  a uuid := '00000000-0000-0000-0000-00000000000a';
  b uuid := '00000000-0000-0000-0000-00000000000b';
  lin uuid := '10000000-0000-0000-0000-000000000001';
  ok boolean; st public.taker_status;
begin
  insert into auth.users (id, phone, aud, role) values
    (a, '13175550101', 'authenticated', 'authenticated'),
    (b, '13175550102', 'authenticated', 'authenticated');
  insert into public.takers (id, caregiver_id, first_name, phone, time_zone)
    values (lin, a, 'Lin', '+13175550123', 'America/Indianapolis');

  set local role service_role;

  -- M1: nothing to confirm before an invite exists
  ok := public.accept_invite_for_taker(a, lin);
  assert not ok, 'M1 no invite yet, should be false';

  perform public.prepare_invite(a, lin, gen_random_uuid(), 'Hi Lin');

  -- M2: another caregiver can't confirm Lin
  ok := public.accept_invite_for_taker(b, lin);
  assert not ok, 'M2 B confirmed A''s taker';
  reset role;
  select status into st from public.takers where id = lin;
  assert st = 'invited', 'M2 Lin should still be invited, is ' || st;

  -- M3: A confirms → active
  set local role service_role;
  ok := public.accept_invite_for_taker(a, lin);
  assert ok, 'M3 A should be able to confirm';
  reset role;
  select status into st from public.takers where id = lin;
  assert st = 'active', 'M3 Lin should be active, is ' || st;

  -- M4: confirming again does nothing
  set local role service_role;
  ok := public.accept_invite_for_taker(a, lin);
  assert not ok, 'M4 second confirm should be false';

  -- M5: the app can't call it directly
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    perform public.accept_invite_for_taker(a, lin);
    raise exception 'M5 FAIL: the app called it directly';
  exception when insufficient_privilege then null; end;
  reset role;
end $$;

select 'ALL CHECKS PASSED' as result;

rollback;
