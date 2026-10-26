begin;
-- The shared classroom-code enrollment UI has been replaced by exact student codes.
revoke execute on function public.lookup_classroom(text) from anon, authenticated;
revoke execute on function public.request_student_device(text, uuid) from anon, authenticated;
-- Codes retain their original class/student/start-lesson fields as progress changes.
create table if not exists public.student_codes (
  student_id uuid primary key references public.students(id) on delete cascade,
  issued_code text not null unique,
  code_hash text not null unique,
  start_lesson smallint not null check(start_lesson between 1 and 50),
  created_at timestamptz not null default now()
);
alter table public.student_codes enable row level security;
revoke all on public.student_codes from anon, authenticated;
grant select on public.student_codes to authenticated;
drop policy if exists code_teacher_read on public.student_codes;
create policy code_teacher_read on public.student_codes for select to authenticated
using (public.owns_student(student_id) and public.is_teacher((select auth.uid())));

create or replace function public.issue_student_code(p_student_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare existing_code text; class_ref text; student_ref text; first_lesson integer; token text;
begin
  if not public.owns_student(p_student_id) or not public.is_teacher((select auth.uid())) then
    raise exception 'teacher_required' using errcode = '42501';
  end if;
  perform 1 from public.students where id = p_student_id for update;
  select issued_code into existing_code from public.student_codes where student_id = p_student_id;
  if existing_code is not null then return existing_code; end if;
  select c.class_code, s.local_code, c.current_lesson into class_ref, student_ref, first_lesson
    from public.students s join public.classrooms c on c.id = s.class_id where s.id = p_student_id;
  if class_ref is null then raise exception 'classroom_required'; end if;
  token := upper(replace(gen_random_uuid()::text, '-', ''));
  existing_code := 'NGHE1-SB-C' || class_ref || '-' || student_ref || '-B' || lpad(first_lesson::text, 2, '0') || '-' || token;
  insert into public.student_codes(student_id, issued_code, code_hash, start_lesson)
    values(p_student_id, existing_code, encode(sha256(convert_to(existing_code, 'UTF8')), 'hex'), first_lesson);
  return existing_code;
end;
$$;
revoke all on function public.issue_student_code(uuid) from public;
grant execute on function public.issue_student_code(uuid) to authenticated;

create or replace function public.issue_class_student_codes(p_class_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare student_uuid uuid;
begin
  if not exists(select 1 from public.classrooms where id = p_class_id and owner_id = (select auth.uid()))
    or not public.is_teacher((select auth.uid())) then raise exception 'teacher_required' using errcode = '42501'; end if;
  for student_uuid in select id from public.students where class_id = p_class_id order by local_code loop
    perform public.issue_student_code(student_uuid);
  end loop;
end;
$$;
revoke all on function public.issue_class_student_codes(uuid) from public;
grant execute on function public.issue_class_student_codes(uuid) to authenticated;

create or replace function public.create_classroom_with_codes(p_name text, p_student_count integer, p_lesson integer)
returns uuid language plpgsql security definer set search_path = '' as $$
declare class_uuid uuid;
begin
  class_uuid := public.create_classroom(p_name, p_student_count, p_lesson);
  perform public.issue_class_student_codes(class_uuid);
  return class_uuid;
end;
$$;
revoke all on function public.create_classroom_with_codes(text, integer, integer) from public;
grant execute on function public.create_classroom_with_codes(text, integer, integer) to authenticated;

create or replace function public.read_student_device(p_token text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare device_row public.student_devices; result jsonb;
begin
  select * into device_row from public.student_devices
    where token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex') and expires_at > now();
  if device_row.id is null or device_row.status = 'revoked' then raise exception 'invalid_student_device' using errcode = '28000'; end if;
  select jsonb_build_object('student_id', s.id, 'local_code', s.local_code, 'avatar', s.avatar, 'class_name', c.name,
    'lesson', case when device_row.status = 'approved' then coalesce(p.lesson, sc.start_lesson, c.current_lesson) else c.current_lesson end,
    'status', device_row.status, 'check_code', device_row.check_code) into result
    from public.students s join public.classrooms c on c.id = s.class_id
    left join public.student_codes sc on sc.student_id = s.id
    left join public.student_progress p on p.student_id = s.id where s.id = device_row.student_id;
  if device_row.status = 'approved' then
    result := result || coalesce((select jsonb_build_object('revision', p.revision, 'progress', p.progress)
      from public.student_progress p where p.student_id = device_row.student_id), '{"revision":0}'::jsonb);
  end if;
  return result;
end;
$$;
revoke all on function public.read_student_device(text) from public;
grant execute on function public.read_student_device(text) to anon, authenticated;

create or replace function public.redeem_student_code(p_code text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare canonical_code text; student_uuid uuid; device_token text;
begin
  canonical_code := regexp_replace(upper(trim(p_code)), '[[:space:]]', '', 'g');
  if canonical_code is null or canonical_code !~ '^NGHE1-SB-C[0-9]{6}-HS(0[1-9]|[1-3][0-9]|40)-B(0[1-9]|[1-4][0-9]|50)-[0-9A-F]{32}$' then
    raise exception 'invalid_student_code' using errcode = '28000';
  end if;
  select student_id into student_uuid from public.student_codes
    where code_hash = encode(sha256(convert_to(canonical_code, 'UTF8')), 'hex') for share;
  if student_uuid is null then raise exception 'invalid_student_code' using errcode = '28000'; end if;
  device_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  delete from public.student_devices where student_id = student_uuid and expires_at <= now();
  insert into public.student_devices(token_hash, student_id, status)
    values(encode(sha256(convert_to(device_token, 'UTF8')), 'hex'), student_uuid, 'approved');
  return public.read_student_device(device_token) || jsonb_build_object('device_token', device_token);
end;
$$;
revoke all on function public.redeem_student_code(text) from public;
grant execute on function public.redeem_student_code(text) to anon, authenticated;

create or replace function public.save_student_code_progress(
  p_token text, p_progress jsonb, p_expected_revision bigint, p_events jsonb, p_lesson integer
) returns bigint language plpgsql security definer set search_path = '' as $$
declare next_revision bigint; student_uuid uuid;
begin
  if p_lesson is null or p_lesson not between 1 and 50 then raise exception 'invalid_lesson'; end if;
  student_uuid := public.student_device_id(p_token);
  next_revision := public.save_student_device(p_token, p_progress, p_expected_revision, p_events);
  update public.student_progress set lesson = p_lesson where student_id = student_uuid;
  return next_revision;
end;
$$;
revoke all on function public.save_student_code_progress(text, jsonb, bigint, jsonb, integer) from public;
grant execute on function public.save_student_code_progress(text, jsonb, bigint, jsonb, integer) to anon, authenticated;
commit;
