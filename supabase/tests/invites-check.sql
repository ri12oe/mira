-- Invites check: prepare_invite (retries, limits, ownership) and accept_invite
-- (the YES reply). Runs in a transaction that is rolled back.
-- Run: npx supabase db query --linked -f supabase/tests/invites-check.sql
-- Prints ALL CHECKS PASSED, or an error naming the failed check (I1-I11).

begin;

do $$
declare
  a uuid := '00000000-0000-0000-0000-00000000000a';
  b uuid := '00000000-0000-0000-0000-00000000000b';
  lin uuid := '10000000-0000-0000-0000-000000000001';
  inv1 uuid := '30000000-0000-0000-0000-000000000001';
  inv2 uuid := '30000000-0000-0000-0000-000000000002';
  r record; r2 record; n int; st public.taker_status; i int; t uuid;
begin
  insert into auth.users (id, phone, aud, role) values
    (a, '13175550101', 'authenticated', 'authenticated'),
    (b, '13175550102', 'authenticated', 'authenticated');
  insert into public.takers (id, caregiver_id, first_name, phone, time_zone)
    values (lin, a, 'Lin', '+13175550123', 'America/Indianapolis');

  set local role service_role;

  -- I1: first invite
  select * into r from public.prepare_invite(a, lin, inv1, 'Hi Lin');
  assert r.to_phone = '+13175550123' and r.send_status = 'queued', 'I1 should return a queued send to Lin';
  select status into st from public.takers where id = lin;
  assert st = 'invited', 'I1 taker should be invited, is ' || st;

  -- I2: retrying the same invite doesn't make a second one
  select * into r2 from public.prepare_invite(a, lin, inv1, 'Hi Lin');
  assert r2.send_id = r.send_id, 'I2 retry should return the same send';
  select count(*) into n from public.sends where taker_id = lin;
  assert n = 1, 'I2 should still be 1 send, is ' || n;

  -- I3: a new invite cancels the old pending one
  perform public.prepare_invite(a, lin, inv2, 'Hi again');
  select count(*) into n from public.invites where taker_id = lin and status = 'pending';
  assert n = 1, 'I3 only one pending invite allowed, found ' || n;
  select count(*) into n from public.invites where id = inv1 and status = 'cancelled';
  assert n = 1, 'I3 first invite should be cancelled';

  -- I4: 3 per person per day
  perform public.prepare_invite(a, lin, gen_random_uuid(), 'Third');
  begin
    perform public.prepare_invite(a, lin, gen_random_uuid(), 'Fourth');
    raise exception 'I4 FAIL: a 4th invite to the same person was allowed';
  exception when raise_exception then
    if sqlerrm <> $m$too_many_for_taker$m$ then raise exception $m$I4 wrong error: %$m$, sqlerrm; end if;
  end;

  -- I5: another caregiver can't invite Lin
  begin
    perform public.prepare_invite(b, lin, gen_random_uuid(), 'Not mine');
    raise exception 'I5 FAIL: B invited A''s taker';
  exception when raise_exception then null; end;

  -- I6: Lin replies YES
  select count(*) into n from public.accept_invite('+13175550123');
  assert n = 1, 'I6 YES should accept 1 invite, accepted ' || n;
  select status into st from public.takers where id = lin;
  assert st = 'active', 'I6 Lin should be active, is ' || st;
  select count(*) into n from public.takers where id = lin and joined_at is not null;
  assert n = 1, 'I6 joined_at should be set';

  -- I7: a second YES does nothing
  select count(*) into n from public.accept_invite('+13175550123');
  assert n = 0, 'I7 second YES should accept nothing';

  -- I8: can't invite someone who already joined
  begin
    perform public.prepare_invite(a, lin, gen_random_uuid(), 'Again');
    raise exception 'I8 FAIL: invited an active taker';
  exception when raise_exception then
    if sqlerrm <> 'already_joined' then raise exception 'I8 wrong error: %', sqlerrm; end if;
  end;

  -- I9: 10 per caregiver per day (Lin already used 3)
  reset role;
  for i in 1..3 loop
    insert into public.takers (caregiver_id, first_name, phone, time_zone)
      values (a, 'P' || i, '+1317555014' || i, 'America/Indianapolis') returning id into t;
    set local role service_role;
    perform public.prepare_invite(a, t, gen_random_uuid(), 'x');
    if i < 3 then
      perform public.prepare_invite(a, t, gen_random_uuid(), 'x');
      perform public.prepare_invite(a, t, gen_random_uuid(), 'x');
    end if;
    reset role;
  end loop; -- Lin 3 + P1 3 + P2 3 + P3 1 = 10, the daily limit
  select count(*) into n from public.invites i join public.takers tk on tk.id = i.taker_id where tk.caregiver_id = a;
  assert n = 10, 'I9 expected exactly 10 invites before the limit, have ' || n;
  set local role service_role;
  begin
    perform public.prepare_invite(a, t, gen_random_uuid(), 'eleventh');
    raise exception 'I9 FAIL: an 11th invite today was allowed';
  exception when raise_exception then
    if sqlerrm <> 'too_many_today' then raise exception 'I9 wrong error: %', sqlerrm; end if;
  end;

  -- I10: a taker whose number changed (back to draft) can't be joined by an old invite
  reset role;
  update public.takers set status = 'draft' where id = t;
  set local role service_role;
  select count(*) into n from public.accept_invite('+13175550143');
  assert n = 0, 'I10 a draft taker should not be joined';

  -- I11: the app (signed in or not) can't call either function
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    perform public.accept_invite('+13175550123');
    raise exception 'I11 FAIL: the app could fake a YES';
  exception when insufficient_privilege then null; end;
  begin
    perform public.prepare_invite(a, lin, gen_random_uuid(), 'x');
    raise exception 'I11 FAIL: the app could call prepare_invite';
  exception when insufficient_privilege then null; end;
  reset role;
end $$;

select 'ALL CHECKS PASSED' as result;

rollback;
