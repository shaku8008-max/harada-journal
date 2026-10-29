"use client";

import Link from "next/link";

import type { ChartData } from "@/lib/charts";
import { overviewPositions, type GridCell } from "@/lib/grid";
import { actionHint, positionHints, positionStyle } from "@/lib/position-hints";

function actionLabel(position: number, title: string | null, subGoalTitle: string) {
  return `Action ${position} of ${subGoalTitle || "empty sub-goal"}: ${title ?? "empty"}`;
}

export function SubGoalGrid({ data, position, onCellSelect }: { data: ChartData; position: number; onCellSelect: (cell: GridCell) => void }) {
  const subGoal = data.subGoals.find((item) => item.position === position);
  const actions = data.actions.filter((action) => action.sub_goal_id === subGoal?.id);
  const actionsByPosition = new Map(actions.map((action) => [action.position, action]));
  const subGoalTitle = subGoal?.title ?? `e.g. ${positionHints[position as keyof typeof positionHints]}`;
  const centerCell: GridCell = {
    key: `sub-goal-${subGoal?.id ?? position}`,
    kind: "sub_goal",
    position: 0,
    subGoalPosition: position,
    title: subGoal?.title ?? null,
    subGoal,
  };

  return (
    <section className="mx-auto w-full max-w-2xl">
      <Link href="/chart" className="mb-5 inline-flex min-h-11 items-center rounded-full border border-[var(--line)] px-4 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">
        ← Back to overview
      </Link>
      <div className="mb-6" style={positionStyle(position)}>
        <p className="text-sm font-medium text-[var(--accent)]">Direction {position}</p>
        <h1 className="mt-2 text-4xl tracking-tight sm:text-5xl">{subGoalTitle}</h1>
        <p className="mt-3 text-base leading-7 text-[var(--muted-ink)]">Build this direction with up to eight clear next moves.</p>
      </div>
      <div className="grid grid-cols-3 gap-2 rounded-2xl border-2 border-[var(--position-accent)] bg-[var(--position-background)] p-2 sm:gap-3 sm:p-3" style={positionStyle(position)} aria-label={`Sub-goal ${position} action grid`}>
        {overviewPositions.map((cellPosition) => {
          if (cellPosition === "centre") {
            return <button key="centre" type="button" onClick={() => onCellSelect(centerCell)} aria-label={`Sub-goal ${position}: ${subGoal?.title ?? "empty"}`} className="flex min-h-28 items-center rounded-xl border-2 border-[var(--position-accent)] bg-[var(--position-background)] p-3 text-left text-[15px] font-medium leading-6 text-[var(--position-text)] transition hover:-translate-y-0.5 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--position-accent)] sm:min-h-36 sm:p-5">
              <span className="line-clamp-4">{subGoal?.title ?? `e.g. ${positionHints[position as keyof typeof positionHints]}`}</span>
            </button>;
          }
          const action = actionsByPosition.get(cellPosition);
          const cell: GridCell = action
            ? { key: `action-${action.id}`, kind: "action", position: cellPosition, subGoalPosition: position, title: action.title, action }
            : { key: `action-empty-${position}-${cellPosition}`, kind: "action", position: cellPosition, subGoalPosition: position, title: null };
          return <button key={cell.key} type="button" onClick={() => onCellSelect(cell)} aria-label={actionLabel(cellPosition, action?.title ?? null, subGoalTitle)} className={`flex min-h-28 items-center rounded-xl border border-[var(--position-accent)] p-3 text-left text-[15px] leading-6 transition hover:-translate-y-0.5 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--position-accent)] sm:min-h-36 sm:p-5 ${action ? "bg-[var(--position-background)] text-[var(--position-text)]" : "bg-[var(--position-background)] text-[var(--position-text)]"}`}>
            <span className={action ? "line-clamp-4" : "italic"}>{action?.title ?? `e.g. ${actionHint}`}</span>
          </button>;
        })}
      </div>
      <p className="mt-4 text-sm text-[var(--muted-ink)]">{actions.length}/8 actions added. Tap any cell to edit it.</p>
    </section>
  );
}
