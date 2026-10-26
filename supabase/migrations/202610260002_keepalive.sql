begin;
-- A real PostgREST table read, containing no student or account information.
create table public.app_health (id smallint primary key check (id = 1));
insert into public.app_health(id) values (1);
alter table public.app_health enable row level security;
revoke all on public.app_health from anon, authenticated;
grant select on public.app_health to anon, authenticated;
create policy health_read on public.app_health for select to anon, authenticated using (true);
commit;
