-- Privacy and deleting an account, for someone using Mira for themselves.
-- Rolled back at the end.
-- Run: npx supabase db query --linked -f supabase/tests/self-privacy-check.sql
-- Prints ALL CHECKS PASSED, or an error naming the failed check (P1-P6).
--
-- Ana (A) uses Mira for herself: backups Sam (said yes) and Kim (invited).
-- Bea (B) looks after Lin. Cy (C) also uses Mira for himself.

begin;

do $$
declare
  a uuid := '00000000-0000-0000-0000-00000000000a';
  b uuid := '00000000-0000-0000-0000-00000000000b';
  c uuid := '00000000-0000-0000-0000-00000000000c';
  me uuid := gen_random_uuid(); lin uuid := gen_random_uuid(); cy uuid := gen_random_uuid();
  sam uuid := gen_random_uuid(); kim uuid := gen_random_uuid();
  indy text := 'America/Indianapolis';
  n int; col text;
begin
  insert into auth.users (id, phone, aud, role) values
    (a, '13175550101', 'authenticated', 'authenticated'),
    (b, '13175550102', 'authenticated', 'authenticated'),
    (c, '13175550103', 'authenticated', 'authenticated');
  insert into public.takers (id, caregiver_id, first_name, phone, time_zone, is_self)
    values (me, a, 'Ana', '+13175550101', indy, true),
           (cy, c, 'Cy', '+13175550103', indy, true);
  insert into public.takers (id, caregiver_id, first_name, phone, time_zone, status, joined_at)
    values (lin, b, 'Lin', '+13175550161', indy, 'active', '2026-10-01');
  insert into public.backups (id, taker_id, name, phone, position, alert_after_minutes, confirmed_at) values
    (sam, me, 'Sam', '+13175550171', 1, 15, now()),
    (kim, me, 'Kim', '+13175550172', 2, 15, null);
  insert into public.backups (taker_id, name, phone, position) values (lin, 'Bo', '+13175550181', 1);
  insert into public.push_tokens (caregiver_id, token, platform) values
    (a, 'ExponentPushToken[ana-phone]', 'android'),
    (b, 'ExponentPushToken[bea-phone]', 'ios'),
    (c, 'ExponentPushToken[cy-phone]', 'android');

  -- Ana's day so far: invited Kim, missed today's check-in, Sam was alerted
  set local role service_role;
  perform public.prepare_backup_invite(a, kim, gen_random_uuid(), 'Will you be my backup?');
  reset role;
  insert into public.check_ins (taker_id, local_date, window_starts_at, window_ends_at, alert_at)
    values (me, current_date, now() - interval '3 hours', now() - interval '2 hours', now() - interval '1 hour'),
           (lin, current_date, now() - interval '3 hours', now() - interval '2 hours', now() - interval '1 hour');
  perform public.scheduler_tick(now());
  select count(*) into n from public.sends s join public.check_ins ci on ci.id = s.check_in_id
    where ci.taker_id = me and s.purpose = 'backup_alert' and s.backup_id = sam;
  assert n = 2, 'setup: Sam should have been alerted (text and call), got ' || n;

  -- P1: nobody else can see anything of Ana's: not a caregiver, not another self user
  foreach col in array array[b::text, c::text] loop
    perform set_config('request.jwt.claims', json_build_object('sub', col, 'role', 'authenticated')::text, true);
    set local role authenticated;
    select (select count(*) from public.takers where id = me)
         + (select count(*) from public.backups where taker_id = me)
         + (select count(*) from public.invites where taker_id = me)
         + (select count(*) from public.check_ins where taker_id = me)
         + (select count(*) from public.sends where caregiver_id = a)
         + (select count(*) from public.caregivers where id = a)
      into n;
    reset role;
    assert n = 0, 'P1 account ' || col || ' could see ' || n || ' of Ana''s rows';
  end loop;

  -- P2: ...or change it (the rows just aren't there for them)
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.backups set name = 'Hacked' where taker_id = me;
  update public.takers set paused = true where id = me;
  delete from public.backups where taker_id = me;
  reset role;
  select count(*) into n from public.backups where taker_id = me and name in ('Sam', 'Kim');
  assert n = 2, 'P2 another account changed or removed Ana''s backups';
  select count(*) into n from public.takers where id = me and not paused;
  assert n = 1, 'P2 another account paused Ana';

  -- P3: Mira keeps whether and when, never what was said or where anyone is:
  -- no column for a reply's words or a location in what's stored about a day
  select string_agg(table_name || '.' || column_name, ', ') into col
  from information_schema.columns
  where table_schema = 'public'
    and table_name in ('check_ins', 'sends')
    and column_name ~ '(body|reply|content|text|location|latitude|longitude|address)';
  assert col is null, 'P3 found a column that could hold words or a location: ' || coalesce(col, '');

  -- P4: deleting Ana's account removes everything that was hers
  delete from auth.users where id = a;
  select (select count(*) from public.caregivers where id = a)
       + (select count(*) from public.takers where caregiver_id = a or id = me)
       + (select count(*) from public.backups where id in (sam, kim))
       + (select count(*) from public.invites where taker_id = me)
       + (select count(*) from public.check_ins where taker_id = me)
       + (select count(*) from public.sends where caregiver_id = a or taker_id = me)
       + (select count(*) from public.push_tokens where caregiver_id = a)
    into n;
  assert n = 0, 'P4 ' || n || ' of Ana''s rows survived deleting her account';

  -- P5: ...and nothing of anyone else's
  select (select count(*) from public.takers where id in (lin, cy))
       + (select count(*) from public.backups where taker_id = lin)
       + (select count(*) from public.check_ins where taker_id = lin)
       + (select count(*) from public.push_tokens where caregiver_id in (b, c))
    into n;
  assert n = 6, 'P5 deleting Ana touched other accounts (expected 6 rows, got ' || n || ')';

  -- P6: a YES from Kim afterwards finds nothing (the invite went with Ana)
  set local role service_role;
  select count(*) into n from public.accept_backup_invites('+13175550172');
  reset role;
  assert n = 0, 'P6 a backup could still join a deleted account';
end $$;

select 'ALL CHECKS PASSED' as result;

rollback;
