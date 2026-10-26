begin;

create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;
create table if not exists app_private.gateway_config (
  id boolean primary key default true check(id),
  secret_hash text not null check(secret_hash ~ '^[0-9a-f]{64}$')
);
create table if not exists app_private.request_budgets (
  key text primary key, window_start timestamptz not null, hits integer not null
);
revoke all on all tables in schema app_private from public, anon, authenticated;
alter table public.student_codes add column if not exists is_locked boolean not null default false;

create or replace function app_private.require_gateway() returns void
language plpgsql security definer set search_path = '' as $$
declare supplied text; expected text;
begin
  select secret_hash into expected from app_private.gateway_config where id;
  if expected is null then raise exception 'gateway_not_configured' using errcode = 'PT503'; end if;
  supplied := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb ->> 'x-nghe-gateway';
  if supplied is null or length(supplied) <> 64
    or encode(sha256(convert_to(supplied, 'UTF8')), 'hex') <> expected then
    raise exception 'gateway_required' using errcode = '42501';
  end if;
end;
$$;

create or replace function app_private.consume_budget(p_key text, p_limit integer, p_seconds integer) returns void
language plpgsql security definer set search_path = '' as $$
declare bucket timestamptz; used integer;
begin
  bucket := to_timestamp(floor(extract(epoch from statement_timestamp()) / p_seconds) * p_seconds);
  insert into app_private.request_budgets(key, window_start, hits) values(p_key, bucket, 1)
  on conflict(key) do update set
    hits = case when request_budgets.window_start = bucket then request_budgets.hits + 1 else 1 end,
    window_start = bucket returning hits into used;
  if used > p_limit then raise exception 'rate_limited' using errcode = 'PT429'; end if;
end;
$$;

