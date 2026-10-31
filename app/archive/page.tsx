import Link from "next/link";

import { TopNav } from "@/components/top-nav";
import { getArchivedCharts, getActionLogsForProgress } from "@/lib/charts";
import { effectiveDate } from "@/lib/dates";
import { calculateProgress, progressWindowStart } from "@/lib/progress";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/require-user";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageFallback } from "@/components/page-fallback";

export const instant = false;

function dateLabel(value: string | null) {
  return value ? new Intl.DateTimeFormat("en-AU", { dateStyle: "medium" }).format(new Date(value)) : "Unknown";
}

export default function ArchivePage() {
  return <Suspense fallback={<PageFallback label="Loading your archive..." />}><ArchivePageContent /></Suspense>;
}

async function ArchivePageContent() {
  await connection();
  const user = await requireUser();
  const supabase = await createClient();
  const [{ data: profile, error: profileError }, charts] = await Promise.all([
    supabase.from("profiles").select("timezone, day_start_hour").eq("id", user.id).maybeSingle(),
    getArchivedCharts(user.id),
  ]);
  if (profileError) throw new Error(profileError.message);
  if (!profile) redirect("/settings");

  const scoredCharts = await Promise.all(charts.map(async (chart) => {
    const today = chart.chart.archived_at ? effectiveDate(new Date(chart.chart.archived_at), profile.timezone, profile.day_start_hour) : effectiveDate(new Date(), profile.timezone, profile.day_start_hour);
    const chartStartDate = chart.chart.started_at ? effectiveDate(new Date(chart.chart.started_at), profile.timezone, profile.day_start_hour) : today;
    const startDate = progressWindowStart({ window: "all", today, chartStartDate });
    const logs = await getActionLogsForProgress(user.id, chart.actions.map((action) => action.id), chart.actions.filter((action) => action.kind === "one_off").map((action) => action.id), startDate, today);
    const progress = calculateProgress({
      actions: chart.actions.map((action) => ({ id: action.id, subGoalId: action.sub_goal_id, kind: action.kind, weeklyTarget: action.weekly_target, createdAt: action.created_at, archivedAt: action.archived_at })),
      logs: logs.map((log) => ({ actionId: log.action_id, logDate: log.log_date })),
      timezone: profile.timezone,
      dayStartHour: profile.day_start_hour,
      today,
      chartStartDate,
      window: "all",
    });
    return { chart, score: progress.overallScore };
  }));

  return (
    <main className="min-h-screen bg-transparent px-4 py-6 pb-24 text-[var(--ink)] sm:px-8 sm:py-10 md:pb-10">
      <div className="mx-auto w-full max-w-7xl"><TopNav active="archive" /><section className="mx-auto max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--muted-ink)]">Archive</p>
        <h1 className="mt-3 text-4xl tracking-tight sm:text-5xl">Finished chapters.</h1>
        <p className="mt-3 text-base leading-7 text-[var(--muted-ink)]">Your completed charts stay here, with their history intact.</p>
        {scoredCharts.length === 0 ? <div className="mt-8 rounded-3xl border border-dashed border-[var(--line)] bg-[var(--surface)]/70 p-8 text-center"><h2 className="text-xl">No finished charts yet.</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--muted-ink)]">When you finish a chart, it will become a read-only chapter here.</p><Link href="/chart" className="mt-5 inline-flex min-h-11 items-center rounded-full bg-[var(--accent)] px-5 text-sm font-medium text-[var(--accent-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">Open your chart</Link></div> : <div className="mt-8 grid gap-4">{scoredCharts.map(({ chart, score }) => <Link key={chart.chart.id} href={`/archive/${chart.chart.id}`} className="rounded-3xl border border-[var(--line)] bg-[var(--surface)]/90 p-5 transition-[border-color,transform] hover:-translate-y-0.5 hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-2xl">{chart.chart.title}</h2><p className="mt-2 text-sm text-[var(--muted-ink)]">Started {dateLabel(chart.chart.started_at)} · Finished {dateLabel(chart.chart.archived_at)}</p></div><div className="text-right"><p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted-ink)]">Final score</p><p className="mt-1 text-3xl font-semibold">{score === null ? "—" : `${Math.round(score * 100)}%`}</p></div></div></Link>)}</div>}
      </section></div>
    </main>
  );
}
