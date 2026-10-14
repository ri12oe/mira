-- Check in now: starting (with its rules), only-you alerts, chosen contacts,
-- cancelling, answering, and the caregiver's own words. Rolled back at the end.
-- Run: npx supabase db query --linked -f supabase/tests/check-in-now-check.sql
-- Prints ALL CHECKS PASSED, or an error naming the failed check (N1-N9).

begin;

do $$
declare
  a uuid := '00000000-0000-0000-0000-00000000000a';
  b uuid := '00000000-0000-0000-0000-00000000000b';
  lin uuid := gen_random_uuid(); mo uuid := gen_random_uuid(); pat uuid := gen_random_uuid();
  ola uuid := gen_random_uuid(); ivy uuid := gen_random_uuid(); zed uuid := gen_random_uuid();
  indy text := 'America/Indianapolis';
  id1 uuid; id2 uuid; n int; st text; ok boolean; msg text;
begin
  insert into auth.users (id, phone, aud, role) values
    (a, '13175550101', 'authenticated', 'authenticated'),
    (b, '13175550102', 'authenticated', 'authenticated');
  insert into public.takers (id, caregiver_id, first_name, phone, time_zone, status, joined_at, paused) values
    (lin, a, 'Lin', '+13175550161', indy, 'active', '2026-10-01', false),
    (mo,  a, 'Mo',  '+13175550162', indy, 'active', '2026-10-01', false),
    (pat, a, 'Pat', '+13175550163', indy, 'active', '2026-10-01', false),
    (ola, a, 'Ola', '+13175550164', indy, 'active', '2026-10-01', false),
    (ivy, a, 'Ivy', '+13175550165', indy, 'invited', null, false),
    (zed, b, 'Zed', '+13175550166', indy, 'active', '2026-10-01', true);
  insert into public.backups (taker_id, name, phone, position, alert_after_minutes)
    values (lin, 'Sam', '+13175550171', 1, 15);

  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- N1: start for Lin (defaults: 15 minutes, only you): prompt queued right away
  id1 := public.start_check_in_now(lin, 'text');
  reset role;
  select count(*) into n from public.check_ins where id = id1 and kind = 'on_demand'
    and alert_at = now() + interval '15 minutes' and status = 'pending';
  assert n = 1, 'N1 an on-demand check-in alerting in 15 minutes';
  select count(*) into n from public.sends where check_in_id = id1 and purpose = 'check_in_prompt' and channel = 'sms';
  assert n = 1, 'N1 the text prompt is queued right away';

  -- N2: starting again while it's waiting returns the same one
  set local role authenticated;
  id2 := public.start_check_in_now(lin, 'call');
  assert id2 = id1, 'N2 should return the one already waiting';

  -- N3: the rules
  begin perform public.start_check_in_now(ivy, 'text'); raise exception 'N3 FAIL ivy';
  exception when raise_exception then if sqlerrm <> 'not_joined' then raise exception 'N3 ivy: %', sqlerrm; end if; end;
  begin perform public.start_check_in_now(zed, 'text'); raise exception 'N3 FAIL zed';
  exception when raise_exception then if sqlerrm <> 'not_found' then raise exception 'N3 zed (B''s): %', sqlerrm; end if; end;
  begin perform public.start_check_in_now(mo, 'text', 0); raise exception 'N3 FAIL wait';
  exception when raise_exception then if sqlerrm <> 'bad_wait' then raise exception 'N3 wait: %', sqlerrm; end if; end;
  begin perform public.start_check_in_now(mo, 'text', 15, null, '[{"name":"X","phone":"555","alert_after_minutes":5}]');
    raise exception 'N3 FAIL contacts';
  exception when raise_exception then if sqlerrm <> 'bad_contacts' then raise exception 'N3 contacts: %', sqlerrm; end if; end;
  reset role;

  -- N4: no answer after 15 min: only the caregiver is alerted (not Lin's saved backup), no reminder
  perform public.scheduler_tick(now() + interval '16 minutes');
  select status::text into st from public.check_ins where id = id1;
  assert st = 'missed', 'N4 should be missed, is ' || st;
  select count(*) into n from public.sends where check_in_id = id1 and purpose = 'caregiver_alert';
  assert n = 3, 'N4 caregiver text + call + push, got ' || n;
  select count(*) into n from public.sends where check_in_id = id1 and purpose in ('backup_alert', 'reminder');
  perform public.scheduler_tick(now() + interval '60 minutes');
  select count(*) into n from public.sends where check_in_id = id1 and purpose in ('backup_alert', 'reminder');
  assert n = 0, 'N4 no backups and no reminder for Check in now, got ' || n;

  -- N5: Mo with a chosen contact (a neighbour, 10 min after you), waiting 20 min
  set local role authenticated;
  id2 := public.start_check_in_now(mo, 'text', 20, null,
    '[{"name":"Neighbor","phone":"+13175550181","alert_after_minutes":10}]');
  reset role;
  perform public.scheduler_tick(now() + interval '20 minutes');
  select count(*) into n from public.sends where check_in_id = id2 and purpose = 'caregiver_alert';
  assert n = 3, 'N5 caregiver alerted at 20 min, got ' || n;
  perform public.scheduler_tick(now() + interval '29 minutes');
  select count(*) into n from public.sends where check_in_id = id2 and purpose = 'backup_alert';
  assert n = 0, 'N5 neighbour not before 30 min';
  perform public.scheduler_tick(now() + interval '30 minutes');
  perform public.scheduler_tick(now() + interval '30 minutes');
  select count(*) into n from public.sends where check_in_id = id2 and purpose = 'backup_alert' and to_phone = '+13175550181';
  assert n = 2, 'N5 neighbour gets text + call once at 30 min, got ' || n;

  -- N6: Pat's check-in is cancelled: no alerts, prompt cancelled; cancelling again does nothing
  set local role authenticated;
  id2 := public.start_check_in_now(pat, 'text');
  ok := public.cancel_check_in_now(id2);
  assert ok, 'N6 cancel should work';
  ok := public.cancel_check_in_now(id2);
  assert not ok, 'N6 second cancel does nothing';
  reset role;
  select status::text into st from public.check_ins where id = id2;
  assert st = 'skipped', 'N6 cancelled check-in is skipped, is ' || st;
  select status::text into st from public.sends where check_in_id = id2 and purpose = 'check_in_prompt';
  assert st = 'cancelled', 'N6 its prompt is cancelled, is ' || st;
  perform public.scheduler_tick(now() + interval '30 minutes');
  select count(*) into n from public.sends where check_in_id = id2 and purpose = 'caregiver_alert';
  assert n = 0, 'N6 nobody alerted for a cancelled check-in';

  -- N7: B can't cancel A's check-in
  set local role authenticated;
  id2 := public.start_check_in_now(ola, 'call', 15, 'Hi Ola, it''s Sarah. Press 1 if you''re okay.');
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  ok := public.cancel_check_in_now(id2);
  assert not ok, 'N7 B cancelled A''s check-in';
  reset role;

  -- N8: the caregiver's own words reach delivery
  select x.prompt_message into msg from public.claim_due_sends(500) x
    join public.sends s on s.id = x.send_id where s.check_in_id = id2;
  assert msg = 'Hi Ola, it''s Sarah. Press 1 if you''re okay.', 'N8 prompt_message should reach delivery, got ' || coalesce(msg, 'null');

  -- N9: Ola answers within the wait → on time, and nobody is alerted
  perform public.record_check_in(ola, 'call', false, now() + interval '5 minutes');
  select status::text into st from public.check_ins where id = id2;
  assert st = 'on_time', 'N9 answering in time is on time, is ' || st;
  perform public.scheduler_tick(now() + interval '30 minutes');
  select count(*) into n from public.sends where check_in_id = id2 and purpose = 'caregiver_alert';
  assert n = 0, 'N9 nobody alerted after Ola answered';
end $$;

select 'ALL CHECKS PASSED' as result;

rollback;