create or replace function app_private.valid_progress(p jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
declare field text; pair record; item jsonb; number_value numeric; stat text;
begin
  if p is null or jsonb_typeof(p) <> 'object' or octet_length(p::text) > 262144
    or not (p ?& array['conVat','muc','am','loi','loiCT','phut','daDoc','docTheo']) then return false; end if;
  if exists(select 1 from jsonb_object_keys(p) as k where k not in ('conVat','muc','am','loi','loiCT','phut','daDoc','docTheo','lanGui')) then return false; end if;
  if jsonb_typeof(p->'conVat') <> 'string' or length(p->>'conVat') not between 1 and 20
    or jsonb_typeof(p->'docTheo') <> 'number' then return false; end if;
  number_value := (p->>'docTheo')::numeric;
  if number_value < 0 or number_value > 1000000000 or trunc(number_value) <> number_value then return false; end if;
  foreach field in array array['am','loi','phut','daDoc'] loop
    if jsonb_typeof(p->field) <> 'object' or (select count(*) from jsonb_object_keys(p->field)) > 2048 then return false; end if;
    for pair in select * from jsonb_each(p->field) loop
      if length(pair.key) not between 1 and 2000 or pair.key in ('__proto__','constructor','prototype') or jsonb_typeof(pair.value) <> 'number' then return false; end if;
      number_value := pair.value::text::numeric;
      if number_value < 0 or number_value > 1000000000 then return false; end if;
      if field = 'am' and (number_value > 9 or trunc(number_value) <> number_value) then return false; end if;
      if field in ('loi','daDoc') and trunc(number_value) <> number_value then return false; end if;
      if field = 'phut' and number_value > 1440 then return false; end if;
    end loop;
  end loop;
  if jsonb_typeof(p->'muc') <> 'object' or (select count(*) from jsonb_object_keys(p->'muc')) > 2048 then return false; end if;
  for pair in select * from jsonb_each(p->'muc') loop
    if length(pair.key) not between 1 and 2000 or pair.key in ('__proto__','constructor','prototype')
      or jsonb_typeof(pair.value) <> 'object' or not(pair.value ?& array['b','d','s','h']) then return false; end if;
    if exists(select 1 from jsonb_object_keys(pair.value) as k where k not in ('b','d','s','h','pb')) then return false; end if;
    foreach stat in array array['b','d','s','h','pb'] loop
      if pair.value ? stat then
        if jsonb_typeof(pair.value->stat) <> 'number' then return false; end if;
        number_value := (pair.value->>stat)::numeric;
        if number_value < 0 or number_value > 1000000000 or trunc(number_value) <> number_value then return false; end if;
        if stat in ('b','pb') and number_value not between 1 and 5 then return false; end if;
      end if;
    end loop;
  end loop;
  if jsonb_typeof(p->'loiCT') <> 'array' or jsonb_array_length(p->'loiCT') > 40 then return false; end if;
  for item in select * from jsonb_array_elements(p->'loiCT') loop
    if jsonb_typeof(item) <> 'object' then return false; end if;
    foreach field in array array['d','c','l','n'] loop
      if not(item ? field) or jsonb_typeof(item->field) <> 'string' or length(item->>field) > 2000 then return false; end if;
    end loop;
  end loop;
  if p ? 'lanGui' and (jsonb_typeof(p->'lanGui') <> 'string' or length(p->>'lanGui') > 32) then return false; end if;
  return true;
exception when others then return false;
end;
$$;

create or replace function app_private.valid_events(events jsonb) returns boolean
language plpgsql stable set search_path = '' as $$
declare item jsonb; event_time timestamptz; lesson_number numeric;
begin
  if events is null or jsonb_typeof(events) <> 'array' or jsonb_array_length(events) > 100
    or octet_length(events::text) > 262144 then return false; end if;
  for item in select * from jsonb_array_elements(events) loop
    if jsonb_typeof(item) <> 'object' or not(item ?& array['id','lesson','activity','item','correct','occurred_at']) then return false; end if;
    if exists(select 1 from jsonb_object_keys(item) as k where k not in ('id','lesson','activity','item','correct','occurred_at')) then return false; end if;
    if jsonb_typeof(item->'id') <> 'string' or (item->>'id') !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      or jsonb_typeof(item->'lesson') <> 'number' or jsonb_typeof(item->'activity') <> 'string'
      or item->>'activity' not in ('tau','cham','doc') or jsonb_typeof(item->'item') <> 'string'
      or length(item->>'item') not between 1 and 2000 or jsonb_typeof(item->'occurred_at') <> 'string'
      or length(item->>'occurred_at') > 40 then return false; end if;
    lesson_number := (item->>'lesson')::numeric;
    if lesson_number not between 1 and 50 or trunc(lesson_number) <> lesson_number then return false; end if;
    if item->>'activity' <> 'doc' and jsonb_typeof(item->'correct') <> 'boolean' then return false; end if;
    if item->>'activity' = 'doc' and jsonb_typeof(item->'correct') <> 'null' then return false; end if;
    event_time := (item->>'occurred_at')::timestamptz;
    if event_time < '2000-01-01'::timestamptz or event_time > now() + interval '1 year' then return false; end if;
  end loop;
  return true;
exception when others then return false;
end;
$$;

-- Keep established transaction/CAS logic behind private, non-API functions.
do $$
declare signature text;
begin
  foreach signature in array array['redeem_student_code(text)', 'read_student_device(text)',
    'save_student_device(text,jsonb,bigint,jsonb)', 'save_student_code_progress(text,jsonb,bigint,jsonb,integer)',
    'save_student_progress(uuid,jsonb,integer,bigint)', 'create_classroom(text,integer,integer)'] loop
    if to_regprocedure('app_private.' || signature) is null then
      execute 'alter function public.' || signature || ' set schema app_private';
    end if;
  end loop;
end;
$$;

create or replace function public.student_device_id(p_token text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare student_uuid uuid;
begin
  if p_token is null or length(p_token) <> 64 or p_token !~ '^[0-9a-f]{64}$' then raise exception 'invalid_student_device' using errcode = '28000'; end if;
  select d.student_id into student_uuid from public.student_devices d
    where d.token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex') and d.status = 'approved' and d.expires_at > now();
  if student_uuid is null then raise exception 'invalid_student_device' using errcode = '28000'; end if;
  -- Lock code before device, matching code rotation/revocation order.
  perform 1 from public.student_codes where student_id = student_uuid and not is_locked for share;
  if not found then raise exception 'invalid_student_device' using errcode = '28000'; end if;
  perform 1 from public.student_devices where token_hash = encode(sha256(convert_to(p_token,'UTF8')),'hex')
    and student_id = student_uuid and status = 'approved' and expires_at > now() for share;
  if not found then raise exception 'invalid_student_device' using errcode = '28000'; end if;
  return student_uuid;
end;
$$;

create or replace function public.read_student_device(p_token text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare student_uuid uuid; device_uuid uuid;
begin
  perform app_private.require_gateway();
  student_uuid := public.student_device_id(p_token);
  select id into device_uuid from public.student_devices where token_hash = encode(sha256(convert_to(p_token,'UTF8')),'hex');
  perform app_private.consume_budget('read:' || device_uuid, 120, 60);
  return app_private.read_student_device(p_token);
end;
$$;

create or replace function public.redeem_student_code(p_code text, p_device_token text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare canonical text; code_row public.student_codes; device_count integer;
begin
  perform app_private.require_gateway();
  if p_code is null or octet_length(p_code) > 200 then raise exception 'invalid_student_code' using errcode = '28000'; end if;
  canonical := regexp_replace(upper(trim(p_code)), '[[:space:]]', '', 'g');
  select * into code_row from public.student_codes where code_hash = encode(sha256(convert_to(canonical,'UTF8')),'hex') for update;
  if code_row.student_id is null or code_row.is_locked then raise exception 'invalid_student_code' using errcode = '28000'; end if;
  perform app_private.consume_budget('enroll:' || code_row.student_id, 6, 60);
  if p_device_token is not null and length(p_device_token) = 64 and p_device_token ~ '^[0-9a-f]{64}$' and exists(
    select 1 from public.student_devices where student_id = code_row.student_id and status = 'approved'
      and expires_at > now() and token_hash = encode(sha256(convert_to(p_device_token,'UTF8')),'hex')
  ) then return public.read_student_device(p_device_token) || jsonb_build_object('device_token',p_device_token); end if;
  delete from public.student_devices where student_id = code_row.student_id and (status = 'revoked' or expires_at <= now());
  select count(*) into device_count from public.student_devices where student_id = code_row.student_id;
  if device_count >= 3 then raise exception 'device_limit_reached' using errcode = 'PT429'; end if;
  return app_private.redeem_student_code(canonical);
end;
$$;

create or replace function public.save_student_device(p_token text,p_progress jsonb,p_expected_revision bigint,p_events jsonb) returns bigint
language plpgsql security definer set search_path = '' as $$
declare student_uuid uuid; device_uuid uuid;
begin
  perform app_private.require_gateway();
  student_uuid := public.student_device_id(p_token);
  if p_expected_revision is null or p_expected_revision < 0 or not app_private.valid_progress(p_progress) or not app_private.valid_events(p_events) then
    raise exception 'invalid_learning_data' using errcode = '22023'; end if;
  select id into device_uuid from public.student_devices where token_hash = encode(sha256(convert_to(p_token,'UTF8')),'hex');
  perform app_private.consume_budget('write:' || device_uuid,30,60);
  return app_private.save_student_device(p_token,p_progress,p_expected_revision,p_events);
end;
$$;

create or replace function public.save_student_code_progress(p_token text,p_progress jsonb,p_expected_revision bigint,p_events jsonb,p_lesson integer) returns bigint
language plpgsql security definer set search_path = '' as $$
begin
  perform app_private.require_gateway();
  if p_lesson is null or p_lesson not between 1 and 50 then raise exception 'invalid_lesson' using errcode = '22023'; end if;
  return app_private.save_student_code_progress(p_token,p_progress,p_expected_revision,p_events,p_lesson);
end;
$$;

create or replace function public.save_student_progress(p_student_id uuid,p_progress jsonb,p_lesson integer,p_expected_revision bigint) returns bigint
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_teacher((select auth.uid())) then raise exception 'teacher_required' using errcode = '42501'; end if;
  if not app_private.valid_progress(p_progress) or p_expected_revision is null or p_expected_revision < 0 then
    raise exception 'invalid_learning_data' using errcode = '22023'; end if;
  return app_private.save_student_progress(p_student_id,p_progress,p_lesson,p_expected_revision);
end;
$$;

create or replace function public.create_classroom(p_name text,p_student_count integer,p_lesson integer) returns uuid
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_teacher((select auth.uid())) then raise exception 'teacher_required' using errcode = '42501'; end if;
  perform app_private.consume_budget('class:' || (select auth.uid()),10,3600);
  return app_private.create_classroom(p_name,p_student_count,p_lesson);
end;
$$;

create or replace function public.set_student_code_lock(p_student_id uuid,p_locked boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_teacher((select auth.uid())) or not public.owns_student(p_student_id) or p_locked is null then raise exception 'teacher_required' using errcode = '42501'; end if;
  update public.student_codes set is_locked = p_locked where student_id = p_student_id;
  if not found then raise exception 'student_code_missing'; end if;
  if p_locked then update public.student_devices set status = 'revoked' where student_id = p_student_id; end if;
end;
$$;

create or replace function public.rotate_student_code(p_student_id uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare previous text; replacement text;
begin
  if not public.is_teacher((select auth.uid())) or not public.owns_student(p_student_id) then raise exception 'teacher_required' using errcode = '42501'; end if;
  select issued_code into previous from public.student_codes where student_id = p_student_id for update;
  if previous is null then raise exception 'student_code_missing'; end if;
  replacement := regexp_replace(previous,'[0-9A-F]{32}$',upper(replace(gen_random_uuid()::text,'-','')));
  update public.student_codes set issued_code = replacement, code_hash = encode(sha256(convert_to(replacement,'UTF8')),'hex'), is_locked = false where student_id = p_student_id;
  update public.student_devices set status = 'revoked' where student_id = p_student_id;
  return replacement;
end;
$$;

-- Reject non-teacher account creation even if dashboard Auth Hooks are not enabled yet.
create or replace function public.create_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists(select 1 from public.teacher_emails where email = lower(trim(new.email))) then
    raise exception 'teacher_registration_not_allowed' using errcode = '42501'; end if;
  insert into public.profiles(id) values(new.id);
  return new;
end;
$$;
create or replace function public.before_teacher_signup(event jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if not exists(select 1 from public.teacher_emails where email = lower(trim(event->'user'->>'email'))) then
    return jsonb_build_object('error',jsonb_build_object('http_code',403,'message','Teacher registration is not allowed for this email.'));
  end if;
  return '{}'::jsonb;
end;
$$;

revoke all on all functions in schema app_private from public,anon,authenticated;
-- Supabase may grant anon/authenticated EXECUTE directly via default privileges.
do $$
declare fn record;
begin
  for fn in select p.oid from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in
    ('redeem_student_code','read_student_device','save_student_device','save_student_code_progress','save_student_progress',
     'student_device_id','create_classroom','create_classroom_with_codes','issue_student_code','issue_class_student_codes',
     'set_student_device_status','set_student_code_lock','rotate_student_code','before_teacher_signup','create_profile',
     'provision_verified_teacher','lookup_classroom','request_student_device','owns_student','is_teacher') loop
    execute format('revoke all on function %s from public,anon,authenticated',fn.oid::regprocedure);
  end loop;
  if exists(select 1 from pg_roles where rolname='supabase_auth_admin') then
    grant execute on function public.before_teacher_signup(jsonb) to supabase_auth_admin;
  end if;
end;
$$;
grant execute on function public.redeem_student_code(text,text),public.read_student_device(text),public.save_student_code_progress(text,jsonb,bigint,jsonb,integer) to anon,authenticated;
grant execute on function public.owns_student(uuid),public.is_teacher(uuid),public.create_classroom_with_codes(text,integer,integer),
  public.issue_student_code(uuid),public.issue_class_student_codes(uuid),public.save_student_progress(uuid,jsonb,integer,bigint),
  public.set_student_device_status(uuid,text),public.set_student_code_lock(uuid,boolean),public.rotate_student_code(uuid) to authenticated;
notify pgrst,'reload schema';
commit;
