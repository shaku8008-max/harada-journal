alter table public.actions
  add column created_at timestamptz;

update public.actions as actions
set created_at = coalesce(charts.started_at, now())
from public.sub_goals as sub_goals
join public.charts as charts on charts.id = sub_goals.chart_id
where actions.sub_goal_id = sub_goals.id;

alter table public.actions
  alter column created_at set default now(),
  alter column created_at set not null;
