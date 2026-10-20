-- "Someone invited me" for backups too.
--
-- A self user's backup (Sam) gets an invite text as well, so he may download
-- Mira and tap "Someone invited me". Like the person who checks in, signing
-- in with the invited number is his YES: his pending backup invites are
-- accepted and he's confirmed (the same as replying YES, or the self user
-- tapping "Sam said yes").
--
-- join_as_invited() now says what the number is (one or both):
--   { "checks_in_for": <how many caregivers she checks in for>,
--     "backup_for":    [<first names of the people he's a backup for>] }
-- Still error not_invited if it's neither. Only a self user's backups have
-- invites; a caregiver's backups never need to say yes, so they get
-- not_invited (there's nothing for them to do in the app).

drop function public.join_as_invited();

create function public.join_as_invited()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone text := public.invited_phone_of(auth.uid());
  v_checks_in_for int;
  v_backup_for jsonb;
begin
  -- Her YES as the person who checks in, and his YES as a backup
  perform public.accept_invite(v_phone);
  perform public.accept_backup_invites(v_phone);

  select count(*) into v_checks_in_for
  from public.takers t
  where t.phone = v_phone and t.status = 'active' and not t.is_self;

  -- Who they're a confirmed backup for (first names only)
  select coalesce(jsonb_agg(distinct t.first_name), '[]'::jsonb) into v_backup_for
  from public.backups b
  join public.takers t on t.id = b.taker_id
  where b.phone = v_phone and b.confirmed_at is not null and t.is_self;

  if v_checks_in_for = 0 and jsonb_array_length(v_backup_for) = 0 then
    raise exception 'not_invited';
  end if;
  return jsonb_build_object('checks_in_for', v_checks_in_for, 'backup_for', v_backup_for);
end;
$$;

revoke execute on function public.join_as_invited() from public, anon;
grant execute on function public.join_as_invited() to authenticated;
