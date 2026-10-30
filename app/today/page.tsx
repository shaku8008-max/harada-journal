import { TopNav } from "@/components/top-nav";
import { effectiveDate, weekStart } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/require-user";

import { TodayClient } from "./today-client";

export const instant = false;

type ChartRow = {
  id: string;
  title: string;
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

export default async function TodayPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("timezone, day_start_hour")
    .eq("id", user.id)
    .single();
  if (profileError || !profile) throw new Error(profileError?.message ?? "Your profile is unavailable.");

  const now = new Date();
  const date = effectiveDate(now, profile.timezone, profile.day_start_hour);
  const calendarDate = effectiveDate(now, profile.timezone, 0);
  const start = weekStart(date);
  const [{ data: chartData, error: chartError }, { data: journal, error: journalError }] = await Promise.all([
    supabase.from("charts").select("id, title, sub_goals(id, title, position, archived_at, actions(id, title, position, kind, weekly_target, archived_at))").eq("user_id", user.id).eq("status", "active").maybeSingle(),
    supabase.from("journal_entries").select("body, mood, created_at, updated_at").eq("user_id", user.id).eq("entry_date", date).maybeSingle(),
  ]);
  if (chartError) throw new Error(chartError.message);
  if (journalError) throw new Error(journalError.message);

  const chart = chartData as ChartRow | null;
  const groups = (chart?.sub_goals ?? []).filter((group) => !group.archived_at).sort((a, b) => a.position - b.position).map((group) => ({
    id: group.id,
    title: group.title,
    position: group.position,
    actions: group.actions.filter((action) => !action.archived_at && ["daily", "weekly", "one_off"].includes(action.kind)).sort((a, b) => a.position - b.position).map((action) => ({
      id: action.id,
      title: action.title,
      position: action.position,
      kind: action.kind as "daily" | "weekly" | "one_off",
      weeklyTarget: action.weekly_target,
      archivedAt: action.archived_at,
    })),
  }));
  const actionIds = groups.flatMap((group) => group.actions.map((action) => action.id));
  const oneOffIds = groups.flatMap((group) => group.actions.filter((action) => action.kind === "one_off").map((action) => action.id));
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

  return (
    <main className="min-h-screen bg-[var(--paper)] px-4 py-6 pb-24 text-[var(--ink)] sm:px-8 sm:py-10 md:pb-10">
      <div className="mx-auto w-full max-w-7xl"><TopNav active="today" /><section className="mx-auto max-w-2xl">
        <TodayClient userId={user.id} date={date} calendarDate={calendarDate} dayStartHour={profile.day_start_hour} weekStart={start} groups={groups} logs={(logs ?? []).map((log) => ({ actionId: log.action_id, date: log.log_date }))} journal={journal ? { body: journal.body, mood: journal.mood, createdAt: journal.created_at, updatedAt: journal.updated_at } : null} />
      </section></div>
    </main>
  );
}
