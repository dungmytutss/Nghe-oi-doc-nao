begin;

create table if not exists public.teacher_emails (email text primary key check (email = lower(trim(email))));
alter table public.teacher_emails enable row level security;
revoke all on public.teacher_emails from anon, authenticated;
create or replace function public.provision_verified_teacher() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.email_confirmed_at is not null and exists(select 1 from public.teacher_emails where email = lower(new.email)) then
    insert into public.profiles(id, role) values(new.id, 'teacher')
    on conflict(id) do update set role = 'teacher' where public.profiles.role <> 'admin';
  end if;
  return new;
end;
$$;
revoke all on function public.provision_verified_teacher() from public;
drop trigger if exists on_verified_teacher on auth.users;
create trigger on_verified_teacher after insert or update of email_confirmed_at on auth.users
for each row execute function public.provision_verified_teacher();

create table if not exists public.classrooms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 80),
  class_code text not null unique default lpad(((('x' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))::bit(32)::bigint) % 1000000)::text, 6, '0') check(class_code ~ '^[0-9]{6}$'),
  current_lesson smallint not null default 1 check (current_lesson between 1 and 50),
  created_at timestamptz not null default now()
);
create index if not exists classrooms_owner_idx on public.classrooms(owner_id);
alter table public.students add column if not exists class_id uuid references public.classrooms(id) on delete restrict;
alter table public.students drop constraint if exists students_owner_id_local_code_key;
create unique index if not exists students_class_code_idx on public.students(class_id, local_code) where class_id is not null;
create unique index if not exists students_legacy_code_idx on public.students(owner_id, local_code) where class_id is null;
alter table public.classrooms enable row level security;
revoke all on public.classrooms from anon, authenticated;
grant select, update on public.classrooms to authenticated;
drop policy if exists classroom_owner on public.classrooms;
create policy classroom_owner on public.classrooms for all to authenticated
using (owner_id = (select auth.uid()) and public.is_teacher((select auth.uid())))
with check (owner_id = (select auth.uid()) and public.is_teacher((select auth.uid())));
drop policy if exists student_owner_all on public.students;
create policy student_owner_all on public.students for all to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()) and (class_id is null or exists (
  select 1 from public.classrooms c where c.id = class_id and c.owner_id = (select auth.uid())
)));

create table if not exists public.student_devices (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  student_id uuid not null references public.students(id) on delete cascade,
  status text not null default 'pending' check(status in ('pending', 'approved', 'revoked')),
  check_code text not null default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '1 year')
);
create index if not exists student_devices_student_idx on public.student_devices(student_id);
alter table public.student_devices enable row level security;
revoke all on public.student_devices from anon, authenticated;
grant select(id, student_id, status, check_code, created_at) on public.student_devices to authenticated;
drop policy if exists device_teacher_read on public.student_devices;
create policy device_teacher_read on public.student_devices for select to authenticated
using (public.owns_student(student_id) and public.is_teacher((select auth.uid())));

create or replace function public.create_classroom(p_name text, p_student_count integer, p_lesson integer)
returns uuid language plpgsql security definer set search_path = '' as $$
declare class_uuid uuid; n integer; attempt integer;
  animals text[] := array['🐰','🐱','🐶','🐥','🐸','🐯','🐼','🐨','🐵','🦊','🐻','🐷','🐮','🐭','🐹','🦁','🐔','🐧','🦉','🦆','🐢','🐟','🐬','🐳','🦋','🐝','🐞','🐌','🦀','🐙','🦒','🦓','🐘','🦏','🐪','🦔','🦜','🦚','🦋','🦩'];
begin
  if not public.is_teacher((select auth.uid())) then raise exception 'teacher_required' using errcode = '42501'; end if;
  if p_student_count is null or p_student_count not between 1 and 40 then raise exception 'invalid_student_count'; end if;
  for attempt in 1..10 loop
    begin
      insert into public.classrooms(owner_id, name, current_lesson)
        values((select auth.uid()), trim(p_name), p_lesson) returning id into class_uuid;
      exit;
    exception when unique_violation then
      if attempt = 10 then raise; end if;
    end;
  end loop;
  for n in 1..p_student_count loop
    insert into public.students(owner_id, class_id, local_code, avatar)
    values((select auth.uid()), class_uuid, 'HS' || lpad(n::text, 2, '0'), animals[n]);
  end loop;
  return class_uuid;
end;
$$;
revoke all on function public.create_classroom(text, integer, integer) from public;
grant execute on function public.create_classroom(text, integer, integer) to authenticated;

