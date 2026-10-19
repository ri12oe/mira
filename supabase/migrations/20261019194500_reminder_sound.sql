-- "Reminder sound" (self Settings), even when Mira is closed.
--
-- When Mira is closed the phone plays whatever sound the push asks for, so
-- the server has to know. It's kept per phone, on its push token, because:
--   * sound is about the phone you're holding, and
--   * on Android a quiet push goes through a separate "quiet" channel, and a
--     push naming a channel the phone doesn't have is NOT SHOWN AT ALL. Only
--     an app that has created that channel sends reminder_sound = false, so
--     no phone is ever sent a channel it lacks.
-- Only the daily reminder ("Time to check in", the gentle reminder) follows
-- it. Alerts about someone else always make a sound.

alter table public.push_tokens
  add column reminder_sound boolean not null default true;

-- Same as before, plus the phone's choice. Older app versions call it with
-- two arguments and get the default (sound on).
drop function public.register_push_token(text, text);

create function public.register_push_token(
  p_token text,
  p_platform text,
  p_reminder_sound boolean default true
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;
  insert into public.push_tokens (caregiver_id, token, platform, reminder_sound)
  values (auth.uid(), p_token, p_platform, coalesce(p_reminder_sound, true))
  on conflict (token) do update
    set caregiver_id = excluded.caregiver_id,
        platform = excluded.platform,
        reminder_sound = excluded.reminder_sound,
        last_seen_at = now();
end;
$$;

revoke execute on function public.register_push_token(text, text, boolean) from public, anon;
grant execute on function public.register_push_token(text, text, boolean) to authenticated;
