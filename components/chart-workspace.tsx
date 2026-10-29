import type { ChartData } from "@/lib/charts";

import { ChartEditor } from "./chart-editor";

export function ChartWorkspace({ data }: { data: ChartData }) {
  return (
    <section>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[var(--accent)]">Your open window</p>
          <h1 className="mt-2 text-4xl tracking-tight sm:text-5xl">{data.chart.title}</h1>
          <p className="mt-3 max-w-2xl text-[var(--muted-ink)]">The centre holds your main goal. Eight directions surround it, with eight possible next moves around each one.</p>
        </div>
        <p className="text-sm text-[var(--muted-ink)]">Tap any cell to edit it.</p>
      </div>
      <ChartEditor data={data} />
    </section>
  );
}
