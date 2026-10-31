import { getActiveChart } from "@/lib/charts";
import { requireUser } from "@/lib/supabase/require-user";
import { ChartWizard } from "@/components/chart-wizard";
import { ChartEditor } from "@/components/chart-editor";
import { TopNav } from "@/components/top-nav";
import { signOut } from "@/app/actions";
import { calculateProgress, progressWindowStart, type ProgressWindow } from "@/lib/progress";
import { effectiveDate } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { getActionLogsForProgress } from "@/lib/charts";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageFallback } from "@/components/page-fallback";

export const instant = false;

export default function ChartPage(props: {
  searchParams: Promise<{ subGoal?: string | string[] | undefined; window?: string | string[] | undefined }>;
}) {
  return <Suspense fallback={<PageFallback />}><ChartPageContent {...props} /></Suspense>;
}

async function ChartPageContent({
  searchParams,
}: {
  searchParams: Promise<{ subGoal?: string | string[] | undefined; window?: string | string[] | undefined }>;
}) {
  await connection();
  const user = await requireUser();
  const query = await searchParams;
  const supabase = await createClient();
  const [chartData, profileResult] = await Promise.all([
    getActiveChart(user.id),
    supabase.from("profiles").select("timezone, day_start_hour").eq("id", user.id).maybeSingle(),
  ]);
  if (profileResult.error) throw new Error(profileResult.error.message);
  if (!profileResult.data) redirect("/settings");
  const profile = profileResult.data;
  const rawWindow = Array.isArray(query.window) ? query.window[0] : query.window;
  const window: ProgressWindow = rawWindow === "30d" || rawWindow === "all" ? rawWindow : "week";
  const rawSubGoal = Array.isArray(query.subGoal) ? query.subGoal[0] : query.subGoal;
  const parsedSubGoal = rawSubGoal ? Number(rawSubGoal) : NaN;
  const expandedPosition = Number.isInteger(parsedSubGoal) && parsedSubGoal >= 1 && parsedSubGoal <= 8 ? parsedSubGoal : null;

  const now = new Date();
  const today = effectiveDate(now, profile.timezone, profile.day_start_hour);
  const chartStartDate = chartData?.chart.started_at
    ? effectiveDate(new Date(chartData.chart.started_at), profile.timezone, profile.day_start_hour)
    : today;
  const progressStart = progressWindowStart({ window, today, chartStartDate });
  const logs = chartData
    ? await getActionLogsForProgress(
        user.id,
        chartData.actions.map((action) => action.id),
        chartData.actions.filter((action) => action.kind === "one_off").map((action) => action.id),
        progressStart,
        today,
      )
    : [];
  const progress = chartData
    ? calculateProgress({
        actions: chartData.actions.map((action) => ({
          id: action.id,
          subGoalId: action.sub_goal_id,
          kind: action.kind,
          weeklyTarget: action.weekly_target,
          createdAt: action.created_at,
          archivedAt: action.archived_at,
        })),
        logs: logs.map((log) => ({ actionId: log.action_id, logDate: log.log_date })),
        timezone: profile.timezone,
        dayStartHour: profile.day_start_hour,
        today,
        chartStartDate,
        window,
      })
    : null;

  return (
    <main className="min-h-screen bg-transparent px-4 py-6 pb-24 text-[var(--ink)] sm:px-8 sm:py-10 md:pb-10">
      <div className="mx-auto w-full max-w-7xl">
        <TopNav active="chart" />
        <header className="mb-10 flex items-start justify-between gap-4 border-b border-[var(--line)]/70 pb-7">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--muted-ink)]">Harada Journal</p>
            <p className="mt-2 text-sm text-[var(--muted-ink)]">Your goal, opened out.</p>
          </div>
          <form action={signOut}>
            <button type="submit" className="min-h-11 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">Sign out</button>
          </form>
        </header>
        {chartData ? <ChartEditor data={chartData} expandedPosition={expandedPosition} progress={progress!} window={window} /> : <ChartWizard />}
      </div>
    </main>
  );
}
