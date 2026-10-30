import { notFound } from "next/navigation";

import { TopNav } from "@/components/top-nav";
import { addDays, compareDates, effectiveDate, isValidDateString, weekStart } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/require-user";

import { HistoryControls } from "../history-controls";
import { TodayClient, type Group } from "../../today/today-client";

export const instant = false;

type HistoryDayProps = { params: Promise<{ date: string }> };

type ChartRow = {
  sub_goals: Array<{
    id: string;
    title: string;
    position: number;
    archived_at: string | null;
    actions: Array<{
      id: string;
      title: string;
      position: number;
      kind: string;
      weekly_target: number | null;
      archived_at: string | null;
    }>;
  }>;
};

export default async function HistoryDayPage({ params }: HistoryDayProps) {
  const { date } = await params;
  const user = await requireUser();
  const supabase = await createClient();
  const { data: profile, error: profileError } = await supabase.from("profiles").select("timezone, day_start_hour").eq("id", user.id).single();
  if (profileError || !profile) throw new Error(profileError?.message ?? "Your profile is unavailable.");
  const currentDate = effectiveDate(new Date(), profile.timezone, profile.day_start_hour);
  if (!isValidDateString(date) || compareDates(date, currentDate) >= 0) notFound();

  const [{ data: chartData, error: chartError }, { data: journal, error: journalError }] = await Promise.all([
    supabase.from("charts").select("sub_goals(id, title, position, archived_at, actions(id, title, position, kind, weekly_target, archived_at))").eq("user_id", user.id).eq("status", "active").maybeSingle(),
    supabase.from("journal_entries").select("body, mood, created_at, updated_at").eq("user_id", user.id).eq("entry_date", date).maybeSingle(),
  ]);
  if (chartError) throw new Error(chartError.message);
  if (journalError) throw new Error(journalError.message);

  const chart = chartData as ChartRow | null;
  const actionIds = (chart?.sub_goals ?? []).flatMap((group) => group.actions.map((action) => action.id));
  const { data: logs, error: logsError } = actionIds.length === 0
    ? { data: [], error: null }
    : await supabase.from("action_logs").select("action_id, log_date").eq("user_id", user.id).in("action_id", actionIds);
  if (logsError) throw new Error(logsError.message);

  const logRows = logs ?? [];
  const loggedOnDate = new Set(logRows.filter((log) => log.log_date === date).map((log) => log.action_id));
  const loggedBeforeDate = new Set(logRows.filter((log) => log.log_date <= date).map((log) => log.action_id));
  const groups: Group[] = (chart?.sub_goals ?? []).filter((group) => !group.archived_at || group.archived_at.slice(0, 10) > date).sort((a, b) => a.position - b.position).map((group) => ({
    id: group.id,
    title: group.title,
    position: group.position,
    actions: group.actions.filter((action) => {
      const existed = !action.archived_at || action.archived_at.slice(0, 10) > date || loggedOnDate.has(action.id);
      const oneOffStillOpen = action.kind !== "one_off" || !loggedBeforeDate.has(action.id) || loggedOnDate.has(action.id);
      return existed && oneOffStillOpen;
    }).sort((a, b) => a.position - b.position).map((action) => ({
      id: action.id,
      title: action.title,
      position: action.position,
      kind: action.kind as "daily" | "weekly" | "one_off",
      weeklyTarget: action.weekly_target,
      archivedAt: action.archived_at,
    })),
  })).filter((group) => group.actions.length > 0);

  const previousDate = addDays(date, -1);
  const nextHref = compareDates(date, addDays(currentDate, -1)) < 0 ? `/history/${addDays(date, 1)}` : "/today";
  const start = weekStart(date);

  return (
    <main className="min-h-screen bg-[var(--paper)] px-4 py-6 pb-24 text-[var(--ink)] sm:px-8 sm:py-10 md:pb-10">
      <div className="mx-auto w-full max-w-7xl"><TopNav active="history" /><section className="mx-auto max-w-2xl">
        <HistoryControls date={date} currentDate={currentDate} yesterday={addDays(currentDate, -1)} previousDate={previousDate} nextHref={nextHref} />
        <TodayClient userId={user.id} date={date} isHistory calendarDate={currentDate} dayStartHour={profile.day_start_hour} weekStart={start} groups={groups} logs={logRows.map((log) => ({ actionId: log.action_id, date: log.log_date }))} journal={journal ? { body: journal.body, mood: journal.mood, createdAt: journal.created_at, updatedAt: journal.updated_at } : null} />
      </section></div>
    </main>
  );
}
