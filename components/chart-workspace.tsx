import type { ChartData } from "@/lib/charts";

import { ChartEditor } from "./chart-editor";

export function ChartWorkspace({ data, expandedPosition }: { data: ChartData; expandedPosition: number | null }) {
  void expandedPosition;
  return (
    <section>
      <ChartEditor data={data} />
    </section>
  );
}
