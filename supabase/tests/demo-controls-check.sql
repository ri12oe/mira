-- Demo controls: a demo account can fast-forward its own people's day
-- (start → reminder → caregiver alert → backups → "pretend OK"), and nobody
-- else can use them or be touched by them. Rolled back at the end.
-- Run: npx supabase db query --linked -f supabase/tests/demo-controls-check.sql
-- Prints ALL CHECKS PASSED, or an error naming the failed check (X1-X9).
--
-- People (Chicago time):
--   demo account A (in demo_accounts): Lin (text, backup Sam 15 min), Pat (paused),
--                                      Dee (no check-in today: today isn't one of her days)
--   demo account C (in demo_accounts): looks after nobody here
--   normal account B: Zed

begin;

do $$
declare
  a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); c uuid := gen_random_uuid();
  lin uuid := gen_random_uuid(); pat uuid := gen_random_uuid();
  dee uuid := gen_random_uuid(); zed uuid := gen_random_uuid();
  chi text := 'America/Chicago';
  not_today smallint := ((extract(isodow from (now() at time zone 'America/Chicago'))::int) % 7)::smallint;
  today date := (now() at time zone 'America/Chicago')::date;
  ci uuid; n int; zed_before int; msg text; is_demo boolean; result jsonb;
begin
  insert into auth.users (id, phone, aud, role) values
    (a, '13175550901', 'authenticated', 'authenticated'),
    (b, '13175550902', 'authenticated', 'authenticated'),
    (c, '13175550903', 'authenticated', 'authenticated');
  insert into public.demo_accounts (id) values (a), (c);
  insert into public.takers (id, caregiver_id, first_name, phone, time_zone, status, joined_at, paused, days) values
    (lin, a, 'Lin', '+13175550911', chi, 'active', '2026-10-01', false, '{0,1,2,3,4,5,6}'),
    (pat, a, 'Pat', '+13175550912', chi, 'active', '2026-10-01', true, '{0,1,2,3,4,5,6}'),
    (dee, a, 'Dee', '+13175550913', chi, 'active', '2026-10-01', false, array[not_today]),
    -- (no day today, so the real scheduler ticks inside this test can't make one for him)
    (zed, b, 'Zed', '+13175550914', chi, 'active', '2026-10-01', false, array[not_today]);
  insert into public.backups (taker_id, name, phone, position, alert_after_minutes)
    values (lin, 'Sam', '+13175550921', 1, 15);
  select count(*) into zed_before from public.check_ins where taker_id = zed;

  -- X1 is_demo_account: yes for A, no for B
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  is_demo := public.is_demo_account();
  reset role;
  assert is_demo, 'X1 A should be a demo account';
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  is_demo := public.is_demo_account();
  reset role;
  assert not is_demo, 'X1 B should not be a demo account';

  -- X2 start: a fresh check-in for today that opens now, and Lin is asked
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  result := public.demo_advance(lin, 'start');
  reset role;
  assert result ->> 'status' = 'pending', 'X2 today''s check-in should be pending';
  select id into ci from public.check_ins where taker_id = lin and kind = 'scheduled' and local_date = today;
  select count(*) into n from public.check_ins
  where id = ci and window_starts_at = now() and window_ends_at = now() + interval '120 minutes'
    and alert_at = now() + interval '150 minutes';
  assert n = 1, 'X2 the window should open now and keep its length (2 h + 30 min)';
  select count(*) into n from public.sends where check_in_id = ci and purpose = 'check_in_prompt' and channel = 'sms';
  assert n = 1, 'X2 Lin should be asked by text';

  -- X3 window_end: the window ends now, so the gentle reminder goes
  set local role authenticated;
  result := public.demo_advance(lin, 'window_end');
  reset role;
  select count(*) into n from public.check_ins where id = ci and window_ends_at = now() and alert_at = now() + interval '30 minutes';
  assert n = 1, 'X3 the window should end now';
  select count(*) into n from public.sends where check_in_id = ci and purpose = 'reminder';
  assert n = 1, 'X3 the reminder should be queued';

  -- X4 alert: missed, and the caregiver is alerted by text, call and push (not Sam yet)
  set local role authenticated;
  result := public.demo_advance(lin, 'alert');
  reset role;
  assert result ->> 'status' = 'missed', 'X4 it should be missed';
  select count(*) into n from public.sends where check_in_id = ci and purpose = 'caregiver_alert';
  assert n = 3, format('X4 expected 3 caregiver alerts, got %s', n);
  select count(*) into n from public.sends where check_in_id = ci and purpose = 'backup_alert';
  assert n = 0, 'X4 Sam isn''t due yet (15 minutes later)';

  -- X5 backups: Sam's 15 minutes are up, so he's alerted by text and call
  set local role authenticated;
  result := public.demo_advance(lin, 'backups');
  reset role;
  select count(*) into n from public.sends where check_in_id = ci and purpose = 'backup_alert';
  assert n = 2, format('X5 expected 2 alerts to Sam, got %s', n);
  -- and doing it again changes nothing (no double alerts)
  set local role authenticated;
  result := public.demo_advance(lin, 'backups');
  reset role;
  select count(*) into n from public.sends where check_in_id = ci and purpose in ('caregiver_alert', 'backup_alert');
  assert n = 5, 'X5 a second tap must not alert anyone twice';

  -- X6 pretend Lin texted OK: late (after the window), by text; the alerts
  --    still waiting are cancelled; a second tap says she already did
  set local role authenticated;
  result := public.demo_reply(lin);
  reset role;
  assert result ->> 'status' = 'late', 'X6 a reply after the window is late';
  select count(*) into n from public.check_ins where id = ci and responded_via = 'text' and not confirmed_by_caregiver;
  assert n = 1, 'X6 recorded as Lin''s own text reply';
  select count(*) into n from public.sends where check_in_id = ci and status = 'queued' and purpose <> 'all_clear';
  assert n = 0, 'X6 nothing but all-clears should still be waiting to send';
  set local role authenticated;
  begin perform public.demo_reply(lin); msg := 'no error'; exception when others then msg := sqlerrm; end;
  reset role;
  assert msg = 'already_checked_in', format('X6 second reply: expected already_checked_in, got %s', msg);

  -- X7 start again: back to the top of the day (old check-in and its sends gone)
  set local role authenticated;
  result := public.demo_advance(lin, 'start');
  reset role;
  select count(*) into n from public.check_ins where id = ci;
  assert n = 0, 'X7 the old check-in should be replaced';
  select count(*) into n from public.check_ins
  where taker_id = lin and kind = 'scheduled' and local_date = today and status = 'pending' and responded_at is null;
  assert n = 1, 'X7 one fresh pending check-in for today';

  -- X8 the plain errors the app shows
  set local role authenticated;
  begin perform public.demo_advance(pat, 'start'); msg := 'no error'; exception when others then msg := sqlerrm; end;
  assert msg = 'paused', format('X8 paused: got %s', msg);
  begin perform public.demo_advance(dee, 'alert'); msg := 'no error'; exception when others then msg := sqlerrm; end;
  assert msg = 'no_check_in_today', format('X8 no check-in today: got %s', msg);
  begin perform public.demo_advance(lin, 'tomorrow'); msg := 'no error'; exception when others then msg := sqlerrm; end;
  assert msg = 'unknown_step', format('X8 unknown step: got %s', msg);
  reset role;

  -- X9 nobody else: not a normal account on its own person, not a demo account
  --    on someone else's person, not another demo account, not signed out;
  --    and the demo_accounts list itself is out of reach
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin perform public.demo_advance(zed, 'alert'); msg := 'no error'; exception when others then msg := sqlerrm; end;
  assert msg = 'not_demo', format('X9 normal account on its own person: got %s', msg);
  begin perform public.demo_reply(lin); msg := 'no error'; exception when others then msg := sqlerrm; end;
  assert msg = 'not_demo', format('X9 normal account on a demo person: got %s', msg);
  begin perform count(*) from public.demo_accounts; msg := 'no error'; exception when insufficient_privilege then msg := 'denied'; end;
  assert msg = 'denied', 'X9 the app must not be able to read demo_accounts';
  begin insert into public.demo_accounts (id) values (b); msg := 'no error'; exception when insufficient_privilege then msg := 'denied'; end;
  assert msg = 'denied', 'X9 nobody can make themselves a demo account';
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin perform public.demo_advance(zed, 'start'); msg := 'no error'; exception when others then msg := sqlerrm; end;
  reset role;
  assert msg = 'not_demo', format('X9 demo account on someone else''s person: got %s', msg);

  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin perform public.demo_advance(lin, 'alert'); msg := 'no error'; exception when others then msg := sqlerrm; end;
  reset role;
  assert msg = 'not_demo', format('X9 another demo account on Lin: got %s', msg);

  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  set local role anon;
  begin perform public.demo_advance(lin, 'alert'); msg := 'no error'; exception when insufficient_privilege then msg := 'denied'; end;
  reset role;
  assert msg = 'denied', 'X9 signed out must not be able to call demo_advance';

  select count(*) into n from public.check_ins where taker_id = zed;
  assert n = zed_before, 'X9 Zed''s check-ins must not be touched by the demo';
  select count(*) into n from public.check_ins where taker_id = zed and window_starts_at = now();
  assert n = 0, 'X9 Zed''s day must not be moved';
end $$;

select 'ALL CHECKS PASSED' as result;

rollback;
