create table public.charts (
  id uuid primary key,
  user_id uuid not null,
  title text not null,
  why text,
  target_date date,
  status text not null default 'active' check (status in ('active', 'archived')),
  started_at timestamptz default now(),
  archived_at timestamptz
);

create unique index one_active_chart
  on public.charts(user_id)
  where status = 'active';

create table public.sub_goals (
  id uuid primary key,
  user_id uuid not null,
  chart_id uuid not null references public.charts(id),
  position smallint not null check (position between 1 and 8),
  title text not null,
  archived_at timestamptz
);

create unique index sub_goal_slot
  on public.sub_goals(chart_id, position)
  where archived_at is null;

create table public.actions (
  id uuid primary key,
  user_id uuid not null,
  sub_goal_id uuid not null references public.sub_goals(id),
  position smallint not null check (position between 1 and 8),
  title text not null,
  kind text not null check (kind in ('daily', 'weekly', 'one_off')),
  weekly_target smallint check (weekly_target between 1 and 7),
  archived_at timestamptz
);

create unique index action_slot
  on public.actions(sub_goal_id, position)
  where archived_at is null;

create table public.journal_entries (
  id uuid primary key,
  user_id uuid not null,
  entry_date date not null,
  body text not null default '',
  mood smallint check (mood between 1 and 5),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, entry_date)
);

create table public.action_logs (
  id uuid primary key,
  user_id uuid not null,
  action_id uuid not null references public.actions(id),
  log_date date not null,
  created_at timestamptz default now(),
  unique (action_id, log_date)
);
