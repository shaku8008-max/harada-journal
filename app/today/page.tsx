import { TopNav } from "@/components/top-nav";
import { addDays, effectiveDate, weekStart } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/require-user";
import { actionIdsForKind, chartActionIds, mapChartGroups, type ChartData } from "@/lib/today-data";

import { TodayClient } from "./today-client";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageFallback } from "@/components/page-fallback";

export const instant = false;

export default function TodayPage() {
  return <Suspense fallback={<PageFallback label="Loading today..." />}><TodayPageContent /></Suspense>;
}

async function TodayPageContent() {
  await connection();
  const user = await requireUser();
  const supabase = await createClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("timezone, day_start_hour")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) throw new Error(profileError.message);
  if (!profile) redirect("/settings");

  const now = new Date();
  const date = effectiveDate(now, profile.timezone, profile.day_start_hour);
  const calendarDate = effectiveDate(now, profile.timezone, 0);
  const start = weekStart(date);
  const [{ data: chartData, error: chartError }, { data: journal, error: journalError }] = await Promise.all([
    supabase.from("charts").select("id, title, sub_goals!sub_goals_chart_id_fkey(id, title, position, archived_at, actions!actions_sub_goal_id_fkey(id, title, position, kind, weekly_target, created_at, archived_at))").eq("user_id", user.id).eq("status", "active").maybeSingle(),
    supabase.from("journal_entries").select("body, mood, created_at, updated_at").eq("user_id", user.id).eq("entry_date", date).maybeSingle(),
  ]);
  if (chartError) throw new Error(chartError.message);
  if (journalError) throw new Error(journalError.message);

  const chart = chartData as ChartData;
  const actionIds = chartActionIds(chart);
  const oneOffIds = actionIdsForKind(chart, "one_off");
  const [weekLogsResult, oneOffLogsResult] = await Promise.all([
    actionIds.length === 0
      ? Promise.resolve({ data: [], error: null })
      : supabase.from("action_logs").select("action_id, log_date").eq("user_id", user.id).in("action_id", actionIds).gte("log_date", start).lte("log_date", date),
    oneOffIds.length === 0
      ? Promise.resolve({ data: [], error: null })
      : supabase.from("action_logs").select("action_id, log_date").eq("user_id", user.id).in("action_id", oneOffIds),
  ]);
  if (weekLogsResult.error) throw new Error(weekLogsResult.error.message);
  if (oneOffLogsResult.error) throw new Error(oneOffLogsResult.error.message);
  const logs = [...(weekLogsResult.data ?? []), ...(oneOffLogsResult.data ?? [])];
  const logRows = logs.map((log) => ({ actionId: log.action_id, date: log.log_date }));
  const groups = mapChartGroups(chart, date, profile.timezone, profile.day_start_hour, logRows);

  return (
    <main className="min-h-screen bg-transparent px-4 py-6 pb-24 text-[var(--ink)] sm:px-8 sm:py-10 md:pb-10">
      <div className="mx-auto w-full max-w-7xl"><TopNav active="today" /><section className="mx-auto max-w-2xl">
        <TodayClient userId={user.id} date={date} yesterday={addDays(date, -1)} calendarDate={calendarDate} dayStartHour={profile.day_start_hour} weekStart={start} groups={groups} logs={logRows} journal={journal ? { body: journal.body, mood: journal.mood, createdAt: journal.created_at, updatedAt: journal.updated_at } : null} />
      </section></div>
    </main>
  );
}
