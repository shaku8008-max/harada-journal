# Harada Journal — Product & Build Plan

A web app (installable PWA) for a small group of friends to run a Harada Method goal chart (Open Window 64) and a daily journal that is wired into it.

## 1. Decisions (locked in)

| Area | Decision |
|---|---|
| Core | Full Open Window 64: 1 main goal -> 8 sub-goals -> 8 actions each (9x9 grid) is the heart of the app |
| Users | Me + a few friends. Multi-user, magic-link login, **fully private** (no sharing in v1) |
| Devices | Desktop and phone equally. Responsive, installable PWA, online-only writes |
| Journal entry | Free text + check off which actions were done that day (+ optional mood) |
| Charts | One active chart per user; finished charts are archived and can start a new one |
| Action types | Each action is `daily`, `weekly` (N times per week), or `one_off` |
| Progress view | The 9x9 grid itself is the dashboard: cells are coloured by completion |
| Day boundary | Per-user timezone + "day starts at" hour (default 3am) |
| Edit history | Never hard-delete; archive actions/sub-goals. History stays intact |
| Backfill | Any past day can be edited; created/updated timestamps kept |
| Reminders | Not in v1 |
| Stack | Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, Supabase (Postgres, Auth, RLS), Vercel |
| Deferred | Data export (JSON/Markdown) |

**Scope warning:** the only thing you cut is export, so v1 still includes weekly review, heatmap/streaks and archived-chart browsing. Build them in the order below and treat Phases 5-6 as "ship without them if needed".

## 2. How the Harada grid maps to data

The 9x9 grid is 9 blocks of 3x3. The centre block holds the main goal in its middle cell and the 8 sub-goals around it. Each of the 8 outer blocks holds one sub-goal in its middle cell and that sub-goal's 8 actions around it.

- Positions 1-8 go clockwise from top-left around the centre of each block.
- A sub-goal appears twice on screen (ring of the centre block, and middle of its own block). Both render from **one** database row so they can never drift apart.

## 3. Database schema (Supabase / Postgres)

All tables carry a denormalised `user_id` so RLS is a one-line policy: `user_id = auth.uid()`.

```sql
profiles(
  id uuid pk references auth.users,
  display_name text,
  timezone text not null default 'Australia/Melbourne',
  day_start_hour smallint not null default 3 check (day_start_hour between 0 and 6),
  created_at timestamptz default now()
)

charts(
  id uuid pk, user_id uuid not null,
  title text not null,              -- the main goal
  why text,                         -- optional motivation / deadline notes
  target_date date,
  status text not null default 'active' check (status in ('active','archived')),
  started_at timestamptz default now(), archived_at timestamptz
)
-- one active chart per user:
create unique index one_active_chart on charts(user_id) where status = 'active';

sub_goals(
  id uuid pk, user_id uuid not null, chart_id uuid not null references charts,
  position smallint not null check (position between 1 and 8),
  title text not null, archived_at timestamptz
)
create unique index sub_goal_slot on sub_goals(chart_id, position) where archived_at is null;

actions(
  id uuid pk, user_id uuid not null, sub_goal_id uuid not null references sub_goals,
  position smallint not null check (position between 1 and 8),
  title text not null,
  kind text not null check (kind in ('daily','weekly','one_off')),
  weekly_target smallint check (weekly_target between 1 and 7),  -- required when kind='weekly'
  archived_at timestamptz
)
create unique index action_slot on actions(sub_goal_id, position) where archived_at is null;

journal_entries(
  id uuid pk, user_id uuid not null,
  entry_date date not null,          -- the *effective* date, see section 5
  body text not null default '',
  mood smallint check (mood between 1 and 5),
  created_at timestamptz default now(), updated_at timestamptz default now(),
  unique (user_id, entry_date)
)

action_logs(                          -- row exists = done that day
  id uuid pk, user_id uuid not null, action_id uuid not null references actions,
  log_date date not null,
  created_at timestamptz default now(),
  unique (action_id, log_date)
)
```

Notes:
- Partial unique indexes (`where archived_at is null`) mean archiving an action frees its grid slot for a replacement while old logs still point at the archived row.
- One-off actions: completed when an `action_logs` row exists for them (any date).
- Enable RLS on every table. Policies: select/insert/update/delete only where `user_id = auth.uid()`. Add a trigger or check so a child row's `user_id` must match its parent's.
- Create a `profiles` row via a trigger on `auth.users` insert.
- Keep all schema in `supabase/migrations/*.sql` in the repo (Supabase CLI), never click-ops only.

## 4. Progress calculation

Compute in a pure, unit-tested TypeScript module first (move to SQL later only if slow).

