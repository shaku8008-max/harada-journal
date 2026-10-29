-- Supabase REST calls are separate transactions. Keep the sub-goal and its
-- active actions in one database transaction so a replacement slot never
-- inherits visible actions from the archived sub-goal.
create or replace function public.archive_sub_goal(
  p_chart_id uuid,
  p_sub_goal_id uuid
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  archive_time timestamptz := now();
begin
  update public.sub_goals
     set archived_at = archive_time
   where id = p_sub_goal_id
     and chart_id = p_chart_id
     and user_id = (select auth.uid())
     and archived_at is null;

  if not found then
    raise exception 'Sub-goal was not found';
  end if;

  update public.actions
     set archived_at = archive_time
   where sub_goal_id = p_sub_goal_id
     and user_id = (select auth.uid())
     and archived_at is null;
end;
$$;

grant execute on function public.archive_sub_goal(uuid, uuid) to authenticated;
