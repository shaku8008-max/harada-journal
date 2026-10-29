alter table public.actions
  add constraint actions_weekly_target_check
  check (
    (kind = 'weekly' and weekly_target is not null)
    or (kind <> 'weekly' and weekly_target is null)
  );

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_journal_entries_updated_at
  before update on public.journal_entries
  for each row execute procedure public.set_updated_at();

create index action_logs_user_id_log_date_idx
  on public.action_logs(user_id, log_date);

create index journal_entries_user_id_entry_date_idx
  on public.journal_entries(user_id, entry_date);

create index sub_goals_chart_id_idx
  on public.sub_goals(chart_id);

create index actions_sub_goal_id_idx
  on public.actions(sub_goal_id);