-- Knowing a class code permits a pairing request, never access to learning history.
create or replace function public.lookup_classroom(p_code text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
  select jsonb_build_object('name', c.name, 'lesson', c.current_lesson,
    'students', (select jsonb_agg(jsonb_build_object('id', s.id, 'local_code', s.local_code, 'avatar', s.avatar) order by s.local_code)
      from public.students s where s.class_id = c.id)) into result
  from public.classrooms c where regexp_replace(upper(trim(p_code)), '[^A-Z0-9]', '', 'g') in (c.class_code, 'NGHE' || c.class_code);
  if result is null then raise exception 'invalid_class_code' using errcode = '28000'; end if;
  return result;
end;
$$;
revoke all on function public.lookup_classroom(text) from public;
grant execute on function public.lookup_classroom(text) to anon, authenticated;

create or replace function public.request_student_device(p_code text, p_student_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare token text; device_row public.student_devices; class_row public.classrooms; student_row public.students;
begin
  select c.* into class_row from public.classrooms c
    where regexp_replace(upper(trim(p_code)), '[^A-Z0-9]', '', 'g') in (c.class_code, 'NGHE' || c.class_code) for share;
  select * into student_row from public.students where id = p_student_id and class_id = class_row.id for update;
  if student_row.id is null then raise exception 'invalid_class_code' using errcode = '28000'; end if;
  -- Cap pending requests to bound storage abuse; the teacher can revoke unwanted requests.
  if (select count(*) from public.student_devices where student_id = p_student_id and status = 'pending' and expires_at > now()) >= 5 then
    raise exception 'too_many_requests';
  end if;
  token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  insert into public.student_devices(token_hash, student_id)
    values(encode(sha256(convert_to(token, 'UTF8')), 'hex'), p_student_id) returning * into device_row;
  return jsonb_build_object('device_token', token, 'student_id', p_student_id, 'local_code', student_row.local_code,
    'avatar', student_row.avatar, 'class_name', class_row.name, 'lesson', class_row.current_lesson,
    'status', 'pending', 'check_code', device_row.check_code);
end;
$$;
revoke all on function public.request_student_device(text, uuid) from public;
grant execute on function public.request_student_device(text, uuid) to anon, authenticated;

create or replace function public.set_student_device_status(p_device_id uuid, p_status text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_status not in ('approved', 'revoked') or p_status is null then raise exception 'invalid_device_status'; end if;
  update public.student_devices set status = p_status where id = p_device_id
    and public.owns_student(student_id) and public.is_teacher((select auth.uid()));
  if not found then raise exception 'teacher_required' using errcode = '42501'; end if;
end;
$$;
revoke all on function public.set_student_device_status(uuid, text) from public;
grant execute on function public.set_student_device_status(uuid, text) to authenticated;

create or replace function public.student_device_id(p_token text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare student_uuid uuid;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{64}$' then raise exception 'invalid_student_device' using errcode = '28000'; end if;
  select student_id into student_uuid from public.student_devices
    where token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex') and status = 'approved' and expires_at > now() for share;
  if student_uuid is null then raise exception 'invalid_student_device' using errcode = '28000'; end if;
  return student_uuid;
end;
$$;
revoke all on function public.student_device_id(text) from public, anon, authenticated;

create or replace function public.read_student_device(p_token text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare device_row public.student_devices; result jsonb;
begin
  select * into device_row from public.student_devices where token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex') and expires_at > now();
  if device_row.id is null or device_row.status = 'revoked' then raise exception 'invalid_student_device' using errcode = '28000'; end if;
  select jsonb_build_object('student_id', s.id, 'local_code', s.local_code, 'avatar', s.avatar, 'class_name', c.name,
    'lesson', c.current_lesson, 'status', device_row.status, 'check_code', device_row.check_code) into result
    from public.students s join public.classrooms c on c.id = s.class_id where s.id = device_row.student_id;
  if device_row.status = 'approved' then
    result := result || coalesce((select jsonb_build_object('revision', p.revision, 'progress', p.progress)
      from public.student_progress p where p.student_id = device_row.student_id), '{"revision":0}'::jsonb);
  end if;
  return result;
end;
$$;
revoke all on function public.read_student_device(text) from public;
grant execute on function public.read_student_device(text) to anon, authenticated;

create or replace function public.save_student_device(p_token text, p_progress jsonb, p_expected_revision bigint, p_events jsonb)
returns bigint language plpgsql security definer set search_path = '' as $$
declare student_uuid uuid; next_revision bigint; lesson_number integer;
begin
  student_uuid := public.student_device_id(p_token);
  if p_events is null or jsonb_typeof(p_events) <> 'array' or jsonb_array_length(p_events) > 100
    or octet_length(p_events::text) > 262144 then raise exception 'invalid_events'; end if;
  if p_progress is null or jsonb_typeof(p_progress) <> 'object'
    or not (p_progress ?& array['conVat','muc','am','loi','loiCT','phut','daDoc','docTheo']) then raise exception 'invalid_progress'; end if;
  select c.current_lesson into lesson_number from public.students s join public.classrooms c on c.id = s.class_id where s.id = student_uuid;
  if p_expected_revision = 0 then
    insert into public.student_progress(student_id, progress, lesson) values(student_uuid, p_progress, lesson_number)
      on conflict do nothing returning revision into next_revision;
  else
    update public.student_progress set progress = p_progress, lesson = lesson_number, revision = revision + 1, updated_at = now()
      where student_id = student_uuid and revision = p_expected_revision returning revision into next_revision;
  end if;
  if next_revision is null then raise exception 'progress_conflict' using errcode = '40001'; end if;
  insert into public.learning_history(id, student_id, lesson, activity, item, correct, occurred_at)
    select e.id, student_uuid, e.lesson, e.activity, e.item, case when e.activity = 'doc' then null else e.correct end, e.occurred_at
    from jsonb_to_recordset(p_events) as e(id uuid, lesson smallint, activity text, item text, correct boolean, occurred_at timestamptz)
    on conflict(id) do nothing;
  return next_revision;
end;
$$;
revoke all on function public.save_student_device(text, jsonb, bigint, jsonb) from public;
grant execute on function public.save_student_device(text, jsonb, bigint, jsonb) to anon, authenticated;

commit;
