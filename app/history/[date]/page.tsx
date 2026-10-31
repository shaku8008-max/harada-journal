import { notFound } from "next/navigation";

import { TopNav } from "@/components/top-nav";
import { addDays, compareDates, effectiveDate, isValidDateString, weekStart } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/require-user";
import { chartActionIds, mapChartGroups, type ChartData } from "@/lib/today-data";

import { HistoryControls } from "../history-controls";
import { TodayClient } from "../../today/today-client";

export const instant = false;

type HistoryDayProps = { params: Promise<{ date: string }> };

export default async function HistoryDayPage({ params }: HistoryDayProps) {
  const { date } = await params;
  const user = await requireUser();
  const supabase = await createClient();
  const { data: profile, error: profileError } = await supabase.from("profiles").select("timezone, day_start_hour").eq("id", user.id).single();
  if (profileError || !profile) throw new Error(profileError?.message ?? "Your profile is unavailable.");
  const currentDate = effectiveDate(new Date(), profile.timezone, profile.day_start_hour);
  if (!isValidDateString(date) || compareDates(date, currentDate) >= 0) notFound();

  const [{ data: charts, error: chartError }, { data: journal, error: journalError }] = await Promise.all([
    supabase.from("charts").select("id, status, started_at, archived_at").eq("user_id", user.id),
    supabase.from("journal_entries").select("body, mood, created_at, updated_at").eq("user_id", user.id).eq("entry_date", date).maybeSingle(),
  ]);
  if (chartError) throw new Error(chartError.message);
  if (journalError) throw new Error(journalError.message);

  const eligibleCharts = (charts ?? [])
    .map((chart) => ({ chart, startedAt: chart.started_at ?? "", startedDate: chart.started_at ? effectiveDate(new Date(chart.started_at), profile.timezone, profile.day_start_hour) : null, finishedDate: chart.archived_at ? effectiveDate(new Date(chart.archived_at), profile.timezone, profile.day_start_hour) : null }))
    .filter(({ chart, startedDate, finishedDate }) => Boolean(startedDate && startedDate <= date && (chart.status === "active" || (finishedDate && finishedDate >= date))))
    .sort((left, right) => right.startedDate!.localeCompare(left.startedDate!) || right.startedAt.localeCompare(left.startedAt));
  const selected = eligibleCharts[0]?.chart;
  let chart: ChartData | null = null;
  if (selected) {
    const { data: subGoals, error: subGoalError } = await supabase.from("sub_goals").select("id, title, position, archived_at").eq("chart_id", selected.id).eq("user_id", user.id);
    if (subGoalError) throw new Error(subGoalError.message);
    const subGoalIds = (subGoals ?? []).map((subGoal) => subGoal.id);
    const { data: actions, error: actionError } = subGoalIds.length
      ? await supabase.from("actions").select("id, sub_goal_id, title, position, kind, weekly_target, created_at, archived_at").in("sub_goal_id", subGoalIds).eq("user_id", user.id)
      : { data: [], error: null };
    if (actionError) throw new Error(actionError.message);
    chart = { sub_goals: (subGoals ?? []).map((subGoal) => ({ ...subGoal, actions: (actions ?? []).filter((action) => action.sub_goal_id === subGoal.id) })) };
  }
  const actionIds = chartActionIds(chart);
  const { data: logs, error: logsError } = actionIds.length === 0
    ? { data: [], error: null }
    : await supabase.from("action_logs").select("action_id, log_date").eq("user_id", user.id).in("action_id", actionIds);
  if (logsError) throw new Error(logsError.message);

  const logRows = (logs ?? []).map((log) => ({ actionId: log.action_id, date: log.log_date }));
  const groups = mapChartGroups(chart, date, profile.timezone, profile.day_start_hour, logRows);
  const readOnlyGroups = selected?.status === "archived" && selected.archived_at
    ? groups.map((group) => ({ ...group, actions: group.actions.map((action) => ({ ...action, archivedAt: action.archivedAt ?? selected.archived_at })) }))
    : groups;

  const previousDate = addDays(date, -1);
  const nextHref = compareDates(date, addDays(currentDate, -1)) < 0 ? `/history/${addDays(date, 1)}` : "/today";
  const start = weekStart(date);

  return (
    <main className="min-h-screen bg-transparent px-4 py-6 pb-24 text-[var(--ink)] sm:px-8 sm:py-10 md:pb-10">
      <div className="mx-auto w-full max-w-7xl"><TopNav active="history" /><section className="mx-auto max-w-2xl">
        <HistoryControls date={date} yesterday={addDays(currentDate, -1)} previousDate={previousDate} nextHref={nextHref} />
        <TodayClient userId={user.id} date={date} isHistory calendarDate={currentDate} dayStartHour={profile.day_start_hour} weekStart={start} groups={readOnlyGroups} logs={logRows} journal={journal ? { body: journal.body, mood: journal.mood, createdAt: journal.created_at, updatedAt: journal.updated_at } : null} />
      </section></div>
    </main>
  );
}
