"use client";

import { useState } from "react";

import type { ChartData } from "@/lib/charts";
import type { GridCell } from "@/lib/grid";
import { ChartOverview } from "./chart-overview";
import { CellEditor } from "./cell-editor";
import { ChartGrid } from "./chart-grid";

export function ChartEditor({ data }: { data: ChartData }) {
  const [cell, setCell] = useState<GridCell | null>(null);

  return (
    <>
      <ChartOverview data={data} onMainSelect={setCell} />
      <CellEditor key={cell?.key ?? "closed"} data={data} cell={cell} open={Boolean(cell)} onOpenChange={(open) => !open && setCell(null)} />
    </>
  );
}
