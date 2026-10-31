"use client";

import Link from "next/link";
import { ViewTransition, type CSSProperties } from "react";

import type { ChartData } from "@/lib/charts";
import type { GridCell } from "@/lib/grid";
import { overviewPositions } from "@/lib/grid";
import { positionHints, positionStyle } from "@/lib/position-hints";
import type { ProgressResult, ProgressWindow } from "@/lib/progress";

function dateLabel(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-AU", { dateStyle: "medium" }).format(new Date(`${value}T00:00:00`));
}

function scoreLabel(score: number | null) {
  return score === null ? "—" : `${Math.round(score * 100)}%`;
}

function progressStyle(score: number | null, position?: number): CSSProperties {
  const fill = position ? "var(--position-fill)" : "var(--aether-lilac)";
  const background = position ? "var(--position-background)" : "var(--surface)";
  const amount = score === null ? 0 : Math.round(score * 100);
  return { backgroundImage: `linear-gradient(to top, ${fill} 0%, ${fill} ${amount}%, ${background} ${amount}%, ${background} 100%)` };
}

export function ChartOverview({ data, onMainSelect, progress: _progress, window: _window, readOnly = false }: { data: ChartData; onMainSelect?: (cell: GridCell) => void; progress: ProgressResult; window: ProgressWindow; readOnly?: boolean }) {
  void _window;
  const subGoalsByPosition = new Map(data.subGoals.map((subGoal) => [subGoal.position, subGoal]));
  const actionsBySubGoal = new Map<string, number>();
  data.actions.filter((action) => readOnly || !action.archived_at).forEach((action) => actionsBySubGoal.set(action.sub_goal_id, (actionsBySubGoal.get(action.sub_goal_id) ?? 0) + 1));
  const mainCell: GridCell = { key: `main-${data.chart.id}`, kind: "main", position: 0, title: data.chart.title, chart: data.chart };

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-5 text-center md:text-left">
        <p className="text-sm font-medium text-[var(--accent)]">{readOnly ? "Finished chart" : "Your open window"}</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">One goal, eight directions.</h1>
        <p className="mt-3 text-base leading-7 text-[var(--muted-ink)]">{readOnly ? "This chart is read-only. Choose a direction to revisit its next moves." : "Tap the centre to edit your goal. Choose a coloured direction to open its eight next moves."}</p>
      </div>
      <nav aria-label="Progress window" className="mb-5 flex min-h-11 w-full rounded-full border border-[var(--line)] bg-[var(--surface)] p-1 sm:w-fit">
        {(["week", "30d", "all"] as const).map((item) => {
          const label = item === "week" ? "This week" : item === "30d" ? "Last 30 days" : "All time";
          const active = _window === item;
           return <Link key={item} href={readOnly ? `/archive/${data.chart.id}?window=${item}` : `/chart?window=${item}`} aria-current={active ? "page" : undefined} className={`flex min-h-9 flex-1 items-center justify-center rounded-full px-3 text-[15px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:flex-none ${active ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "text-[var(--muted-ink)] hover:text-[var(--ink)]"}`}>{label}</Link>;
        })}
      </nav>

      <div className="grid grid-cols-3 gap-2 sm:gap-3" aria-label="Open Window 64 overview">
        {overviewPositions.map((position) => {
          if (position === "centre") {
            return (
              <button key="centre" type="button" disabled={readOnly} onClick={() => onMainSelect?.(mainCell)} aria-label={`Main goal: ${data.chart.title}, ${scoreLabel(_progress.overallScore) === "—" ? "no score" : `${scoreLabel(_progress.overallScore)} overall`}`} className="flex min-h-36 flex-col justify-center rounded-2xl border-2 border-[var(--aether-lilac)] bg-[var(--surface)] p-4 text-left text-[var(--ink)] shadow-[0_12px_32px_rgba(0,0,0,0.34)] motion-safe:transition-[transform,filter] motion-safe:hover:-translate-y-0.5 motion-safe:hover:brightness-110 motion-safe:active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--aether-lilac)] disabled:cursor-default disabled:opacity-100 sm:min-h-48 sm:p-6">
                <span className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--aether-lilac)]">Main goal</span>
                <span className="mt-2 line-clamp-4 text-[15px] font-medium leading-6 sm:text-lg">{data.chart.title}</span>
                <span className="mt-3 text-2xl font-semibold">{scoreLabel(_progress.overallScore)}</span>
                {data.chart.target_date && <span className="mt-3 text-sm text-[var(--muted-ink)]">Target: {dateLabel(data.chart.target_date)}</span>}
              </button>
            );
          }

          const subGoal = subGoalsByPosition.get(position);
          const actionCount = subGoal ? actionsBySubGoal.get(subGoal.id) ?? 0 : 0;
          const score = subGoal ? _progress.subGoals[subGoal.id]?.score ?? null : null;
          const scoreDescription = score === null ? "no score" : `${scoreLabel(score)}`;
          return (
            <ViewTransition key={position} name={`flow-subgoal-${position}`} share="flow-morph" default="none">
               <Link href={readOnly ? `/archive/${data.chart.id}?subGoal=${position}&window=${_window}` : `/chart?subGoal=${position}&window=${_window}`} transitionTypes={["nav-forward"]} aria-label={`Sub-goal ${position}, ${subGoal?.title ?? "empty"}: ${scoreDescription}, ${actionCount} of 8 actions`} style={{ ...positionStyle(position), ...progressStyle(score, position) }} className="progress-fill flex min-h-36 flex-col justify-between rounded-2xl border-2 border-[var(--position-accent)] bg-[var(--position-background)] p-4 text-left text-[var(--position-text)] shadow-[0_12px_32px_rgba(0,0,0,0.3)] motion-safe:transition-[transform,filter] motion-safe:hover:-translate-y-0.5 motion-safe:hover:brightness-110 motion-safe:active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--position-accent)] sm:min-h-48 sm:p-6">
                  <span className="text-sm font-medium">Direction {position}</span>
                  <span className={`line-clamp-4 text-[15px] leading-6 sm:text-lg ${subGoal ? "font-medium" : "italic"}`}>{subGoal?.title ?? `e.g. ${positionHints[position as keyof typeof positionHints]}`}</span>
                   <span className="text-2xl font-semibold">{scoreLabel(score)}</span>
                   <span className="text-sm">{actionCount}/8 actions</span>
              </Link>
            </ViewTransition>
          );
        })}
      </div>
    </div>
  );
}
