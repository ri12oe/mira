-- Self flow, step 3: someone using Mira for themselves checks in with the app.
--
-- In free/test mode Mira can't really text or call, so a self user on "text"
-- or "call" would never be asked, would "miss" every day, and their backups
-- would be alerted for nothing. The app push is real, so "me" is always 'app'.
-- Same rules as 20261019182057_self_sign_in.sql, plus the method line.

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
    new.method := 'app';
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
