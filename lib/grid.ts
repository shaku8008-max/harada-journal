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

export const overviewPositions: Array<number | "centre"> = [1, 2, 3, 8, "centre", 4, 7, 6, 5];
