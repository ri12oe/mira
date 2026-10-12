-- Free mode (no Mira texting yet): the caregiver texts the invite from their own
-- phone, the taker replies YES to the caregiver, and the caregiver confirms it
-- in the app. This function records that confirmation.
--
-- Only the confirm-invite Edge Function calls it (service_role), and that
-- function refuses once real texting is on: then only a real YES counts.

create function public.accept_invite_for_taker(p_caregiver_id uuid, p_taker_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_found boolean;
begin
  with accepted as (
    update public.invites i
    set status = 'accepted', accepted_at = now()
    from public.takers t
    where i.taker_id = t.id
      and t.id = p_taker_id
      and t.caregiver_id = p_caregiver_id
      and t.status = 'invited'
      and i.status = 'pending'
    returning i.taker_id
  ),
  joined as (
    update public.takers t
    set status = 'active', joined_at = now()
    where t.id in (select a.taker_id from accepted a)
    returning t.id
  )
  select exists (select 1 from joined) into v_found;
  return v_found;
end;
$$;

revoke execute on function public.accept_invite_for_taker(uuid, uuid) from public, anon, authenticated;
grant execute on function public.accept_invite_for_taker(uuid, uuid) to service_role;
