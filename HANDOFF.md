# Harada Journal: Handoff

Read this first in a fresh session, then PLAN.md and AGENTS.md. This file is the current state and the next work. PLAN.md is the product plan; where they differ, this file reflects what is actually built.

## 1. What this is
A small web app (friends only, invite-only signup) for running a Harada Method (Open Window 64) goal chart plus a daily journal linked to it.
Stack: Next.js 16 (App Router, Turbopack, `cacheComponents` on, `proxy.ts` not `middleware.ts`) + TypeScript + Tailwind + shadcn/ui, Supabase (Postgres, Auth magic link, RLS), Vercel. Tests: Vitest (`npm test`). Dev: `npm run dev`.

## 2. Status

| Phase | What | State |
|---|---|---|
| 1 | Foundation, magic-link auth, profiles table + signup trigger | Done, deployed |
| 2 | Schema + RLS: charts, sub_goals, actions, journal_entries, action_logs | Done, applied |
| 3 / 3b | Wizard, 3x3 overview, expanded sub-goal view (`/?subGoal=N` style URL), edit dialogs, archive | Done |
| 4a-c | lib/dates.ts (+tests), /settings, nav, /today (checklist + journal autosave), /history + backfill, actions.created_at live-on-date rule | Done |
| 5 | lib/progress.ts (+tests), window selector week/30d/all, tile fills | Done (verify numbers by hand if not already) |
| Cleanup | Removed Three.js/framer-motion, dead code, explicit selects, archiveAction ownership fix, auth callback error handling | Done |
| 6a | Finish chart, /archive, /archive/[chartId] read-only, History for archived-chart dates | Done, verified shipped |
| 7a | Motion polish (tokens, slower easing, skeleton loading.tsx, pending nav, stagger, transform-based fills) | Done, verified shipped |
| 6b | Weekly review (/review) | Next, not built |
| 6c | Heatmap + streaks (/activity) | Done, shipped: 26-week heatmap, journal markers, current/longest streaks, and Today streak |
| 7b | PWA (manifest, icons), empty/error states, accessibility + real-phone pass | NOT built |
| Later | Data export (JSON/Markdown), reminders, optional sharing | Deferred |

## 3. Product decisions (locked)
- One active chart per user (partial unique index); finished charts are archived, read-only.
- 3x3 overview: main goal centre, 8 sub-goal tiles (positions 1-8 clockwise from top-left), each with its own colour. Tap a tile to expand to its 3x3 of actions. Empty tiles show hint text only (by position): 1 Financial, 2 Career & work, 3 Fitness & health, 4 Mindset & wellbeing, 5 Relationships, 6 Learning & skills, 7 Fun & hobbies, 8 Home & life admin.
- Actions are daily, weekly (weekly_target, default 3) or one_off. Never hard-delete actions or sub-goals; set archived_at. Archiving a sub-goal archives its actions in the same transaction (RPC).
- Weeks run Monday-Sunday (single constant WEEK_STARTS_ON in lib/dates.ts).
- "Today" = effectiveDate(now, profile.timezone, profile.day_start_hour). Day starts at a per-user hour (default 3am). Server clock only; never the browser clock for stored dates.
- An action is live on date D iff effectiveDate(created_at) <= D and (not archived or D < effectiveDate(archived_at)). Used by Today, History and server validation.
- Scoring (lib/progress.ts): daily = days logged / live days elapsed; weekly = average over overlapping weeks of min(1, logs/target); one_off = done ever; actions with no live days are excluded (not zero); sub-goal = mean of scored actions; overall = mean of scored sub-goals.
- Progress is never shown by colour alone (always a number/text).
- Activity fetches 400 days through the aggregated `daily_activity` RPC for streaks; the heatmap displays the last 26 weeks and labels the longest streak "Longest (past year)".
- Navigation keeps Chart, Today, History, Activity and More in the main bar. Archive and Settings are inside the accessible More menu; Weekly Review will fit in the main items when it ships.
- Style: calm, readable, light only (no dark mode yet), sans-serif body (Geist), serif for large headings only, 15px min text on phone, 44px tap targets, WCAG AA contrast.
- Signup is invite-only (disabled in Supabase; add users via dashboard).

