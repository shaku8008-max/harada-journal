"use client";

import { useState } from "react";

import type { ChartData } from "@/lib/charts";
import type { GridCell } from "@/lib/grid";
import { ChartOverview } from "./chart-overview";
import { CellEditor } from "./cell-editor";
import { SubGoalGrid } from "./subgoal-grid";

export function ChartEditor({ data, expandedPosition }: { data: ChartData; expandedPosition: number | null }) {
  const [cell, setCell] = useState<GridCell | null>(null);

  return (
    <>
      {expandedPosition ? <SubGoalGrid data={data} position={expandedPosition} onCellSelect={setCell} /> : <ChartOverview data={data} onMainSelect={setCell} />}
      <CellEditor key={cell?.key ?? "closed"} data={data} cell={cell} open={Boolean(cell)} onOpenChange={(open) => !open && setCell(null)} />
    </>
  );
}
