-- save_taker: saves one taker and their whole backup list in ONE transaction.
--
-- The app sends the full person every time (not just what changed), so this is
-- safe to retry, and a failure part-way leaves nothing half-written: backups
-- are who gets alerted, so a half-saved alert order would be a real problem.
--
-- It runs with the caller's own permissions (security invoker), so the RLS
-- policies and column grants from the initial schema still apply: a caregiver
-- can only save their own takers, and can't set status/joined_at this way.
--
-- p_taker:   { id, first_name, phone, caregiver_relationship, method, time_zone,
--              window_start, window_end, days, extra_minutes, paused }
-- p_backups: [ { id, name, phone, relationship, alert_after_minutes }, … ]
--            in alert order (position 1 = first after the caregiver)

create function public.save_taker(p_taker jsonb, p_backups jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_taker_id uuid := (p_taker ->> 'id')::uuid;
begin
  insert into public.takers (
    id, first_name, phone, caregiver_relationship, method, time_zone,
    window_start, window_end, days, extra_minutes, paused
  )
  values (
    v_taker_id,
    p_taker ->> 'first_name',
    (p_taker ->> 'phone')::public.phone_e164,
    nullif(p_taker ->> 'caregiver_relationship', ''),
    (p_taker ->> 'method')::public.check_in_method,
    p_taker ->> 'time_zone',
    (p_taker ->> 'window_start')::smallint,
    (p_taker ->> 'window_end')::smallint,
    array(select jsonb_array_elements_text(p_taker -> 'days')::smallint),
    (p_taker ->> 'extra_minutes')::smallint,
    (p_taker ->> 'paused')::boolean
  )
  on conflict (id) do update set
    first_name = excluded.first_name,
    phone = excluded.phone,
    caregiver_relationship = excluded.caregiver_relationship,
    method = excluded.method,
    time_zone = excluded.time_zone,
    window_start = excluded.window_start,
    window_end = excluded.window_end,
    days = excluded.days,
    extra_minutes = excluded.extra_minutes,
    paused = excluded.paused;

  -- Backups that are no longer in the list were removed by the caregiver
  delete from public.backups b
  where b.taker_id = v_taker_id
    and b.id not in (
      select (item ->> 'id')::uuid from jsonb_array_elements(p_backups) item
    );

  -- Add new ones and update the rest; list order becomes alert order
  insert into public.backups (
    id, taker_id, name, phone, relationship, position, alert_after_minutes
  )
  select
    (item ->> 'id')::uuid,
    v_taker_id,
    item ->> 'name',
    (item ->> 'phone')::public.phone_e164,
    nullif(item ->> 'relationship', ''),
    ord::smallint,
    (item ->> 'alert_after_minutes')::smallint
  from jsonb_array_elements(p_backups) with ordinality as list (item, ord)
  on conflict (id) do update set
    name = excluded.name,
    phone = excluded.phone,
    relationship = excluded.relationship,
    position = excluded.position,
    alert_after_minutes = excluded.alert_after_minutes;
end;
$$;

revoke execute on function public.save_taker(jsonb, jsonb) from public, anon;
grant execute on function public.save_taker(jsonb, jsonb) to authenticated;
