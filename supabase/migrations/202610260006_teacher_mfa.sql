begin;

create or replace function public.teacher_mfa_ready() returns boolean
language sql stable set search_path = '' as $$
  select coalesce(auth.jwt()->>'aal', '') = 'aal2';
$$;
revoke all on function public.teacher_mfa_ready() from public,anon,authenticated;
grant execute on function public.teacher_mfa_ready() to authenticated;

-- Existing role/ownership checks keep their meaning; require the actor's signed
-- session to have completed MFA before any teacher SECURITY DEFINER operation.
create or replace function public.is_teacher(p_user_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.teacher_mfa_ready() and exists(
    select 1 from public.profiles where id = p_user_id and role = 'teacher'
  );
$$;
revoke all on function public.is_teacher(uuid) from public,anon,authenticated;
grant execute on function public.is_teacher(uuid) to authenticated;

-- Restrictive policies also cover direct REST access and policies inherited
-- from the initial parent-account schema. Profiles remain readable for login.
do $$
declare table_name text;
begin
  foreach table_name in array array['classrooms','students','student_teachers',
    'student_progress','learning_history','student_devices','student_codes'] loop
    execute format('drop policy if exists teacher_mfa_guard on public.%I',table_name);
    execute format('create policy teacher_mfa_guard on public.%I as restrictive for all to authenticated using ((select public.is_teacher(auth.uid()))) with check ((select public.is_teacher(auth.uid())))',table_name);
  end loop;
end;
$$;
notify pgrst,'reload schema';
commit;
