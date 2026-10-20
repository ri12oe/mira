-- Invited person, step 5: deleting her account.
--
-- Lin's account looks after nobody, so deleting it (delete-account) only
-- removes her own rows: her account row and her phones' push addresses. The
-- caregivers' setups for her stay, and so do her check-ins in them (they're
-- the caregivers' records).
--
-- One thing would go quietly wrong: a caregiver who chose "Mira app" for her
-- has no way left to ask her, so they'd just start getting "missed" alerts.
-- Before deleting, delete-account calls this to find those caregivers and
-- tells them (a push) to switch her to text or call.
--
-- Returns nothing for an account that isn't an invited person's (a caregiver
-- or a self user). Only the server can call it.

create function public.invited_leaving(p_account_id uuid)
returns table (caregiver_id uuid, taker_id uuid, first_name text)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_phone text;
begin
  select g.phone into v_phone from public.caregivers g where g.id = p_account_id;
  if v_phone is null
     or exists (select 1 from public.takers t where t.caregiver_id = p_account_id) then
    return;
  end if;
  return query
  select t.caregiver_id, t.id, t.first_name
  from public.takers t
  where t.phone = v_phone
    and t.status = 'active'
    and not t.is_self
    and t.method = 'app'
  order by t.caregiver_id, t.created_at;
end;
$$;

revoke execute on function public.invited_leaving(uuid) from public, anon, authenticated;
grant execute on function public.invited_leaving(uuid) to service_role;
