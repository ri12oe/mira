-- Home updates live: when a check-in is recorded, missed, or an alert goes out,
-- the caregiver's Home screen refreshes by itself. Realtime respects RLS, so a
-- caregiver only hears about their own people.
alter publication supabase_realtime add table public.check_ins, public.sends;
