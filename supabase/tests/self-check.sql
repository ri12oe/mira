-- Self flow schema: a self taker is the account holder; backups are confirmed
-- only by the server; backup invites and taker invites don't affect each
-- other. Runs in a transaction that is rolled back.
-- Run: npx supabase db query --linked -f supabase/tests/self-check.sql
-- Prints ALL CHECKS PASSED, or an error naming the failed check (S1-S10).

begin;

do $$
declare
  a uuid := '00000000-0000-0000-0000-00000000000a';
  nophone uuid := '00000000-0000-0000-0000-00000000000c';
  me uuid := gen_random_uuid(); lin uuid := gen_random_uuid();
  sam uuid := gen_random_uuid(); k1 uuid := gen_random_uuid();
  indy text := 'America/Indianapolis';
  r record; n int; st text; ph text;
begin
  insert into auth.users (id, phone, aud, role) values
    (a, '13175550101', 'authenticated', 'authenticated'),
    (nophone, null, 'authenticated', 'authenticated');

  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- S1: "this is me": the phone becomes the verified sign-in number, active right away
  insert into public.takers (id, first_name, phone, time_zone, is_self)
    values (me, 'Ana', '+19995550000', indy, true);
  select phone, status::text into ph, st from public.takers where id = me;
  assert ph = '+13175550101', 'S1 a self taker''s phone must be the account''s own number, got ' || ph;
  assert st = 'active', 'S1 a self taker is active straight away, is ' || st;

  -- S2: only one "me" per account
  begin
    insert into public.takers (first_name, phone, time_zone, is_self) values ('Ana2', '+13175550199', indy, true);
    raise exception 'S2 FAIL: a second self taker was allowed';
  exception when unique_violation then null; end;

  -- S3: the flag can't be switched afterwards (the app has no permission to)
  begin
    update public.takers set is_self = false where id = me;
    raise exception 'S3 FAIL: the app changed is_self';
  exception when insufficient_privilege then null; end;

  -- S4: changing a self taker's phone keeps their own number and keeps them joined
  update public.takers set phone = '+13175550142' where id = me;
  select phone, status::text into ph, st from public.takers where id = me;
  assert ph = '+13175550101' and st = 'active', 'S4 self taker should keep own number and stay active, got ' || ph || '/' || st;

  -- S5: a normal taker is unchanged: draft until they say yes
  insert into public.takers (id, first_name, phone, time_zone) values (lin, 'Lin', '+13175550161', indy);
  select status::text into st from public.takers where id = lin;
  assert st = 'draft', 'S5 a normal taker starts as draft, is ' || st;

  -- S6: backups: the app can add one, but can't mark it confirmed
  insert into public.backups (id, taker_id, name, phone, position) values (sam, me, 'Sam', '+13175550171', 1);
  begin
    update public.backups set confirmed_at = now() where id = sam;
    raise exception 'S6 FAIL: the app confirmed a backup';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.backups (taker_id, name, phone, position, confirmed_at) values (me, 'X', '+13175550172', 2, now());
    raise exception 'S6 FAIL: the app added a pre-confirmed backup';
  exception when insufficient_privilege then null; end;
  reset role;

  -- S7: the server confirms Sam; a new number for Sam clears it
  update public.backups set confirmed_at = now() where id = sam;
  set local role authenticated;
  update public.backups set phone = '+13175550173' where id = sam;
  reset role;
  select count(*) into n from public.backups where id = sam and confirmed_at is null;
  assert n = 1, 'S7 a backup''s new number must clear confirmed_at';

  -- S8: save_taker (the app's auto-save) still works with backups
  set local role authenticated;
  perform public.save_taker(
    jsonb_build_object('id', lin, 'first_name', 'Lin', 'phone', '+13175550161', 'caregiver_relationship', '',
      'method', 'text', 'time_zone', indy, 'window_start', 540, 'window_end', 660, 'days', '[0,1,2,3,4,5,6]'::jsonb,
      'extra_minutes', 30, 'paused', false),
    jsonb_build_array(jsonb_build_object('id', k1, 'name', 'Bo', 'phone', '+13175550181', 'relationship', '', 'alert_after_minutes', 15)));
  reset role;
  select count(*) into n from public.backups where taker_id = lin and id = k1;
  assert n = 1, 'S8 save_taker should still save backups';

  -- S9: a backup invite and a taker invite don't affect each other
  insert into public.invites (taker_id, backup_id, message) values (me, sam, 'Will you be my backup?');
  set local role service_role;
  perform public.prepare_invite(a, lin, gen_random_uuid(), 'Hi Lin');
  reset role;
  select count(*) into n from public.invites where backup_id = sam and status = 'pending';
  assert n = 1, 'S9 inviting a taker must not cancel a backup invite';
  update public.takers set status = 'invited' where id = me; -- even if "me" looked invited…
  set local role service_role;
  select count(*) into n from public.accept_invite('+13175550101');
  reset role;
  assert n = 0, 'S9 a YES from the self user''s number must not accept a backup invite';

  -- S10: no verified phone → can't create "me"
  perform set_config('request.jwt.claims', json_build_object('sub', nophone, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    insert into public.takers (first_name, phone, time_zone, is_self) values ('Nobody', '+13175550190', indy, true);
    raise exception 'S10 FAIL: self taker without a verified phone';
  exception when raise_exception then
    if sqlerrm <> 'no_verified_phone' then raise exception 'S10 wrong error: %', sqlerrm; end if;
  end;
  reset role;
end $$;

select 'ALL CHECKS PASSED' as result;

rollback;
