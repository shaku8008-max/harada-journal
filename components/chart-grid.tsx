"use client";

import { useState } from "react";

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

function CellButton({ cell, onSelect, compact = false }: { cell: GridCell; onSelect?: (cell: GridCell) => void; compact?: boolean }) {
  const isFilled = Boolean(cell.title);
  return (
    <button
      type="button"
      aria-label={cellLabel(cell)}
      onClick={() => onSelect?.(cell)}
      className={`${compact ? "aspect-square min-h-0 p-0" : "min-h-14 p-2"} border border-[var(--line)] text-left text-[11px] leading-tight transition focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent)] ${
        isFilled ? "bg-[var(--surface)] text-[var(--ink)] hover:bg-[#eee8dc]" : "bg-[var(--paper)] text-[var(--muted-ink)] hover:bg-[#eee8dc]"
      } ${cell.kind === "main" ? "bg-[var(--ink)] text-white hover:bg-[var(--ink)]" : ""}`}
    >
      <span className={compact ? "sr-only" : "line-clamp-3"}>{cell.title || "Open cell"}</span>
      {compact && <span aria-hidden="true" className={`mx-auto block size-1.5 rounded-full ${isFilled ? "bg-[var(--accent)]" : "bg-transparent"}`} />}
    </button>
  );
}

export function ChartGrid({ data, onCellSelect }: ChartGridProps) {
  const blocks = buildGridBlocks(data.chart, data.subGoals, data.actions);
  const [mobileBlock, setMobileBlock] = useState<number | "centre" | null>(null);
  const selectedBlock = blocks.find((block) => block.position === mobileBlock);

  return (
    <div aria-label="Open Window 64 goal chart">
      <div className="hidden grid-cols-3 gap-2 sm:gap-3 md:grid">
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

      <div className="md:hidden">
        {!selectedBlock ? (
          <div>
            <p className="mb-3 text-sm text-[var(--muted-ink)]">Tap a block to open its 3x3 view.</p>
            <div className="grid grid-cols-3 gap-1 rounded-xl border-2 border-[var(--line)] bg-[var(--line)] p-1" aria-label="Compact goal chart overview">
              {blocks.map((block) => (
                <section key={block.position} aria-label={block.position === "centre" ? "Main goal block" : `Sub-goal ${block.position} block`} className="grid grid-cols-3 overflow-hidden rounded-md bg-[var(--line)]">
                  {block.cells.map((cell) => (
                    <CellButton key={cell.key} cell={cell} compact onSelect={() => setMobileBlock(block.position)} />
                  ))}
                </section>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs text-[var(--muted-ink)]"><span className="size-2 rounded-full bg-[var(--accent)]" /> Filled cell <span className="ml-2 size-2 rounded-full border border-[var(--line)]" /> Open cell</div>
          </div>
        ) : (
          <section aria-live="polite" aria-label={selectedBlock.position === "centre" ? "Main goal block" : `Sub-goal ${selectedBlock.position} block`}>
            <button type="button" onClick={() => setMobileBlock(null)} className="mb-4 inline-flex min-h-11 items-center rounded-full border border-[var(--line)] px-4 text-sm font-medium hover:border-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">← Back to overview</button>
            <div className="grid grid-cols-3 gap-1 overflow-hidden rounded-xl border-2 border-[var(--line)] bg-[var(--line)]">
              {selectedBlock.cells.map((cell) => (
                <CellButton key={cell.key} cell={cell} onSelect={onCellSelect} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
