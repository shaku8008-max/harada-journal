import { notFound } from "next/navigation";

import { ChartEditor } from "@/components/chart-editor";
import { TopNav } from "@/components/top-nav";
import { getActionLogsForProgress, getArchivedChart } from "@/lib/charts";
import { effectiveDate } from "@/lib/dates";
import { calculateProgress, progressWindowStart, type ProgressWindow } from "@/lib/progress";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/require-user";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageFallback } from "@/components/page-fallback";

export const instant = false;

function dateLabel(value: string | null) {
  return value ? new Intl.DateTimeFormat("en-AU", { dateStyle: "long" }).format(new Date(value)) : "Unknown";
}

type ArchivedChartPageProps = { params: Promise<{ chartId: string }>; searchParams: Promise<{ subGoal?: string | string[] | undefined; window?: string | string[] | undefined }> };

export default function ArchivedChartPage(props: ArchivedChartPageProps) {
  return <Suspense fallback={<PageFallback label="Loading this archived chart..." />}><ArchivedChartPageContent {...props} /></Suspense>;
}

async function ArchivedChartPageContent({ params, searchParams }: ArchivedChartPageProps) {
  await connection();
  const { chartId } = await params;
  const user = await requireUser();
  const query = await searchParams;
  const supabase = await createClient();
  const [{ data: profile, error: profileError }, chartData] = await Promise.all([
    supabase.from("profiles").select("timezone, day_start_hour").eq("id", user.id).maybeSingle(),
    getArchivedChart(user.id, chartId),
  ]);
  if (profileError) throw new Error(profileError.message);
  if (!profile) redirect("/settings");
  if (!chartData || !chartData.chart.archived_at) notFound();

  const today = effectiveDate(new Date(chartData.chart.archived_at), profile.timezone, profile.day_start_hour);
  const chartStartDate = chartData.chart.started_at ? effectiveDate(new Date(chartData.chart.started_at), profile.timezone, profile.day_start_hour) : today;
  const window: ProgressWindow = "all";
  const progressStart = progressWindowStart({ window, today, chartStartDate });
  const logs = await getActionLogsForProgress(user.id, chartData.actions.map((action) => action.id), chartData.actions.filter((action) => action.kind === "one_off").map((action) => action.id), progressStart, today);
  const progress = calculateProgress({
    actions: chartData.actions.map((action) => ({ id: action.id, subGoalId: action.sub_goal_id, kind: action.kind, weeklyTarget: action.weekly_target, createdAt: action.created_at, archivedAt: action.archived_at })),
    logs: logs.map((log) => ({ actionId: log.action_id, logDate: log.log_date })),
    timezone: profile.timezone,
    dayStartHour: profile.day_start_hour,
    today,
    chartStartDate,
    window,
  });
  const rawSubGoal = Array.isArray(query.subGoal) ? query.subGoal[0] : query.subGoal;
  const parsedSubGoal = rawSubGoal ? Number(rawSubGoal) : NaN;
  const expandedPosition = Number.isInteger(parsedSubGoal) && parsedSubGoal >= 1 && parsedSubGoal <= 8 ? parsedSubGoal : null;

  return (
    <main className="min-h-screen bg-transparent px-4 py-6 pb-24 text-[var(--ink)] sm:px-8 sm:py-10 md:pb-10">
      <div className="mx-auto w-full max-w-7xl"><TopNav active="archive" /><header className="mx-auto mb-8 max-w-4xl"><p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--muted-ink)]">Read-only archive</p><h1 className="mt-3 text-4xl tracking-tight sm:text-5xl">{chartData.chart.title}</h1><p className="mt-3 text-base leading-7 text-[var(--muted-ink)]">Finished {dateLabel(chartData.chart.archived_at)} · Final score {progress.overallScore === null ? "—" : `${Math.round(progress.overallScore * 100)}%`}</p></header><ChartEditor data={chartData} expandedPosition={expandedPosition} progress={progress} window={window} readOnly /></div>
    </main>
  );
}
