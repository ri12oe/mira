-- Backup invites for someone using Mira for themselves: recorded with a send,
-- limited, confirmed by "said yes" (free mode) or a YES text (live), undone
-- by a new number. Runs in a transaction that is rolled back.
-- Run: npx supabase db query --linked -f supabase/tests/backup-invites-check.sql
-- Prints ALL CHECKS PASSED, or an error naming the failed check (B1-B11).

begin;

do $$
declare
  a uuid := '00000000-0000-0000-0000-00000000000a';  -- uses Mira for themselves
  b uuid := '00000000-0000-0000-0000-00000000000b';  -- a caregiver
  me uuid := gen_random_uuid(); lin uuid := gen_random_uuid();
  sam uuid := gen_random_uuid(); kim uuid := gen_random_uuid();
  lee uuid := gen_random_uuid(); bo uuid := gen_random_uuid();
  i1 uuid := gen_random_uuid(); i2 uuid := gen_random_uuid();
  i3 uuid := gen_random_uuid(); i4 uuid := gen_random_uuid();
  ik uuid := gen_random_uuid(); il uuid := gen_random_uuid();
  indy text := 'America/Indianapolis';
  r record; n int; ok boolean; st text; ph text; s1 uuid;
begin
  insert into auth.users (id, phone, aud, role) values
    (a, '13175550101', 'authenticated', 'authenticated'),
    (b, '13175550102', 'authenticated', 'authenticated');

  insert into public.takers (id, caregiver_id, first_name, phone, time_zone, is_self)
    values (me, a, 'Ana', '+13175550101', indy, true);
  insert into public.takers (id, caregiver_id, first_name, phone, time_zone)
    values (lin, b, 'Lin', '+13175550161', indy);
  insert into public.backups (id, taker_id, name, phone, position) values
    (sam, me, 'Sam', '+13175550171', 1),
    (kim, me, 'Kim', '+13175550172', 2),
    (lee, me, 'Lee', '+13175550175', 3),
    (bo, lin, 'Bo', '+13175550181', 1);

  set local role service_role;

  -- B1: an invite is recorded with one queued text to the backup's number
  select * into r from public.prepare_backup_invite(a, sam, i1, 'Will you be my backup?');
  s1 := r.send_id;
  assert r.to_phone = '+13175550171' and r.send_status = 'queued', 'B1 wrong send: ' || r.to_phone || '/' || r.send_status;
  select count(*) into n from public.invites where id = i1 and backup_id = sam and taker_id = me and status = 'pending';
  assert n = 1, 'B1 the backup invite should be recorded as pending';

  -- B2: the same invite again (a retry) gives back the same send, nothing new
  select * into r from public.prepare_backup_invite(a, sam, i1, 'Will you be my backup?');
  assert r.send_id = s1, 'B2 a retry should return the same send';
  select count(*) into n from public.sends where invite_id = i1;
  assert n = 1, 'B2 a retry must not add a second text';

  -- B3: a caregiver's backups don't get invites (they don't need to say yes)
  begin
    perform public.prepare_backup_invite(b, bo, gen_random_uuid(), 'Hi');
    raise exception 'B3 FAIL: invited a caregiver''s backup';
  exception when raise_exception then
    if sqlerrm <> 'not_found' then raise exception 'B3 wrong error: %', sqlerrm; end if;
  end;

  -- B4: nobody can invite someone else's backup
  begin
    perform public.prepare_backup_invite(b, sam, gen_random_uuid(), 'Hi');
    raise exception 'B4 FAIL: invited another account''s backup';
  exception when raise_exception then
    if sqlerrm <> 'not_found' then raise exception 'B4 wrong error: %', sqlerrm; end if;
  end;

  -- B5: a new invite replaces the pending one
  perform public.prepare_backup_invite(a, sam, i2, 'Again');
  select status::text into st from public.invites where id = i1;
  assert st = 'cancelled', 'B5 the older invite should be cancelled, is ' || st;

  -- B6: at most 3 invites a day per backup
  perform public.prepare_backup_invite(a, sam, i3, 'Third');
  begin
    perform public.prepare_backup_invite(a, sam, i4, 'Fourth');
    raise exception 'B6 FAIL: a 4th invite was allowed';
  exception when raise_exception then
    if sqlerrm <> 'too_many_for_taker' then raise exception 'B6 wrong error: %', sqlerrm; end if;
  end;

  -- B7: "Sam said yes" works only for the owner, once
  select public.accept_backup_invite_for(b, sam) into ok;
  assert not ok, 'B7 another account confirmed Sam';
  select public.accept_backup_invite_for(a, sam) into ok;
  assert ok, 'B7 the owner should be able to confirm Sam';
  select count(*) into n from public.backups where id = sam and confirmed_at is not null;
  assert n = 1, 'B7 Sam should be confirmed';
  select status::text into st from public.invites where id = i3;
  assert st = 'accepted', 'B7 the invite should be accepted, is ' || st;
  select public.accept_backup_invite_for(a, sam) into ok;
  assert not ok, 'B7 confirming twice should report nothing to confirm';
  select public.accept_backup_invite_for(a, kim) into ok;
  assert not ok, 'B7 Kim has no invite, so there''s nothing to confirm';

  -- B8: no invite for someone who already said yes
  begin
    perform public.prepare_backup_invite(a, sam, gen_random_uuid(), 'Hi');
    raise exception 'B8 FAIL: invited a confirmed backup';
  exception when raise_exception then
    if sqlerrm <> 'already_joined' then raise exception 'B8 wrong error: %', sqlerrm; end if;
  end;

  -- B9: a new number un-confirms (Sam) and cancels a pending invite (Kim)
  perform public.prepare_backup_invite(a, kim, ik, 'Hi Kim');
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.backups set phone = '+13175550179' where id = sam;
  update public.backups set phone = '+13175550178' where id = kim;
  reset role;
  select count(*) into n from public.backups where id = sam and confirmed_at is null;
  assert n = 1, 'B9 a new number should clear Sam''s yes';
  select status::text into st from public.invites where id = ik;
  assert st = 'cancelled', 'B9 Kim''s invite went to the old number and should be cancelled, is ' || st;

  -- B10: live mode, a YES from Lee's number confirms Lee and says whose backup
  set local role service_role;
  perform public.prepare_backup_invite(a, lee, il, 'Hi Lee');
  perform public.prepare_invite(b, lin, gen_random_uuid(), 'Hi Lin');
  select count(*) into n from public.accept_backup_invites('+13175550175') x
    where x.owner_id = a and x.backup_name = 'Lee' and x.owner_name = 'Ana';
  assert n = 1, 'B10 a YES from Lee should confirm Lee and name Ana';
  select count(*) into n from public.accept_backup_invites('+13175550161');
  assert n = 0, 'B10 a taker''s YES must not confirm any backup';
  reset role;
  select count(*) into n from public.backups where id = lee and confirmed_at is not null;
  assert n = 1, 'B10 Lee should be confirmed';
  select status::text into st from public.takers where id = lin;
  assert st = 'invited', 'B10 Lin''s own invite should be untouched, is ' || st;

  -- B11: the app itself can't call any of these (only Edge Functions can)
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    perform public.accept_backup_invite_for(a, kim);
    raise exception 'B11 FAIL: the app confirmed a backup directly';
  exception when insufficient_privilege then null; end;
  begin
    perform public.prepare_backup_invite(a, kim, gen_random_uuid(), 'Hi');
    raise exception 'B11 FAIL: the app recorded an invite directly';
  exception when insufficient_privilege then null; end;
  begin
    perform public.accept_backup_invites('+13175550178');
    raise exception 'B11 FAIL: the app accepted invites directly';
  exception when insufficient_privilege then null; end;
  reset role;
end $$;

select 'ALL CHECKS PASSED' as result;

rollback;
