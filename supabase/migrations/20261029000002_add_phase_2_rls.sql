alter table public.charts enable row level security;
alter table public.sub_goals enable row level security;
alter table public.actions enable row level security;
alter table public.journal_entries enable row level security;
alter table public.action_logs enable row level security;

create policy "Users can view their own charts"
  on public.charts
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can create their own charts"
  on public.charts
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update their own charts"
  on public.charts
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can delete their own charts"
  on public.charts
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can view their own sub-goals"
  on public.sub_goals
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can create their own sub-goals"
  on public.sub_goals
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update their own sub-goals"
  on public.sub_goals
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can view their own actions"
  on public.actions
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can create their own actions"
  on public.actions
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update their own actions"
  on public.actions
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can view their own journal entries"
  on public.journal_entries
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can create their own journal entries"
  on public.journal_entries
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update their own journal entries"
  on public.journal_entries
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can delete their own journal entries"
  on public.journal_entries
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can view their own action logs"
  on public.action_logs
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can create their own action logs"
  on public.action_logs
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update their own action logs"
  on public.action_logs
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can delete their own action logs"
  on public.action_logs
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

grant select, insert, update, delete on table public.charts to authenticated;
grant select, insert, update on table public.sub_goals to authenticated;
grant select, insert, update on table public.actions to authenticated;
grant select, insert, update, delete on table public.journal_entries to authenticated;
grant select, insert, update, delete on table public.action_logs to authenticated;
