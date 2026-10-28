-- This test is intentionally plain SQL so it can run against a linked project
-- without requiring a separate test framework.
do $$
declare
  profiles_table oid;
begin
  select c.oid
    into profiles_table
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and c.relname = 'profiles';

  if profiles_table is null then
    raise exception 'public.profiles table is missing';
  end if;

  if not exists (
    select 1 from pg_class where oid = profiles_table and relrowsecurity
  ) then
    raise exception 'public.profiles must have RLS enabled';
  end if;

  if (select count(*) from pg_policy where polrelid = profiles_table) <> 2 then
    raise exception 'public.profiles must have exactly select and update policies';
  end if;

  if not exists (
    select 1
      from pg_trigger t
      join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'auth'
       and c.relname = 'users'
       and t.tgname = 'on_auth_user_created'
       and not t.tgisinternal
  ) then
    raise exception 'auth.users profile creation trigger is missing';
  end if;
end;
$$;
