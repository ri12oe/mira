-- Invited person, step 4: when a caregiver chose "Mira app" for Lin, the
-- daily ask and the reminder are pushes to HER phone(s), the ones where she
-- signed in from "Someone invited me". (Before, they were only logged.)
--
-- deliver-sends asks this function, for one prompt/reminder send:
--   accounts    Lin's own accounts: verified phone = her number, and they
--               look after nobody (one account type per person)
--   name        what to call her: the same name her Home shows (the first
--               caregiver's, by name), so a push never says "Hi Mom!"
--   caregivers  the first names of everyone one tap will tell
--   duplicate   another caregiver's ask for the same thing went (or is
--               going) to her number in the last 10 minutes, so her phone
--               shouldn't buzz twice: one "I'm okay" answers both
--
-- Only the server can call it.

create function public.invited_push_targets(p_send_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  s public.sends%rowtype;
  t public.takers%rowtype;
  v_kind public.check_in_kind;
  v_accounts jsonb;
  v_caregivers jsonb;
  v_name text;
  v_duplicate boolean;
begin
  select * into s from public.sends where id = p_send_id;
  if not found then
    raise exception 'send_not_found';
  end if;
  select * into t from public.takers where id = s.taker_id;
  if not found or t.is_self or s.purpose not in ('check_in_prompt', 'reminder') then
    return jsonb_build_object('accounts', '[]'::jsonb, 'caregivers', '[]'::jsonb, 'name', null, 'duplicate', false);
  end if;
  select c.kind into v_kind from public.check_ins c where c.id = s.check_in_id;

  select coalesce(jsonb_agg(g.id order by g.id), '[]'::jsonb) into v_accounts
  from public.caregivers g
  where g.phone = t.phone
    and not exists (select 1 from public.takers o where o.caregiver_id = g.id);

  select coalesce(jsonb_agg(x.caregiver order by x.caregiver), '[]'::jsonb) into v_caregivers
  from (
    select distinct trim(g.first_name) as caregiver
    from public.takers o
    join public.caregivers g on g.id = o.caregiver_id
    where o.phone = t.phone and o.status = 'active' and not o.is_self and not o.paused
      and coalesce(trim(g.first_name), '') <> ''
  ) x;

  select nullif(trim(o.first_name), '') into v_name
  from public.takers o
  join public.caregivers g on g.id = o.caregiver_id
  where o.phone = t.phone and o.status = 'active' and not o.is_self
  order by g.first_name, o.created_at
  limit 1;

  -- Daily asks only ("Check in now" is one caregiver asking right now).
  -- Exactly one of two asks at the same time is the one that buzzes: the
  -- earlier (then by id). Not one that's been cancelled, or whose day was
  -- skipped (that caregiver paused her), since it won't go out.
  v_duplicate := v_kind = 'scheduled' and exists (
    select 1
    from public.sends o
    join public.takers ot on ot.id = o.taker_id
    join public.check_ins oc on oc.id = o.check_in_id
    where o.id <> s.id
      and ot.phone = t.phone and not ot.is_self and not ot.paused
      and o.purpose = s.purpose and o.channel = 'push'
      and oc.kind = 'scheduled' and oc.status <> 'skipped'
      and o.status in ('queued', 'sent', 'delivered')
      and o.created_at > s.created_at - interval '10 minutes'
      and (o.created_at, o.id) < (s.created_at, s.id)
  );

  return jsonb_build_object(
    'accounts', v_accounts,
    'caregivers', v_caregivers,
    'name', v_name,
    'duplicate', coalesce(v_duplicate, false)
  );
end;
$$;

revoke execute on function public.invited_push_targets(uuid) from public, anon, authenticated;
grant execute on function public.invited_push_targets(uuid) to service_role;
