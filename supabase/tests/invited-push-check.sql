-- Invited push check: when a caregiver chose "Mira app" for Lin, her ask and
-- reminder go to the phone where she signed in (invited_push_targets).
-- Replays Wednesday 4 November 2026. Rolled back at the end.
-- Run: npx supabase db query --linked -f supabase/tests/invited-push-check.sql
-- Prints ALL CHECKS PASSED, or an error naming the failed check (IP1-IP9).
--
-- Jordan (J) and Maya (M) both look after Lin (app, 10:00-12:00). Jordan
-- calls her "Lin", Maya calls her "Mom". Rae (Jordan's) is asked by text.
-- Lin's account L only exists from IP2 on.

begin;

do $$
declare
  j uuid := '00000000-0000-0000-0000-0000000000b1';
  m uuid := '00000000-0000-0000-0000-0000000000b2';
  l uuid := '00000000-0000-0000-0000-0000000000b3';
  lin_j uuid := gen_random_uuid(); lin_m uuid := gen_random_uuid(); rae uuid := gen_random_uuid();
  day date := '2026-11-04';
  indy text := 'America/Indianapolis';
  p_j uuid; p_m uuid; r_j uuid; alert uuid; rae_prompt uuid;
  t jsonb; t2 jsonb; n int;
begin
  insert into auth.users (id, phone, aud, role) values
    (j, '13175550301', 'authenticated', 'authenticated'),
    (m, '13175550302', 'authenticated', 'authenticated');
  update public.caregivers set first_name = 'Jordan' where id = j;
  update public.caregivers set first_name = 'Maya' where id = m;
  insert into public.takers (id, caregiver_id, first_name, phone, time_zone, method, window_start, window_end, status, joined_at)
    values (lin_j, j, 'Lin', '+13175550361', indy, 'app', 600, 720, 'active', '2026-10-01'),
           (lin_m, m, 'Mom', '+13175550361', indy, 'app', 600, 720, 'active', '2026-10-01'),
           (rae, j, 'Rae', '+13175550362', indy, 'text', 600, 720, 'active', '2026-10-01');

  -- 10:00: both caregivers' asks are queued as pushes
  perform public.scheduler_tick((day + time '10:00') at time zone indy);
  select s.id into p_j from public.sends s where s.taker_id = lin_j and s.purpose = 'check_in_prompt';
  select s.id into p_m from public.sends s where s.taker_id = lin_m and s.purpose = 'check_in_prompt';
  select s.id into rae_prompt from public.sends s where s.taker_id = rae and s.purpose = 'check_in_prompt';
  assert p_j is not null and p_m is not null, 'setup: both of Lin''s asks should be queued';

  -- IP1: Lin hasn't signed in anywhere yet: nobody to push to
  t := public.invited_push_targets(p_j);
  assert t -> 'accounts' = '[]'::jsonb, 'IP1 no account yet, got ' || (t -> 'accounts');

  -- IP2: she signs in ("Someone invited me"): her account is the one
  insert into auth.users (id, phone, aud, role) values (l, '13175550361', 'authenticated', 'authenticated');
  t := public.invited_push_targets(p_j);
  assert t -> 'accounts' = jsonb_build_array(l), 'IP2 Lin''s account should get it, got ' || (t -> 'accounts');

  -- IP3: the name on her Home (Jordan's "Lin", not Maya's "Mom"), and both caregivers
  assert t ->> 'name' = 'Lin', 'IP3 should call her Lin, got ' || coalesce(t ->> 'name', 'null');
  assert t -> 'caregivers' = '["Jordan", "Maya"]'::jsonb, 'IP3 should tell Jordan and Maya, got ' || (t -> 'caregivers');
  t2 := public.invited_push_targets(p_m);
  assert t2 ->> 'name' = 'Lin', 'IP3 Maya''s ask should also say Lin, got ' || coalesce(t2 ->> 'name', 'null');

  -- IP4: two asks at once: exactly one of them buzzes her phone
  n := (case when (t ->> 'duplicate')::boolean then 1 else 0 end)
     + (case when (t2 ->> 'duplicate')::boolean then 1 else 0 end);
  assert n = 1, 'IP4 exactly one of the two asks should be the duplicate, got ' || n;

  -- IP5: asks 20 minutes apart both buzz (the second is a fresh nudge)
  update public.sends set created_at = created_at + interval '20 minutes'
  where id = (case when (t ->> 'duplicate')::boolean then p_j else p_m end);
  assert not (public.invited_push_targets(p_j) ->> 'duplicate')::boolean
     and not (public.invited_push_targets(p_m) ->> 'duplicate')::boolean,
    'IP5 asks 20 minutes apart should both go out';
  update public.sends set created_at = created_at - interval '20 minutes'
  where id = (case when (t ->> 'duplicate')::boolean then p_j else p_m end);

  -- IP6: Jordan pauses Lin: his ask is cancelled, so Maya's must go out,
  -- and the push only names Maya
  update public.takers set paused = true where id = lin_j;
  perform public.scheduler_tick((day + time '10:01') at time zone indy);
  t := public.invited_push_targets(p_m);
  assert not (t ->> 'duplicate')::boolean, 'IP6 Maya''s ask must not be skipped for Jordan''s cancelled one';
  assert t -> 'caregivers' = '["Maya"]'::jsonb, 'IP6 should only name Maya now, got ' || (t -> 'caregivers');
  update public.takers set paused = false where id = lin_j;

  -- IP7: 12:00, Maya's reminder goes to Lin's account too
  perform public.scheduler_tick((day + time '12:00') at time zone indy);
  select s.id into r_j from public.sends s where s.taker_id = lin_m and s.purpose = 'reminder';
  assert r_j is not null, 'IP7 Maya''s reminder should be queued';
  t := public.invited_push_targets(r_j);
  assert t -> 'accounts' = jsonb_build_array(l), 'IP7 the reminder should go to Lin''s account, got ' || (t -> 'accounts');

  -- IP8: never for anything else: an alert to Maya, or Rae's text
  perform public.scheduler_tick((day + time '12:30') at time zone indy);
  select s.id into alert from public.sends s where s.taker_id = lin_m and s.purpose = 'caregiver_alert' limit 1;
  assert alert is not null, 'IP8 setup: Maya should be alerted at 12:30';
  assert public.invited_push_targets(alert) -> 'accounts' = '[]'::jsonb, 'IP8 an alert must not go to Lin';
  -- Rae is a different number: Lin's account is never hers
  assert not (public.invited_push_targets(rae_prompt) -> 'accounts' @> jsonb_build_array(l)),
    'IP8 Rae''s ask must not go to Lin';

  -- IP9: only the server can ask
  perform set_config('request.jwt.claims', json_build_object('sub', l, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    perform public.invited_push_targets(p_j);
    raise exception 'IP9 FAIL: an app user could read push targets';
  exception when insufficient_privilege then
    null;
  end;
  reset role;
end $$;

select 'ALL CHECKS PASSED' as result;

rollback;
