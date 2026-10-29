import type { ChartData } from "@/lib/charts";

export function ChartWorkspace({ data }: { data: ChartData }) {
  return (
    <section>
      <h1 className="text-4xl tracking-tight sm:text-5xl">{data.chart.title}</h1>
      <p className="mt-3 text-[var(--muted-ink)]">Your chart is ready. The grid is coming together here.</p>
    </section>
  );
}
