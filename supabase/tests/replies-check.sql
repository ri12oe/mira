-- Replies check: on time vs late, replies by phone (two caregivers), the
-- press-1 call, and the caregiver's "checked in" button. Rolled back at the end.
-- Run: npx supabase db query --linked -f supabase/tests/replies-check.sql
-- Prints ALL CHECKS PASSED, or an error naming the failed check (R1-R9).

begin;

do $$
declare
  a uuid := '00000000-0000-0000-0000-00000000000a';
  b uuid := '00000000-0000-0000-0000-00000000000b';
  lin uuid := gen_random_uuid(); lin_b uuid := gen_random_uuid(); pat uuid := gen_random_uuid();
  indy text := 'America/Indianapolis';
  lin_phone text := '+13175550161';
  n int; st text; via text; by_cg boolean; ci uuid; send uuid; res text;
begin
  insert into auth.users (id, phone, aud, role) values
    (a, '13175550101', 'authenticated', 'authenticated'),
    (b, '13175550102', 'authenticated', 'authenticated');
  update public.caregivers set first_name = 'Sarah' where id = a;
  -- Lin is looked after by A and (same phone) by B
  insert into public.takers (id, caregiver_id, first_name, phone, time_zone, status, joined_at) values
    (lin,   a, 'Lin', lin_phone,      indy, 'active', '2026-10-01'),
    (lin_b, b, 'Lin', lin_phone,      indy, 'active', '2026-10-01'),
    (pat,   a, 'Pat', '+13175550163', indy, 'active', '2026-10-01');

  -- R1: "OK" by text at 9:30 counts for both caregivers' Lin, on time
  perform public.scheduler_tick(('2026-10-14'::date + time '09:00') at time zone indy);
  select count(*) into n from public.record_check_in_by_phone(lin_phone, 'text', ('2026-10-14'::date + time '09:30') at time zone indy);
  assert n = 2, 'R1 both caregivers'' Lin should be recorded, got ' || n;
  select count(*) into n from public.check_ins where taker_id in (lin, lin_b) and status = 'on_time' and responded_via = 'text';
  assert n = 2, 'R1 both on time by text, got ' || n;

  -- R2: after the window but before alerts → late
  perform public.scheduler_tick(('2026-10-15'::date + time '09:00') at time zone indy);
  perform public.record_check_in(lin, 'text', false, ('2026-10-15'::date + time '11:10') at time zone indy);
  select status::text into st from public.check_ins where taker_id = lin and local_date = '2026-10-15';
  assert st = 'late', 'R2 11:10 should be late, is ' || st;

  -- R3: after alerts went out (missed) → late too
  perform public.scheduler_tick(('2026-10-16'::date + time '09:00') at time zone indy);
  perform public.scheduler_tick(('2026-10-16'::date + time '11:30') at time zone indy);
  select status::text into st from public.check_ins where taker_id = lin and local_date = '2026-10-16';
  assert st = 'missed', 'R3 should be missed first, is ' || st;
  perform public.record_check_in(lin, 'text', false, ('2026-10-16'::date + time '11:40') at time zone indy);
  select status::text into st from public.check_ins where taker_id = lin and local_date = '2026-10-16';
  assert st = 'late', 'R3 a check-in after alerts should be late, is ' || st;

  -- R4: before the window opens, nothing is open
  n := public.record_check_in(lin, 'text', false, ('2026-10-17'::date + time '08:30') at time zone indy);
  assert n = 0, 'R4 nothing should be recorded before 9:00';
  select count(*) into n from public.record_check_in_by_phone('+13175559999', 'text');
  assert n = 0, 'R4 an unknown number records nothing';

  -- R5: a paused (skipped) day can't be checked in
  perform public.scheduler_tick(('2026-10-17'::date + time '09:00') at time zone indy);
  update public.takers set paused = true where id = pat;
  perform public.scheduler_tick(('2026-10-17'::date + time '09:01') at time zone indy);
  n := public.record_check_in(pat, 'text', false, ('2026-10-17'::date + time '09:05') at time zone indy);
  select status::text into st from public.check_ins where taker_id = pat and local_date = '2026-10-17';
  assert n = 0 and st = 'skipped', 'R5 skipped day should stay skipped, is ' || st;

  -- R6: press 1 on a prompt call counts; a text send id doesn't
  update public.takers set method = 'call' where id = lin;
  perform public.scheduler_tick(('2026-10-18'::date + time '09:00') at time zone indy);
  select s.id into send from public.sends s join public.check_ins c on c.id = s.check_in_id
    where c.taker_id = lin and c.local_date = '2026-10-18' and s.purpose = 'check_in_prompt';
  n := public.record_call_answer(send, ('2026-10-18'::date + time '09:02') at time zone indy);
  select status::text, responded_via::text into st, via from public.check_ins where taker_id = lin and local_date = '2026-10-18';
  assert n = 1 and st = 'on_time' and via = 'call', 'R6 press 1 → on time by call, got ' || st || '/' || coalesce(via, 'null');
  select s.id into send from public.sends s join public.check_ins c on c.id = s.check_in_id
    where c.taker_id = lin_b and c.local_date = '2026-10-18' and s.purpose = 'check_in_prompt'; -- B's Lin gets texts
  assert public.record_call_answer(send) = 0, 'R6 a text send can''t be answered by pressing 1';

  -- R7: the caregiver taps "Lin checked in" (a check-in open right now)
  insert into public.check_ins (taker_id, local_date, window_starts_at, window_ends_at, alert_at)
    values (lin, current_date + 30, now() - interval '1 hour', now() + interval '1 hour', now() + interval '2 hours')
    returning id into ci;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  res := public.mark_checked_in(lin);
  assert res = 'recorded', 'R7 should be recorded, got ' || res;
  res := public.mark_checked_in(lin);
  assert res = 'nothing_open', 'R7 second tap: nothing open, got ' || res;
  reset role;
  select responded_via::text, confirmed_by_caregiver, status::text into via, by_cg, st from public.check_ins where id = ci;
  assert via = 'app' and by_cg and st = 'on_time', 'R7 recorded as confirmed by the caregiver';

  -- R8: another caregiver can't mark Lin (A's) as checked in
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    perform public.mark_checked_in(lin);
    raise exception 'R8 FAIL: B marked A''s taker';
  exception when raise_exception then
    if sqlerrm <> 'not_found' then raise exception 'R8 wrong error: %', sqlerrm; end if;
  end;

  -- R9: the app can't call the server-only functions
  begin
    perform public.record_check_in(lin, 'text');
    raise exception 'R9 FAIL: the app recorded a check-in directly';
  exception when insufficient_privilege then null; end;
  reset role;
  set local role anon;
  begin
    perform public.mark_checked_in(lin);
    raise exception 'R9 FAIL: signed-out user called mark_checked_in';
  exception when insufficient_privilege then null; end;
  reset role;
end $$;

select 'ALL CHECKS PASSED' as result;

rollback;
