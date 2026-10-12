-- save_taker check: saves, reorders and removes backups, and proves a failed
-- save changes nothing. Runs in a transaction that is rolled back.
-- Run: npx supabase db query --linked -f supabase/tests/save-taker-check.sql
-- Prints ALL CHECKS PASSED, or an error naming the failed check (S1-S8).

begin;

do $$
declare
  a uuid := '00000000-0000-0000-0000-00000000000a';
  b uuid := '00000000-0000-0000-0000-00000000000b';
  t uuid := '10000000-0000-0000-0000-000000000001';
  b_taker uuid := '10000000-0000-0000-0000-000000000002';
  k1 uuid := '20000000-0000-0000-0000-000000000001';
  k2 uuid := '20000000-0000-0000-0000-000000000002';
  taker jsonb;
  n int; nm text; st public.taker_status;
begin
  insert into auth.users (id, phone, aud, role) values
    (a, '13175550101', 'authenticated', 'authenticated'),
    (b, '13175550102', 'authenticated', 'authenticated');
  insert into public.takers (id, caregiver_id, first_name, phone, time_zone)
    values (b_taker, b, 'Mom', '+13175550199', 'America/Indianapolis');

  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;

  taker := jsonb_build_object('id', t, 'first_name', 'Lin', 'phone', '+13175550123',
    'caregiver_relationship', 'Daughter', 'method', 'text', 'time_zone', 'America/Indianapolis',
    'window_start', 540, 'window_end', 660, 'days', '[0,1,2,3,4]'::jsonb,
    'extra_minutes', 30, 'paused', false);

  -- S1: new taker with two backups
  perform public.save_taker(taker, jsonb_build_array(
    jsonb_build_object('id', k1, 'name', 'Sam', 'phone', '+13175550131', 'relationship', 'Son', 'alert_after_minutes', 15),
    jsonb_build_object('id', k2, 'name', 'Ana', 'phone', '+13175550132', 'relationship', '', 'alert_after_minutes', 60)));
  select count(*) into n from public.takers where id = t and caregiver_id = a and days = '{0,1,2,3,4}';
  assert n = 1, 'S1 taker should be saved to A with weekdays';
  select name into nm from public.backups where taker_id = t and position = 1;
  assert nm = 'Sam', 'S1 Sam should be first, got ' || coalesce(nm, 'null');

  -- S2: swap the order and rename one
  perform public.save_taker(taker, jsonb_build_array(
    jsonb_build_object('id', k2, 'name', 'Anna', 'phone', '+13175550132', 'relationship', '', 'alert_after_minutes', 60),
    jsonb_build_object('id', k1, 'name', 'Sam', 'phone', '+13175550131', 'relationship', 'Son', 'alert_after_minutes', 15)));
  select name into nm from public.backups where taker_id = t and position = 1;
  assert nm = 'Anna', 'S2 Anna should now be first, got ' || coalesce(nm, 'null');

  -- S3: remove one
  perform public.save_taker(taker, jsonb_build_array(
    jsonb_build_object('id', k1, 'name', 'Sam', 'phone', '+13175550131', 'relationship', 'Son', 'alert_after_minutes', 15)));
  select count(*) into n from public.backups where taker_id = t;
  assert n = 1, 'S3 should have 1 backup left, has ' || n;
  select count(*) into n from public.backups where taker_id = t and id = k1 and position = 1;
  assert n = 1, 'S3 Sam should be first';

  -- S4: a bad backup phone fails the WHOLE save (the name change is undone too)
  begin
    perform public.save_taker(taker || '{"first_name": "Changed"}', jsonb_build_array(
      jsonb_build_object('id', k1, 'name', 'Sam', 'phone', '555', 'relationship', '', 'alert_after_minutes', 15)));
    raise exception 'S4 FAIL: bad phone accepted';
  exception when check_violation then null; end;
  select first_name into nm from public.takers where id = t;
  assert nm = 'Lin', 'S4 failed save should change nothing, name is ' || nm;

  -- S5: can't overwrite someone else's taker
  begin
    perform public.save_taker(taker || jsonb_build_object('id', b_taker), '[]'::jsonb);
    raise exception 'S5 FAIL: A overwrote B''s taker';
  exception when insufficient_privilege then null; end;

  -- S6: saving settings keeps a joined taker joined
  reset role;
  update public.takers set status = 'active', joined_at = now() where id = t;
  set local role authenticated;
  perform public.save_taker(taker || '{"paused": true}', '[]'::jsonb);
  reset role;
  select status into st from public.takers where id = t;
  assert st = 'active', 'S6 settings save should keep status active, got ' || st;

  -- S7: ...but a new phone number goes back to draft
  set local role authenticated;
  perform public.save_taker(taker || '{"phone": "+13175550124"}', '[]'::jsonb);
  reset role;
  select status into st from public.takers where id = t;
  assert st = 'draft', 'S7 phone change should reset to draft, got ' || st;

  -- S8: not signed in can't call it at all
  set local role anon;
  begin
    perform public.save_taker(taker, '[]'::jsonb);
    raise exception 'S8 FAIL: anon could call save_taker';
  exception when insufficient_privilege then null; end;
  reset role;
end $$;

select 'ALL CHECKS PASSED' as result;

rollback;
