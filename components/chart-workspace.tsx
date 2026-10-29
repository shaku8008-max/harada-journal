import type { ChartData } from "@/lib/charts";

import { ChartEditor } from "./chart-editor";

export function ChartWorkspace({ data, expandedPosition }: { data: ChartData; expandedPosition: number | null }) {
  return (
    <section>
      <ChartEditor data={data} expandedPosition={expandedPosition} />
    </section>
  );
}
