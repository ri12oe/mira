-- Removing a person and deleting an account: everything that belongs to them
-- goes, and nothing else. Runs in a transaction that is rolled back.
-- Run: npx supabase db query --linked -f supabase/tests/delete-check.sql

begin;

do $$
declare
  a uuid := '00000000-0000-0000-0000-00000000000a';
  b uuid := '00000000-0000-0000-0000-00000000000b';
  lin uuid := gen_random_uuid(); mo uuid := gen_random_uuid(); zed uuid := gen_random_uuid();
  indy text := 'America/Indianapolis';
  n int;
begin
  insert into auth.users (id, phone, aud, role) values
    (a, '13175550101', 'authenticated', 'authenticated'),
    (b, '13175550102', 'authenticated', 'authenticated');
  insert into public.takers (id, caregiver_id, first_name, phone, time_zone, status, joined_at) values
    (lin, a, 'Lin', '+13175550161', indy, 'invited', null),
    (mo,  a, 'Mo',  '+13175550162', indy, 'active', '2026-10-01'),
    (zed, b, 'Zed', '+13175550163', indy, 'active', '2026-10-01');
  insert into public.backups (taker_id, name, phone, position) values
    (lin, 'Sam', '+13175550171', 1), (mo, 'Ana', '+13175550172', 1), (zed, 'Bo', '+13175550173', 1);
  set local role service_role;
  perform public.prepare_invite(a, lin, gen_random_uuid(), 'Hi Lin');
  reset role;
  -- give everyone a check-in and some sends
  insert into public.check_ins (taker_id, local_date, window_starts_at, window_ends_at, alert_at)
    select id, current_date, now(), now() + interval '1 hour', now() + interval '2 hours' from public.takers where id in (lin, mo, zed);
  perform public.scheduler_tick(now() + interval '1 minute');
  insert into public.push_tokens (caregiver_id, token, platform) values
    (a, 'ExponentPushToken[delete-test-a]', 'android'), (b, 'ExponentPushToken[delete-test-b]', 'android');

  -- D1: A removes Lin (through the app's own permissions)
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  delete from public.takers where id = lin;
  reset role;
  select (select count(*) from public.backups where taker_id = lin)
       + (select count(*) from public.invites where taker_id = lin)
       + (select count(*) from public.check_ins where taker_id = lin)
       + (select count(*) from public.sends where taker_id = lin) into n;
  assert n = 0, 'D1 Lin''s backups, invites, check-ins and sends should all be gone, ' || n || ' left';
  select count(*) into n from public.takers where id in (mo, zed);
  assert n = 2, 'D1 Mo and Zed must be untouched';
  select count(*) into n from public.backups where taker_id = mo;
  assert n = 1, 'D1 Mo''s backup must be untouched';

  -- D2: B can't remove A's person
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  delete from public.takers where id = mo;
  get diagnostics n = row_count;
  assert n = 0, 'D2 B removed A''s person';
  reset role;

  -- D3: deleting A's account removes everything of A's
  delete from auth.users where id = a;
  select (select count(*) from public.caregivers where id = a)
       + (select count(*) from public.takers where caregiver_id = a)
       + (select count(*) from public.backups where taker_id = mo)
       + (select count(*) from public.check_ins where taker_id = mo)
       + (select count(*) from public.sends where caregiver_id = a)
       + (select count(*) from public.push_tokens where caregiver_id = a) into n;
  assert n = 0, 'D3 all of A''s data should be gone, ' || n || ' rows left';

  -- D4: ...and nothing of B's
  select (select count(*) from public.caregivers where id = b)
       + (select count(*) from public.takers where caregiver_id = b)
       + (select count(*) from public.backups where taker_id = zed)
       + (select count(*) from public.push_tokens where caregiver_id = b) into n;
  assert n = 4, 'D4 B''s data must be untouched, found ' || n || ' of 4';
end $$;

select 'ALL CHECKS PASSED' as result;

rollback;
