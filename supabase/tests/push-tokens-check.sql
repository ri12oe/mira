-- Push tokens: each caregiver sees only their own phones; a phone that changes
-- hands moves to the new caregiver. Rolled back at the end.
-- Run: npx supabase db query --linked -f supabase/tests/push-tokens-check.sql

begin;

do $$
declare
  a uuid := '00000000-0000-0000-0000-00000000000a';
  b uuid := '00000000-0000-0000-0000-00000000000b';
  tok text := 'ExponentPushToken[test-phone-1]';
  n int; owner uuid;
begin
  insert into auth.users (id, phone, aud, role) values
    (a, '13175550101', 'authenticated', 'authenticated'),
    (b, '13175550102', 'authenticated', 'authenticated');

  -- P1: A turns on alerts on a phone
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform public.register_push_token(tok, 'android');
  perform public.register_push_token(tok, 'android'); -- again: no duplicate
  select count(*) into n from public.push_tokens;
  assert n = 1, 'P1 A sees exactly 1 phone, saw ' || n;

  -- P2: B can't see A's phone
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  select count(*) into n from public.push_tokens;
  assert n = 0, 'P2 B should see no phones, saw ' || n;

  -- P3: B signs in on the same phone: it moves to B (A stops getting alerts there)
  perform public.register_push_token(tok, 'android');
  reset role;
  select caregiver_id into owner from public.push_tokens where token = tok;
  assert owner = b, 'P3 the phone should now belong to B';

  -- P4: not a push token → rejected
  set local role authenticated;
  begin
    perform public.register_push_token('not-a-token', 'android');
    raise exception 'P4 FAIL: bad token accepted';
  exception when check_violation then null; end;

  -- P5: B can't move it to someone else by writing caregiver_id directly
  begin
    update public.push_tokens set caregiver_id = a where token = tok;
    raise exception 'P5 FAIL: changed the owner directly';
  exception when insufficient_privilege then null; end;
  reset role;

  -- P6: signed out can't register
  set local role anon;
  begin
    perform public.register_push_token(tok, 'android');
    raise exception 'P6 FAIL: anon registered a phone';
  exception when insufficient_privilege then null; end;
  reset role;

  -- P7: an older app (two arguments) gets reminder sound on
  select count(*) into n from public.push_tokens where token = tok and reminder_sound;
  assert n = 1, 'P7 reminder sound should default to on';

  -- P8: the phone turns the reminder sound off, then on again
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform public.register_push_token(tok, 'android', false);
  reset role;
  select count(*) into n from public.push_tokens where token = tok and not reminder_sound;
  assert n = 1, 'P8 reminder sound should be off';
  set local role authenticated;
  perform public.register_push_token(tok, 'android', true);
  reset role;
  select count(*) into n from public.push_tokens where token = tok and reminder_sound;
  assert n = 1, 'P8 reminder sound should be back on';

  -- P9: the app can't flip it any other way (only by registering its own phone)
  set local role authenticated;
  begin
    update public.push_tokens set reminder_sound = false where token = tok;
    raise exception 'P9 FAIL: changed reminder_sound directly';
  exception when insufficient_privilege then null; end;
  reset role;
end $$;

select 'ALL CHECKS PASSED' as result;

rollback;
