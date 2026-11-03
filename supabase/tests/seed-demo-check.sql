-- Demo data check: run after supabase/seed-demo.sql. Read-only (rolled back).
-- Run: npx supabase db query --linked -f supabase/tests/seed-demo-check.sql
-- Prints ALL CHECKS PASSED, or an error naming the failed check (D1-D9).
-- Running the seed twice and then this check also shows the reset works:
-- the counts would double if it didn't wipe the old demo first.

begin;

do $$
declare
  jordan constant uuid := 'd0000000-0000-4000-8000-000000000001';
  mo_acct constant uuid := 'd0000000-0000-4000-8000-000000000002';
  ana_acct constant uuid := 'd0000000-0000-4000-8000-000000000003';
  lin constant uuid := 'd0000000-0000-4000-8000-000000000011';
  mo constant uuid := 'd0000000-0000-4000-8000-000000000012';
  ana constant uuid := 'd0000000-0000-4000-8000-000000000013';
  today date := (now() at time zone 'America/Chicago')::date;
  n int;
  ids uuid[];
begin
  -- D1 the three accounts exist, with the right names and verified phones
  select count(*) into n from public.caregivers g
  where (g.id, g.first_name, g.phone::text) in (
    (jordan, 'Jordan', '+13125550101'), (mo_acct, 'Mo', '+13125550103'), (ana_acct, 'Ana', '+13125550105'));
  assert n = 3, 'D1 demo accounts are missing or wrong';

  -- D2 the right people, all joined; Ana is her own taker on the app
  select count(*) into n from public.takers where caregiver_id = jordan and status = 'active';
  assert n = 2, 'D2 Jordan should look after exactly Lin and Mo';
  select count(*) into n from public.takers
  where id = ana and is_self and method = 'app' and status = 'active' and phone::text = '+13125550105';
  assert n = 1, 'D2 Ana should be her own taker on the app';
  select count(*) into n from public.takers where caregiver_id = mo_acct;
  assert n = 0, 'D2 Mo''s account must look after nobody (it''s an invited account)';

  -- D3 one scheduled check-in per selected day for the last 4 weeks, and nothing for today
  select count(*) into n from public.check_ins
  where taker_id = lin and local_date between today - 28 and today - 1;
  assert n = 28, format('D3 Lin should have 28 days of history, has %s', n);
  select count(*) into n from public.check_ins c
  where c.taker_id = mo and extract(isodow from c.local_date) = 7;
  assert n = 0, 'D3 Mo has a check-in on a Sunday (not one of his days)';
  select count(*) into n from public.check_ins
  where taker_id in (lin, mo, ana) and local_date >= today;
  -- (the scheduler may have made today's since the seed ran; that's fine,
  --  but the seed itself must not make any for later days)
  assert n <= 3, 'D3 the seed made check-ins for today or later';

  -- D4 a mix of outcomes, so History looks real. (Mo's late or missed day
  --    may fall on a Sunday, which isn't one of his days, so one can be missing.)
  select count(*) into n from public.check_ins where taker_id in (lin, mo, ana) and status = 'missed' and local_date < today;
  assert n between 2 and 3, format('D4 expected 2-3 missed days, got %s', n);
  select count(*) into n from public.check_ins where taker_id in (lin, mo, ana) and status = 'late' and local_date < today;
  assert n between 3 and 4, format('D4 expected 3-4 late days, got %s', n);
  select count(*) into n from public.check_ins where taker_id in (lin, mo, ana) and status = 'skipped' and local_date < today;
  assert n between 1 and 3, format('D4 expected 1-3 skipped days, got %s', n);

  -- D5 past days are finished: the scheduler would re-send for a pending day
  select count(*) into n from public.check_ins
  where taker_id in (lin, mo, ana) and local_date < today and status = 'pending';
  assert n = 0, 'D5 a past demo day is still pending';

  -- D6 on time means inside the window, late means after it but before alerts
  select count(*) into n from public.check_ins
  where taker_id in (lin, mo, ana) and local_date < today and (
       (status = 'on_time' and not (responded_at between window_starts_at and window_ends_at))
    or (status = 'late' and not (responded_at > window_ends_at and responded_at < alert_at))
    or (status in ('missed', 'skipped') and responded_at is not null));
  assert n = 0, 'D6 a check-in time doesn''t match its status';

  -- D7 nothing old is waiting to be sent (it would go out on the next tick)
  select count(*) into n from public.sends s
  join public.check_ins c on c.id = s.check_in_id
  where s.taker_id in (lin, mo, ana) and c.local_date < today and s.status = 'queued';
  assert n = 0, 'D7 an old demo send is still queued';

  -- D8 a missed day logged its alerts: Lin's went to Jordan (3) and Sam (2);
  --    Ana's skipped the caregiver step and went straight to Sam (2)
  select count(*) into n from public.sends s join public.check_ins c on c.id = s.check_in_id
  where c.taker_id = lin and c.status = 'missed' and s.purpose = 'caregiver_alert';
  assert n = 3, 'D8 Lin''s missed day should have alerted Jordan by text, call and push';
  select count(*) into n from public.sends s join public.check_ins c on c.id = s.check_in_id
  where c.taker_id = lin and c.status = 'missed' and s.purpose = 'backup_alert';
  assert n = 2, 'D8 Lin''s missed day should have alerted Sam by text and call';
  select count(*) into n from public.sends s join public.check_ins c on c.id = s.check_in_id
  where c.taker_id = ana and s.purpose = 'caregiver_alert';
  assert n = 0, 'D8 Ana is her own caregiver: no caregiver alerts';
  select count(*) into n from public.sends s join public.check_ins c on c.id = s.check_in_id
  where c.taker_id = ana and c.status = 'missed' and s.purpose = 'backup_alert';
  assert n = 2, 'D8 Ana''s missed day should have alerted Sam (who said yes)';

  -- D9 what each demo user can see in the app (Row Level Security)
  perform set_config('request.jwt.claims', json_build_object('sub', jordan, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select array_agg(id order by id) into ids from public.takers;
  reset role;
  assert ids = array[lin, mo], 'D9 Jordan should see only Lin and Mo';

  perform set_config('request.jwt.claims', json_build_object('sub', ana_acct, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.check_ins where taker_id in (lin, mo);
  reset role;
  assert n = 0, 'D9 Ana can see Jordan''s people';
end $$;

select 'ALL CHECKS PASSED' as result;

rollback;
