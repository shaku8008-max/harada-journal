import type { ActionRecord, ChartRecord, SubGoalRecord } from "@/lib/charts";

export type GridCell = {
  key: string;
  kind: "main" | "sub_goal" | "action";
  position: number;
  subGoalPosition?: number;
  title: string | null;
  chart?: ChartRecord;
  subGoal?: SubGoalRecord;
  action?: ActionRecord;
};

export const ringCoordinates: Record<number, { row: number; column: number }> = {
  1: { row: 0, column: 0 },
  2: { row: 0, column: 1 },
  3: { row: 0, column: 2 },
  4: { row: 1, column: 2 },
  5: { row: 2, column: 2 },
  6: { row: 2, column: 1 },
  7: { row: 2, column: 0 },
  8: { row: 1, column: 0 },
};

export const clockwisePositions = [1, 2, 3, 4, 5, 6, 7, 8] as const;
export const overviewPositions: Array<number | "centre"> = [1, 2, 3, 8, "centre", 4, 7, 6, 5];
