import type { ActivityGrid } from "@/lib/activity";

const intensityBackgrounds = [
  "bg-[var(--surface-raised)]",
  "bg-[var(--activity-level-1)]",
  "bg-[var(--activity-level-2)]",
  "bg-[var(--activity-level-3)]",
  "bg-[var(--activity-level-4)]",
];

const weekdays = ["M", "T", "W", "T", "F", "S", "S"];

export function ActivityHeatmap({ grid }: { grid: ActivityGrid }) {
  return (
    <section aria-labelledby="heatmap-heading" className="mt-8 rounded-3xl border border-[var(--line)] bg-[var(--surface)]/85 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="heatmap-heading" className="text-xl">The last 26 weeks</h2>
          <p className="mt-1 text-sm text-[var(--muted-ink)]">A small record of days you showed up.</p>
        </div>
        <p className="text-xs text-[var(--muted-ink)]">Monday to Sunday</p>
      </div>

      <div className="mt-6 overflow-x-auto pb-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]" tabIndex={0} aria-label="Scrollable activity heatmap">
        <div className="grid min-w-[700px] grid-cols-[2rem_1fr] gap-x-2">
          <div aria-hidden="true" />
          <div className="grid grid-cols-[repeat(26,minmax(0,1fr))] gap-1" aria-hidden="true">
            {Array.from({ length: grid.weeks.length }, (_, index) => {
              const month = grid.monthLabels.find((label) => label.weekIndex === index);
              return <div key={index} className="h-5 text-[15px] text-[var(--muted-ink)]">{month?.label}</div>;
            })}
          </div>

          <div className="grid grid-rows-7 gap-1 pt-0.5" aria-hidden="true">
            {weekdays.map((day, index) => <span key={`${day}-${index}`} className="flex h-5 items-center text-[15px] text-[var(--muted-ink)]">{day}</span>)}
          </div>
          <div role="grid" aria-label="Daily activity" className="grid grid-flow-col grid-rows-7 gap-1">
            {grid.weeks.flatMap((week) => week.map((cell) => (
              <span
                key={cell.date}
                role="gridcell"
                aria-label={cell.label}
                className={`relative flex size-5 items-center justify-center rounded-[5px] border border-[var(--line)]/70 ${intensityBackgrounds[cell.intensity]} ${cell.isFuture ? "opacity-35" : "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--accent)]"}`}
              >
                <span className="sr-only">{cell.label}</span>
                {cell.journalOnly && <span aria-hidden="true" className="size-1.5 rounded-full bg-[var(--accent)]" />}
              </span>
            )))}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[15px] text-[var(--muted-ink)]" aria-label="Heatmap legend">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((level) => <span key={level} className={`size-4 rounded-[4px] border border-[var(--line)]/70 ${intensityBackgrounds[level]}`} aria-label={level === 0 ? "No actions" : `Level ${level}`} />)}
        <span>More</span>
        <span className="ml-1 inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-[var(--accent)]" aria-hidden="true" /> Journal only</span>
      </div>
    </section>
  );
}
