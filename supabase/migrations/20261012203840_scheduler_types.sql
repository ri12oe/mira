-- Scheduler, part 1: new status values and the two extensions it needs.
-- (Kept separate: Postgres can't use a new enum value in the same
-- transaction that adds it, and the next migration uses them.)

-- A check-in that won't happen because the person was paused mid-day
alter type public.check_in_status add value if not exists 'skipped';

-- A queued send that's no longer needed (they checked in, or were paused)
alter type public.send_status add value if not exists 'cancelled';

-- "Good news, Lin just checked in": sent to everyone who was alerted
alter type public.send_purpose add value if not exists 'all_clear';

-- pg_cron runs scheduler_tick() every minute; pg_net lets it call deliver-sends
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
