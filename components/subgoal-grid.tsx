"use client";

import Link from "next/link";
import { ViewTransition, type CSSProperties } from "react";

import type { ChartData } from "@/lib/charts";
import { overviewPositions, type GridCell } from "@/lib/grid";
import { actionHint, positionHints, positionStyle } from "@/lib/position-hints";
import type { ProgressResult, ProgressWindow } from "@/lib/progress";

function actionLabel(position: number, title: string | null, subGoalTitle: string) {
  return `Action ${position} of ${subGoalTitle || "empty sub-goal"}: ${title ?? "empty"}`;
}

function scoreLabel(score: number | null) {
  return score === null ? "—" : `${Math.round(score * 100)}%`;
}

function progressStyle(score: number | null): CSSProperties {
  const amount = score === null ? 0 : Math.round(score * 100);
  return { backgroundImage: `linear-gradient(to top, var(--position-fill) 0%, var(--position-fill) ${amount}%, var(--position-background) ${amount}%, var(--position-background) 100%)` };
}

export function SubGoalGrid({ data, position, onCellSelect, progress: _progress, window: _window, readOnly = false }: { data: ChartData; position: number; onCellSelect?: (cell: GridCell) => void; progress: ProgressResult; window: ProgressWindow; readOnly?: boolean }) {
  void _window;
  const subGoal = data.subGoals.find((item) => item.position === position);
  const actions = data.actions.filter((action) => action.sub_goal_id === subGoal?.id && (readOnly || !action.archived_at));
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
       <Link href={readOnly ? `/archive/${data.chart.id}?window=${_window}` : `/chart?window=${_window}`} transitionTypes={["nav-back"]} className="mb-5 inline-flex min-h-11 items-center rounded-full border border-[var(--line)] px-4 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">
        ← Back to overview
      </Link>
      <div className="mb-6" style={positionStyle(position)}>
        <p className="text-sm font-medium text-[var(--accent)]">Direction {position}</p>
        <h1 className="mt-2 text-4xl tracking-tight sm:text-5xl">{subGoalTitle}</h1>
       <p className="mt-3 text-base leading-7 text-[var(--muted-ink)]">{readOnly ? "These next moves are kept here as a read-only record." : "Build this direction with up to eight clear next moves."}</p>
      </div>
      <ViewTransition name={`flow-subgoal-${position}`} share="flow-morph" default="none">
        <div className="grid grid-cols-3 gap-2 rounded-2xl border-2 border-[var(--position-accent)] bg-[var(--position-background)] p-2 sm:gap-3 sm:p-3" aria-label={`Sub-goal ${position} action grid`}>
          {overviewPositions.map((cellPosition) => {
          if (cellPosition === "centre") {
             const subGoalScore = subGoal ? _progress.subGoals[subGoal.id]?.score ?? null : null;
              return <button key="centre" type="button" disabled={readOnly} onClick={() => onCellSelect?.(centerCell)} aria-label={`Sub-goal ${position}: ${subGoal?.title ?? "empty"}, ${scoreLabel(subGoalScore)}`} className="flow-cell flex min-h-28 items-center rounded-xl border-2 border-[var(--position-accent)] bg-[var(--position-background)] p-3 text-left text-[15px] font-medium leading-6 text-[var(--position-text)] motion-safe:transition-[transform,filter] motion-safe:hover:-translate-y-0.5 motion-safe:hover:brightness-110 motion-safe:active:scale-[0.98] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--position-accent)] disabled:cursor-default disabled:opacity-100 sm:min-h-36 sm:p-5" style={{ "--flow-delay": "80ms" } as CSSProperties}>
               <span className="line-clamp-4">{subGoal?.title ?? `e.g. ${positionHints[position as keyof typeof positionHints]}`}</span>
               <span className="mt-2 text-xl">{scoreLabel(subGoalScore)}</span>
             </button>;
          }
          const action = actionsByPosition.get(cellPosition);
          const actionProgress = action ? _progress.actions[action.id] : undefined;
          const cell: GridCell = action
            ? { key: `action-${action.id}`, kind: "action", position: cellPosition, subGoalPosition: position, title: action.title, action }
            : { key: `action-empty-${position}-${cellPosition}`, kind: "action", position: cellPosition, subGoalPosition: position, title: null };
           return <button key={cell.key} type="button" disabled={readOnly} onClick={() => onCellSelect?.(cell)} aria-label={`${actionLabel(cellPosition, action?.title ?? null, subGoalTitle)}${action ? `, ${actionProgress?.detail ?? "no score"}` : ""}`} className={`progress-fill flow-cell flex min-h-28 w-full items-center rounded-xl border border-[var(--position-accent)] bg-[var(--position-background)] p-3 text-left text-[15px] leading-6 text-[var(--position-text)] motion-safe:transition-[transform,filter] motion-safe:hover:-translate-y-0.5 motion-safe:hover:brightness-110 motion-safe:active:brightness-95 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--position-accent)] disabled:cursor-default disabled:opacity-100 sm:min-h-36 sm:p-5`} style={{ ...progressStyle(actionProgress?.score ?? null), "--flow-delay": `${120 + cellPosition * 35}ms` } as CSSProperties}>
               <span className={action ? "line-clamp-4" : "italic"}>{action?.title ?? `e.g. ${actionHint}`}</span>
               <span className="mt-2 text-sm font-medium">{actionProgress?.detail ?? "—"}</span>
            </button>;
          })}
        </div>
      </ViewTransition>
       <p className="mt-4 text-sm text-[var(--muted-ink)]">{actions.length}/8 actions {readOnly ? "kept in this chart" : "added. Tap any cell to edit it."}</p>
    </section>
  );
}
