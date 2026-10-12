-- Mira: initial schema
--
-- caregivers  one row per signed-in caregiver (created automatically on sign-up)
-- takers      the people a caregiver looks after, with their check-in settings
-- backups     each taker's backup contacts, in alert order
-- invites     the "Reply YES to start" invite sent to a taker
-- check_ins   one row per taker per scheduled day (plus on-demand "check in now")
-- sends       a log of every text/call Mira makes, with its delivery status
--
-- Security: a caregiver can only see their own rows (Row Level Security), and
-- can only change settings. Anything that proves something happened (a YES,
-- a check-in, an alert) is written only by the server (Edge Functions).


-- ---------------------------------------------------------------- types

-- A phone number in international format, e.g. +13175550123
create domain public.phone_e164 as text
  check (value ~ '^\+[1-9][0-9]{6,14}$');

create type public.check_in_method as enum ('text', 'call', 'app');
create type public.taker_status as enum ('draft', 'invited', 'active');
create type public.invite_status as enum ('pending', 'accepted', 'cancelled');
create type public.check_in_kind as enum ('scheduled', 'on_demand');
create type public.check_in_status as enum ('pending', 'on_time', 'late', 'missed');
create type public.send_purpose as enum (
  'invite', 'check_in_prompt', 'reminder', 'caregiver_alert', 'backup_alert'
);
create type public.send_channel as enum ('sms', 'call', 'push');
create type public.send_status as enum ('queued', 'sent', 'delivered', 'failed');


