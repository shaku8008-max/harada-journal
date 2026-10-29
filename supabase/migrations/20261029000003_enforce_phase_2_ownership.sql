-- A foreign key on the parent id alone would still allow a child to claim
-- another user's parent. These composite keys make the owner part of the
-- relationship, so both ids must match the same parent row.
alter table public.charts
  add constraint charts_id_user_id_key unique (id, user_id);

alter table public.sub_goals
  add constraint sub_goals_chart_user_id_fkey
  foreign key (chart_id, user_id)
  references public.charts (id, user_id);

alter table public.sub_goals
  add constraint sub_goals_id_user_id_key unique (id, user_id);

alter table public.actions
  add constraint actions_sub_goal_user_id_fkey
  foreign key (sub_goal_id, user_id)
  references public.sub_goals (id, user_id);

alter table public.actions
  add constraint actions_id_user_id_key unique (id, user_id);

alter table public.action_logs
  add constraint action_logs_action_user_id_fkey
  foreign key (action_id, user_id)
  references public.actions (id, user_id);
