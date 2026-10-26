-- Initial setup for a NEW Supabase project. Run once in SQL Editor.
-- Generated from the versioned migrations below. No credentials are included.

-- Source: supabase/migrations/202610260001_learning.sql
begin;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'parent' check (role in ('parent', 'teacher', 'admin')),
  created_at timestamptz not null default now()
);

create function public.create_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.create_profile();
-- Also support a project with existing Auth users.
insert into public.profiles (id) select id from auth.users on conflict do nothing;

create table public.students (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  local_code text not null check (local_code ~ '^HS(0[1-9]|[1-3][0-9]|40)$'),
  avatar text not null default '🐰' check (length(avatar) <= 20),
  created_at timestamptz not null default now(),
  unique (owner_id, local_code)
);

-- Adults explicitly grant a teacher read access; HS01 is never a global identity.
create table public.student_teachers (
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  primary key (student_id, teacher_id)
);
create index student_teachers_teacher_idx on public.student_teachers(teacher_id);

create table public.student_progress (
  student_id uuid primary key references public.students(id) on delete cascade,
  progress jsonb not null check (jsonb_typeof(progress) = 'object' and octet_length(progress::text) <= 262144),
  lesson smallint not null check (lesson between 1 and 50),
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);

create table public.learning_history (
  id uuid primary key,
  student_id uuid not null references public.students(id) on delete cascade,
  lesson smallint not null check (lesson between 1 and 50),
  activity text not null check (activity in ('tau', 'cham', 'doc')),
  item text not null check (length(item) between 1 and 2000),
  correct boolean,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now()
);
create index learning_history_student_time_idx on public.learning_history(student_id, occurred_at desc);

alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.student_teachers enable row level security;
alter table public.student_progress enable row level security;
alter table public.learning_history enable row level security;

revoke all on public.profiles, public.students, public.student_teachers, public.student_progress, public.learning_history from anon, authenticated;
grant select on public.profiles, public.student_progress to authenticated;
grant select, insert, update, delete on public.students to authenticated;
grant select, insert, delete on public.student_teachers to authenticated;
grant select, insert on public.learning_history to authenticated;

create policy profile_self_read on public.profiles for select to authenticated using (id = (select auth.uid()));
-- Roles are provisioned by a trusted administrator, never from editable user metadata.
create policy student_owner_all on public.students for all to authenticated
using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy student_teacher_read on public.students for select to authenticated
using (exists (select 1 from public.student_teachers t where t.student_id = students.id and t.teacher_id = (select auth.uid())));

-- SECURITY DEFINER avoids recursive RLS between students and student_teachers.
create function public.owns_student(p_student_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.students where id = p_student_id and owner_id = (select auth.uid()));
$$;
revoke all on function public.owns_student(uuid) from public;
grant execute on function public.owns_student(uuid) to authenticated;

create function public.is_teacher(p_user_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = p_user_id and role = 'teacher');
$$;
revoke all on function public.is_teacher(uuid) from public;
grant execute on function public.is_teacher(uuid) to authenticated;

create policy grant_owner_read on public.student_teachers for select to authenticated
using (public.owns_student(student_id) or teacher_id = (select auth.uid()));
create policy grant_owner_insert on public.student_teachers for insert to authenticated
with check (public.owns_student(student_id) and public.is_teacher(teacher_id));
create policy grant_owner_delete on public.student_teachers for delete to authenticated
using (public.owns_student(student_id));
create policy progress_read on public.student_progress for select to authenticated
using (public.owns_student(student_id) or exists (select 1 from public.student_teachers t where t.student_id = student_progress.student_id and t.teacher_id = (select auth.uid())));
create policy history_read on public.learning_history for select to authenticated
using (public.owns_student(student_id) or exists (select 1 from public.student_teachers t where t.student_id = learning_history.student_id and t.teacher_id = (select auth.uid())));
create policy history_owner_insert on public.learning_history for insert to authenticated
with check (public.owns_student(student_id));

create function public.save_student_progress(p_student_id uuid, p_progress jsonb, p_lesson integer, p_expected_revision bigint)
returns bigint language plpgsql security definer set search_path = '' as $$
declare next_revision bigint;
begin
  if not public.owns_student(p_student_id) then raise exception 'not_authorized' using errcode = '42501'; end if;
  if p_expected_revision = 0 then
    insert into public.student_progress(student_id, progress, lesson)
    values(p_student_id, p_progress, p_lesson)
    on conflict do nothing returning revision into next_revision;
  else
    update public.student_progress set progress = p_progress, lesson = p_lesson,
      revision = revision + 1, updated_at = now()
    where student_id = p_student_id and revision = p_expected_revision
    returning revision into next_revision;
  end if;
  if next_revision is null then raise exception 'progress_conflict' using errcode = '40001'; end if;
  return next_revision;
end;
$$;
revoke all on function public.save_student_progress(uuid, jsonb, integer, bigint) from public;
grant execute on function public.save_student_progress(uuid, jsonb, integer, bigint) to authenticated;
commit;


-- Source: supabase/migrations/202610260002_keepalive.sql
begin;
-- A real PostgREST table read, containing no student or account information.
create table public.app_health (id smallint primary key check (id = 1));
insert into public.app_health(id) values (1);
alter table public.app_health enable row level security;
revoke all on public.app_health from anon, authenticated;
grant select on public.app_health to anon, authenticated;
create policy health_read on public.app_health for select to anon, authenticated using (true);
commit;
