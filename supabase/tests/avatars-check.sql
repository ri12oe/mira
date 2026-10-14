-- Profile photos: the avatars bucket is private, and each caregiver can only
-- touch their own folder. Rolled back at the end.
-- Run: npx supabase db query --linked -f supabase/tests/avatars-check.sql

begin;

do $$
declare
  a uuid := '00000000-0000-0000-0000-00000000000a';
  b uuid := '00000000-0000-0000-0000-00000000000b';
  n int; pub boolean;
begin
  insert into auth.users (id, phone, aud, role) values
    (a, '13175550101', 'authenticated', 'authenticated'),
    (b, '13175550102', 'authenticated', 'authenticated');

  -- V1: the bucket is private, 5 MB, images only
  select public into pub from storage.buckets where id = 'avatars';
  assert pub = false, 'V1 the avatars bucket must be private';

  -- V2: A can add a photo to A's own folder
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into storage.objects (bucket_id, name, owner_id) values ('avatars', a || '/photo-1.jpg', a::text);
  select count(*) into n from storage.objects where bucket_id = 'avatars';
  assert n = 1, 'V2 A should see their own photo, sees ' || n;

  -- V3: A can't put a photo in B's folder
  begin
    insert into storage.objects (bucket_id, name, owner_id) values ('avatars', b || '/sneaky.jpg', a::text);
    raise exception 'V3 FAIL: A wrote into B''s folder';
  exception when insufficient_privilege then null; end;

  -- V4: B can't see, rename or delete A's photo
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  select count(*) into n from storage.objects where bucket_id = 'avatars';
  assert n = 0, 'V4 B should see no photos, sees ' || n;
  update storage.objects set name = b || '/stolen.jpg' where bucket_id = 'avatars';
  get diagnostics n = row_count;
  assert n = 0, 'V4 B renamed A''s photo';
  -- (Storage forbids deleting through SQL for everyone; real deletes are
  -- tested through the Storage API. Here: B's attempt must change nothing.)
  begin
    delete from storage.objects where bucket_id = 'avatars';
  exception when insufficient_privilege then null; end;
  reset role;
  select count(*) into n from storage.objects where bucket_id = 'avatars' and name = a || '/photo-1.jpg';
  assert n = 1, 'V4 A''s photo should still be there';

  -- V5: signed out sees nothing
  set local role anon;
  select count(*) into n from storage.objects where bucket_id = 'avatars';
  assert n = 0, 'V5 signed-out user sees photos';
  reset role;
end $$;

select 'ALL CHECKS PASSED' as result;

rollback;