## 4. Gotchas learned (do not repeat)
1. **Migrations vs deploys:** Vercel deploys code only. Apply new migrations with `npx supabase db push --linked` BEFORE pushing code that uses them, then regenerate types: `npx supabase gen types typescript --linked > lib/supabase/database.types.ts`. Check with `npx supabase migration list --linked`.
2. **Never edit an applied migration.** Add a new one. Watch for auto-named constraint clashes (a past push failed on `actions_weekly_target_check`).
3. **Profiles:** users created before the signup trigger existed had no profiles row and broke the app. New users get one via trigger. Fix for a missing row: insert it in the Supabase SQL editor.
4. **PostgREST embeds are ambiguous** between charts/sub_goals/actions because Phase 2 added composite ownership foreign keys. Use explicit FK hints or separate parallel queries, not bare `sub_goals(...)` embeds.
5. **cacheComponents:** any server code reading the clock needs `await connection()` first and the dynamic part inside `<Suspense>`. No "use cache" on per-user pages.
6. **`.single()` vs `.maybeSingle()`:** use `.maybeSingle()` wherever zero rows is legitimate (no active chart, no entry for a date, no review yet).
7. **Supabase returns max 1000 rows per request.** Anything that can exceed that (logs over "all time", heatmap) must paginate or use an RPC that aggregates.
8. **Read-only must be enforced on the server**, not only hidden in the UI: mutation actions must reject changes to rows of archived charts.
9. **Performance:** set Vercel function region to Sydney (syd1) to match Supabase. Parallelise independent queries; explicit columns only.
10. Animate only transform and opacity; progress fills use a scaled layer, not background-image.
11. **Daily activity:** apply `20261031000002_daily_activity.sql` before using `/activity` or Today streaks, then regenerate `lib/supabase/database.types.ts`. The security-invoker RPC aggregates action logs and journal activity and rejects ranges over 400 days.

## 5. Working rules (also in AGENTS.md)
- One phase per session; plan first (Plan mode), then Build mode. Small commits, one per numbered item. Run build, lint, tsc and `npm test` before saying done.
- RLS on every table, `(select auth.uid())` form, user_id ownership always derived from `getUser()`, never from the client. Use `getUser()`, not `getSession()`.
- No new dependencies without saying why. No placeholder secrets in `.env.example`; real keys only in `.env.local` (git-ignored). Never expose the service_role key.
- Keep it a simple productivity app: delete rather than abstract; no speculative modules.
- Use the code-review skill on a phase's commits before pushing.

## 6. Next features, in order

### 6b: Weekly review (/review)
- New migration: `weekly_reviews(id, user_id references auth.users, week_start date check Monday via extract(isodow from week_start)=1, worked text default '', change text default '', created_at, updated_at + trigger, unique(user_id, week_start))` with RLS select/insert/update/delete on `(select auth.uid()) = user_id`.
- Screen: one Monday-Sunday week at a time (default: last completed week if today is Mon-Wed, else current; prev/next; no future weeks). Show overall + per-sub-goal score (reuse lib/progress.ts week window, position colours), actions that fell short (weekly below target, daily logged < half the days), journal entries count and average mood, and two autosaving text boxes: "What worked" / "What to change next week" (localStorage draft + debounced upsert, status Saved / Saving… / Not saved. Retry).
- Server action validates week_start is a Monday and not in the future. Add to nav (or Settings if crowded at 390px). Add loading.tsx and an empty state.

### 6c: Heatmap and streaks (/activity) (shipped)
- New migration: SQL function `daily_activity(from_date date, to_date date)` (security invoker, `set search_path = ''`, uses auth.uid(), no user id parameter) returning log_date, actions_done, has_entry (non-empty body or mood).
- lib/streaks.ts (pure, tested first): current and longest streak. A day is active if actions_done > 0 or has_entry. The current streak is not broken by an empty today (counts back from yesterday until today has activity).
- Heatmap: last 26 weeks, Monday-start grid, 4 intensity levels by actions_done, distinct marker for journal-only days, legend, month labels, accessible cell names ("12 Oct: 5 actions, journal written"), horizontal scroll at 390px, plain CSS grid, no chart library. Show current streak (gentle, no guilt copy at 0) on /today too. Add loading.tsx.
- Streaks use a 400-day fetch window (the RPC maximum). The activity page labels the longest value "Longest (past year)".

### 7b: PWA and final polish
- manifest.webmanifest, icons, standalone display, theme colour; online-only writes (journal draft already autosaves locally). No full offline service worker.
- Friendly empty and error states everywhere, `error.tsx` boundaries, a final accessibility pass, check every screen at 390px and desktop on a real phone.

### Later
- Data export (JSON/Markdown), reminders (daily email via cron), optional chart sharing, dark mode (tokens are already variables).

## 7. Verify the current state before building
1. `git log --oneline -20` and `git status` (clean; `.env.local` not tracked).
2. `npx supabase migration list --linked` (nothing pending).
3. `npm run build`, `npm run lint`, `npx tsc --noEmit`, `npm test` all pass.
4. Click through /chart, /today, /history, /archive, /settings locally with no console or terminal errors.
5. Confirm what 6a and 7a actually shipped (see Status table) and update this file.

## 8. Open questions
- Whether weekly review should default to last week early in the week (assumed Mon-Wed).
