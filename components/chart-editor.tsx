"use client";

import { useState } from "react";

import type { ChartData } from "@/lib/charts";
import type { GridCell } from "@/lib/grid";
import { ChartOverview } from "./chart-overview";
import { CellEditor } from "./cell-editor";
import { SubGoalGrid } from "./subgoal-grid";
import type { ProgressResult, ProgressWindow } from "@/lib/progress";
import { FinishChart } from "./finish-chart";

export function ChartEditor({ data, expandedPosition, progress, window, readOnly = false }: { data: ChartData; expandedPosition: number | null; progress: ProgressResult; window: ProgressWindow; readOnly?: boolean }) {
  const [cell, setCell] = useState<GridCell | null>(null);

  return (
    <>
      {!readOnly && <div className="mb-6 flex justify-end"><FinishChart chartId={data.chart.id} /></div>}
      {expandedPosition ? <SubGoalGrid data={data} position={expandedPosition} onCellSelect={setCell} progress={progress} window={window} readOnly={readOnly} /> : <ChartOverview data={data} onMainSelect={setCell} progress={progress} window={window} readOnly={readOnly} />}
      {!readOnly && <CellEditor key={cell?.key ?? "closed"} data={data} cell={cell} open={Boolean(cell)} onOpenChange={(open) => !open && setCell(null)} />}
    </>
  );
}