- **daily action**: days logged / days elapsed in the window
- **weekly action**: min(1, logs this week / weekly_target)
- **one-off action**: 0 or 1
- **sub-goal score**: average of its non-archived actions
- **main goal score**: average of sub-goal scores
- Window selector for the grid: "this week" (default), "last 30 days", "whole chart"
- Cell colour: a sequential scale from empty to full (use colour **and** a small percentage/ring so it is not colour-only)

## 5. Day boundary logic (important, get this right early)

```ts
// effectiveDate(nowUtc, timezone, dayStartHour) -> 'YYYY-MM-DD'
// local = nowUtc converted to timezone; subtract dayStartHour hours; take the date.
```

- Journaling at 12:30am with a 3am day start counts toward the day you are ending.
- Compute this on the server (or a shared util) and store the resulting `date`; never rely on the browser clock for the stored date.
- Unit tests required: just before/after midnight, just before/after the day-start hour, and **daylight-saving transitions** (Melbourne moves clocks in early October and April).

## 6. Screens

1. **Login**: email magic link.
2. **Onboarding**: create your chart (main goal, then sub-goals, then actions). Allow saving partially filled; a grid with empty cells is fine.
3. **Chart (home)**: the 9x9 grid. Desktop: full grid with text. Phone: colour-only overview, tap a block to zoom into a readable 3x3. Tap a cell to edit title/type/archive.
4. **Today**: date (effective), journal textarea with local draft autosave, mood, and a checklist of today's relevant actions (all daily, weekly ones still short of target, open one-offs), grouped by sub-goal.
5. **History**: list/calendar of past entries; open any day to edit or backfill.
6. **Weekly review**: per sub-goal summary for the week plus a "what worked / what to change" free-text box.
7. **Heatmap & streaks**: GitHub-style calendar of days with a journal entry or any action done.
8. **Archive**: finished charts, read-only, with final scores.
9. **Settings**: display name, timezone, day-starts-at hour.

## 7. Auth & access

- Supabase Auth, email magic link.
- **Recommended:** turn off open signups in Supabase and invite friends from the dashboard so strangers cannot create accounts on your free tier. (Open decision, see section 10.)
- Use `@supabase/ssr` so sessions work with Next.js server components and middleware.

## 8. PWA

- `manifest.webmanifest`, icons, `display: standalone`, theme colour.
- Online-only writes. Autosave the in-progress journal text to `localStorage` per date so a dropped connection never loses text; show a clear "not saved / retry" state.
- Skip a full offline service worker in v1.

## 9. Build phases (one OpenCode session per phase)

1. **Foundation**: Next.js + Tailwind + shadcn/ui scaffold, Supabase project, `@supabase/ssr`, magic-link login, profiles table + trigger, protected routes, Vercel deploy with env vars.
2. **Schema + RLS**: migrations for all tables, RLS policies, a seed script. Write tests that user A cannot read user B's rows.
3. **Chart builder**: create chart, edit sub-goals/actions, archive, the 9x9 grid component with the desktop layout and mobile zoom-in.
4. **Today + journal**: `effectiveDate` util with tests, Today screen, action check-offs, journal save + draft autosave, history and backfill.
5. **Progress colouring**: the progress module with tests, grid colouring, window selector.
6. **Extras**: weekly review, heatmap/streaks, archived-chart browsing.
7. **Polish**: PWA manifest/icons, empty states, error states, accessibility pass, mobile pass on a real phone.
8. **Later**: data export, reminders, optional sharing.

## 10. Still open (decide before or during Phase 1)

- Invite-only signup vs open signup (recommended: invite-only).
- Whether weekly `weekly_target` is chosen per action or defaults to 3.
- Exact colour scale and whether to offer a dark mode (suggest: yes, via Tailwind, cheap early and painful later).
- Supabase free projects pause after a period of inactivity; fine for friends, but know it exists.

## 11. Suggested `AGENTS.md` for the repo (OpenCode reads this)

```md
# Harada Journal
Next.js App Router + TypeScript + Tailwind + shadcn/ui, Supabase, Vercel.

## Rules
- Read PLAN.md before any task. Implement only the current phase.
- All schema changes go in supabase/migrations as SQL. Never edit the DB by hand.
- Every table has RLS with user_id = auth.uid(). Add a test for any new table.
- Never store dates from the browser clock. Use effectiveDate() from lib/dates.ts.
- Never hard-delete actions or sub-goals; set archived_at.
- Progress logic lives in lib/progress.ts as pure functions with unit tests.
- Mobile first: check every screen at 390px wide.
- Run typecheck, lint and tests before saying a task is done.
```

## 12. Tips for working with OpenCode

- Give it PLAN.md and AGENTS.md first, then ask for **one phase at a time** and review the diff before moving on.
- Ask it to write the SQL migration and RLS tests before the UI that depends on them.
- Ask for the unit tests on `effectiveDate` and progress calculation explicitly; they are the likeliest places for subtle bugs.
- Commit after every phase so a bad generation is easy to roll back.
