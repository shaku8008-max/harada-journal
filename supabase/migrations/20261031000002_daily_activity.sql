create or replace function public.daily_activity(from_date date, to_date date)
returns table (
  log_date date,
  actions_done int,
  has_entry boolean
)
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if from_date is null or to_date is null then
    raise exception 'from_date and to_date are required';
  end if;

  if from_date > to_date then
    raise exception 'from_date must not be after to_date';
  end if;

  if to_date - from_date >= 400 then
    raise exception 'date range must not exceed 400 days';
  end if;

  return query
  with logs as (
    select
      al.log_date,
      count(*)::int as actions_done
    from public.action_logs as al
    where al.user_id = (select auth.uid())
      and al.log_date between from_date and to_date
    group by al.log_date
  ),
  entries as (
    select
      je.entry_date as log_date,
      true as has_entry
    from public.journal_entries as je
    where je.user_id = (select auth.uid())
      and je.entry_date between from_date and to_date
      and (trim(je.body) <> '' or je.mood is not null)
  )
  select
    coalesce(logs.log_date, entries.log_date) as log_date,
    coalesce(logs.actions_done, 0)::int as actions_done,
    coalesce(entries.has_entry, false) as has_entry
  from logs
  full outer join entries using (log_date)
  where logs.log_date is not null or entries.log_date is not null
  order by log_date;
end;
$$;
