"use client";

import { buildGridBlocks, type GridCell } from "@/lib/grid";
import type { ChartData } from "@/lib/charts";

type ChartGridProps = {
  data: ChartData;
  onCellSelect?: (cell: GridCell) => void;
};

function cellLabel(cell: GridCell) {
  if (cell.kind === "main") return `Main goal: ${cell.title ?? "empty"}`;
  if (cell.kind === "sub_goal") return `Sub-goal ${cell.subGoalPosition}: ${cell.title ?? "empty"}`;
  return `Action ${cell.position} of Sub-goal ${cell.subGoalPosition}: ${cell.title ?? "empty"}`;
}

function CellButton({ cell, onSelect }: { cell: GridCell; onSelect?: (cell: GridCell) => void }) {
  const isFilled = Boolean(cell.title);
  return (
    <button
      type="button"
      aria-label={cellLabel(cell)}
      onClick={() => onSelect?.(cell)}
      className={`min-h-14 border border-[var(--line)] p-2 text-left text-[11px] leading-tight transition focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent)] ${
        isFilled ? "bg-[var(--surface)] text-[var(--ink)] hover:bg-[#eee8dc]" : "bg-[var(--paper)] text-[var(--muted-ink)] hover:bg-[#eee8dc]"
      } ${cell.kind === "main" ? "bg-[var(--ink)] text-white hover:bg-[var(--ink)]" : ""}`}
    >
      <span className="line-clamp-3">{cell.title || "Open cell"}</span>
    </button>
  );
}

export function ChartGrid({ data, onCellSelect }: ChartGridProps) {
  const blocks = buildGridBlocks(data.chart, data.subGoals, data.actions);

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3" aria-label="Open Window 64 goal chart">
      {blocks.map((block) => (
        <section
          key={block.position}
          aria-label={block.position === "centre" ? "Main goal block" : `Sub-goal ${block.position} block`}
          className="grid grid-cols-3 overflow-hidden rounded-xl border-2 border-[var(--line)] bg-[var(--line)]"
        >
          {block.cells.map((cell) => (
            <CellButton key={cell.key} cell={cell} onSelect={onCellSelect} />
          ))}
        </section>
      ))}
    </div>
  );
}
