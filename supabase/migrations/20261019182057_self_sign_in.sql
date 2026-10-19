-- Self flow, step 2: signing in as someone using Mira for themselves.
--
-- The end of self setup saves the "me" taker through save_taker, and that row
-- is how the app knows, on every later sign-in, to open the self Home.


-- ---------------------------------------------------------------- one account type per number
-- An account either looks after other people OR is someone's own Mira, never
-- both (so a self user's backups and a caregiver's alerts can't get mixed up).
-- Same rules as before, plus the account_type_mismatch check on insert.

create or replace function public.takers_self_rules()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_phone text;
begin
  if tg_op = 'UPDATE' and new.is_self is distinct from old.is_self then
    raise exception 'cannot_change_is_self';
  end if;
  -- (t.id <> new.id: save_taker's upsert runs this insert check even when the
  -- row already exists, and it mustn't trip over itself)
  if tg_op = 'INSERT' and exists (
    select 1 from public.takers t
    where t.caregiver_id = new.caregiver_id
      and t.id <> new.id
      and t.is_self is distinct from new.is_self
  ) then
    raise exception 'account_type_mismatch';
  end if;
  if new.is_self then
    select g.phone into v_phone from public.caregivers g where g.id = new.caregiver_id;
    if v_phone is null then
      raise exception 'no_verified_phone';
    end if;
    new.phone := v_phone;
    if tg_op = 'INSERT' then
      new.status := 'active';
      new.joined_at := now();
    else
      -- (the phone-change trigger may have run first; a self taker stays joined)
      new.status := old.status;
      new.joined_at := old.joined_at;
    end if;
  end if;
  return new;
end;
$$;


-- ---------------------------------------------------------------- save_taker learns is_self
-- p_taker may now include is_self (default false). It's only used when the
-- taker is first created; after that it can't change.

create or replace function public.save_taker(p_taker jsonb, p_backups jsonb)
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
    window_start, window_end, days, extra_minutes, paused, is_self
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
    (p_taker ->> 'paused')::boolean,
    coalesce((p_taker ->> 'is_self')::boolean, false)
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