-- ---------------------------------------------------------------- helpers

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- True for real IANA zones like 'America/Indianapolis'
create function public.is_valid_time_zone(tz text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (select 1 from pg_catalog.pg_timezone_names where name = tz);
$$;


-- ---------------------------------------------------------------- caregivers

create table public.caregivers (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null default '',
  phone public.phone_e164,
  email text,
  photo_path text, -- path in Supabase Storage, not a device file URI
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger caregivers_updated_at
  before update on public.caregivers
  for each row execute function public.set_updated_at();

-- Every new sign-in user gets a caregiver row. Auth stores phones without the
-- "+", so add it back; anything that still doesn't fit is left empty rather
-- than blocking the sign-up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  formatted text := '+' || ltrim(coalesce(new.phone, ''), '+');
begin
  insert into public.caregivers (id, phone, email)
  values (
    new.id,
    case when formatted ~ '^\+[1-9][0-9]{6,14}$' then formatted end,
    nullif(new.email, '')
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ---------------------------------------------------------------- takers

create table public.takers (
  id uuid primary key default gen_random_uuid(),
  caregiver_id uuid not null default auth.uid()
    references public.caregivers (id) on delete cascade,
  first_name text not null check (length(trim(first_name)) > 0),
  phone public.phone_e164 not null,
  caregiver_relationship text,
  method public.check_in_method not null default 'text',
  time_zone text not null check (public.is_valid_time_zone(time_zone)),
  window_start smallint not null default 540  -- minutes after midnight (9:00 AM)
    check (window_start between 0 and 1439),
  window_end smallint not null default 660    -- 11:00 AM
    check (window_end between 1 and 1440),
  days smallint[] not null default '{0,1,2,3,4,5,6}' -- 0 = Monday … 6 = Sunday
    check (cardinality(days) > 0 and days <@ '{0,1,2,3,4,5,6}'::smallint[]),
  extra_minutes smallint not null default 30
    check (extra_minutes between 0 and 720),
  paused boolean not null default false,
  status public.taker_status not null default 'draft',
  joined_at timestamptz, -- when they replied YES
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (window_end > window_start),
  unique (caregiver_id, phone)
);

create trigger takers_updated_at
  before update on public.takers
  for each row execute function public.set_updated_at();

-- A new phone number hasn't agreed to anything yet: back to draft until it
-- replies YES to a new invite.
create function public.takers_phone_changed()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.phone is distinct from old.phone then
    new.status := 'draft';
    new.joined_at := null;
  end if;
  return new;
end;
$$;

create trigger takers_phone_changed
  before update of phone on public.takers
  for each row execute function public.takers_phone_changed();


-- ---------------------------------------------------------------- backups

create table public.backups (
  id uuid primary key default gen_random_uuid(),
  taker_id uuid not null references public.takers (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  phone public.phone_e164 not null,
  relationship text,
  position smallint not null check (position >= 1), -- 1 = first after the caregiver
  -- minutes after the person before them in the chain was alerted
  alert_after_minutes smallint not null default 30
    check (alert_after_minutes between 0 and 720),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- checked at commit, so two backups can swap places in one transaction
  constraint backups_position_unique unique (taker_id, position)
    deferrable initially deferred
);

create trigger backups_updated_at
  before update on public.backups
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------- invites

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  taker_id uuid not null references public.takers (id) on delete cascade,
  message text not null, -- the caregiver's text; "Reply YES to start." is added when sent
  status public.invite_status not null default 'pending',
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index invites_taker_id on public.invites (taker_id);
create unique index invites_one_pending_per_taker
  on public.invites (taker_id) where status = 'pending';


-- ---------------------------------------------------------------- check_ins

-- Times are copied in when the row is created, so changing a taker's window
-- later doesn't rewrite their history.
create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  taker_id uuid not null references public.takers (id) on delete cascade,
  kind public.check_in_kind not null default 'scheduled',
  local_date date not null, -- the day in the taker's own time zone
  window_starts_at timestamptz not null,
  window_ends_at timestamptz not null,
  alert_at timestamptz not null, -- window end + extra minutes (on demand: start + 15 min)
  status public.check_in_status not null default 'pending',
  responded_at timestamptz,
  responded_via public.check_in_method,
  created_at timestamptz not null default now(),
  check (window_ends_at >= window_starts_at and alert_at >= window_ends_at),
  check ((responded_at is null) = (responded_via is null))
);

-- At most one scheduled check-in per taker per day, even if the scheduler runs twice
create unique index check_ins_one_scheduled_per_day
  on public.check_ins (taker_id, local_date) where kind = 'scheduled';
create index check_ins_taker_history on public.check_ins (taker_id, window_starts_at desc);
create index check_ins_pending_alert on public.check_ins (alert_at) where status = 'pending';


-- ---------------------------------------------------------------- sends

-- Never stores message contents (privacy promise): only who, why, how and status.
create table public.sends (
  id uuid primary key default gen_random_uuid(),
  caregiver_id uuid not null references public.caregivers (id) on delete cascade,
  taker_id uuid references public.takers (id) on delete cascade,
  check_in_id uuid references public.check_ins (id) on delete cascade,
  invite_id uuid references public.invites (id) on delete cascade,
  backup_id uuid references public.backups (id) on delete set null,
  purpose public.send_purpose not null,
  channel public.send_channel not null,
  to_phone public.phone_e164, -- empty for push notifications
  -- e.g. 'check_in:<id>:caregiver_alert:sms'. Unique, so a second scheduler
  -- run can't create (and send) the same message again.
  dedupe_key text not null unique,
  status public.send_status not null default 'queued',
  provider_id text, -- Twilio's message/call ID, to match delivery updates
  error text,
  attempts smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sends_caregiver_id on public.sends (caregiver_id);
create index sends_taker_id on public.sends (taker_id);
create index sends_check_in_id on public.sends (check_in_id);
create index sends_invite_id on public.sends (invite_id);
create index sends_backup_id on public.sends (backup_id);

create trigger sends_updated_at
  before update on public.sends
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------- privileges
-- Table-level permissions: what the app is allowed to try at all.
-- (The server's service_role key skips all of this.)

revoke all on public.caregivers, public.takers, public.backups,
  public.invites, public.check_ins, public.sends
  from anon, authenticated;

grant select on public.caregivers, public.takers, public.backups,
  public.invites, public.check_ins, public.sends
  to authenticated;

-- Caregiver profile. Phone is the sign-in number, so it changes through Auth.
grant update (first_name, email, photo_path) on public.caregivers to authenticated;

-- Takers: settings only. status/joined_at are set by the YES-reply webhook.
grant insert (id, caregiver_id, first_name, phone, caregiver_relationship, method,
  time_zone, window_start, window_end, days, extra_minutes, paused)
  on public.takers to authenticated;
grant update (first_name, phone, caregiver_relationship, method,
  time_zone, window_start, window_end, days, extra_minutes, paused)
  on public.takers to authenticated;
grant delete on public.takers to authenticated;

grant insert, update, delete on public.backups to authenticated;


-- ---------------------------------------------------------------- row level security
-- Row-level rules: which rows those permissions apply to.

alter table public.caregivers enable row level security;
alter table public.takers enable row level security;
alter table public.backups enable row level security;
alter table public.invites enable row level security;
alter table public.check_ins enable row level security;
alter table public.sends enable row level security;

create policy "Caregivers see their own profile"
  on public.caregivers for select to authenticated
  using (id = (select auth.uid()));

create policy "Caregivers edit their own profile"
  on public.caregivers for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "Caregivers manage their own takers"
  on public.takers for all to authenticated
  using (caregiver_id = (select auth.uid()))
  with check (caregiver_id = (select auth.uid()));

create policy "Caregivers manage their takers' backups"
  on public.backups for all to authenticated
  using (exists (
    select 1 from public.takers t
    where t.id = taker_id and t.caregiver_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.takers t
    where t.id = taker_id and t.caregiver_id = (select auth.uid())
  ));

create policy "Caregivers see their takers' invites"
  on public.invites for select to authenticated
  using (exists (
    select 1 from public.takers t
    where t.id = taker_id and t.caregiver_id = (select auth.uid())
  ));

create policy "Caregivers see their takers' check-ins"
  on public.check_ins for select to authenticated
  using (exists (
    select 1 from public.takers t
    where t.id = taker_id and t.caregiver_id = (select auth.uid())
  ));

create policy "Caregivers see their own send log"
  on public.sends for select to authenticated
  using (caregiver_id = (select auth.uid()));
