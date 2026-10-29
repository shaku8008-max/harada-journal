"use client";

import Link from "next/link";

import type { ChartData } from "@/lib/charts";
import type { GridCell } from "@/lib/grid";

const overviewOrder: Array<number | "centre"> = [1, 2, 3, 8, "centre", 4, 7, 6, 5];

function dateLabel(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-AU", { dateStyle: "medium" }).format(new Date(`${value}T00:00:00`));
}

export function ChartOverview({ data, onMainSelect }: { data: ChartData; onMainSelect: (cell: GridCell) => void }) {
  const subGoalsByPosition = new Map(data.subGoals.map((subGoal) => [subGoal.position, subGoal]));
  const actionsBySubGoal = new Map<string, number>();
  data.actions.forEach((action) => actionsBySubGoal.set(action.sub_goal_id, (actionsBySubGoal.get(action.sub_goal_id) ?? 0) + 1));
  const mainCell: GridCell = { key: `main-${data.chart.id}`, kind: "main", position: 0, title: data.chart.title, chart: data.chart };

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-5 text-center md:text-left">
        <p className="text-sm font-medium text-[var(--accent)]">Your open window</p>
        <h1 className="mt-2 text-4xl tracking-tight sm:text-5xl">One goal, eight directions.</h1>
        <p className="mt-3 text-base leading-7 text-[var(--muted-ink)]">Tap the centre to edit your goal. Choose a coloured direction to open its eight next moves.</p>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3" aria-label="Open Window 64 overview">
        {overviewOrder.map((position) => {
          if (position === "centre") {
            return (
              <button key="centre" type="button" onClick={() => onMainSelect(mainCell)} aria-label={`Main goal: ${data.chart.title}`} className="flex min-h-36 flex-col justify-center rounded-2xl border-2 border-[var(--ink)] bg-[var(--ink)] p-4 text-left text-white shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:min-h-48 sm:p-6">
                <span className="text-sm font-medium uppercase tracking-[0.14em] text-white/70">Main goal</span>
                <span className="mt-2 line-clamp-4 text-[15px] font-medium leading-6 sm:text-lg">{data.chart.title}</span>
                {data.chart.target_date && <span className="mt-3 text-sm text-white/70">Target: {dateLabel(data.chart.target_date)}</span>}
              </button>
            );
          }

          const subGoal = subGoalsByPosition.get(position);
          const actionCount = subGoal ? actionsBySubGoal.get(subGoal.id) ?? 0 : 0;
          return (
            <Link key={position} href={`/?subGoal=${position}`} aria-label={`Sub-goal ${position}, ${subGoal?.title ?? "empty"}: ${actionCount} of 8 actions`} className="flex min-h-36 flex-col justify-between rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 text-left transition hover:-translate-y-0.5 hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:min-h-48 sm:p-6">
              <span className="text-sm font-medium text-[var(--muted-ink)]">Direction {position}</span>
              <span className={`line-clamp-4 text-[15px] leading-6 sm:text-lg ${subGoal ? "font-medium text-[var(--ink)]" : "italic text-[var(--muted-ink)]"}`}>{subGoal?.title ?? "Open this direction"}</span>
              <span className="text-sm text-[var(--muted-ink)]">{actionCount}/8 actions</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
