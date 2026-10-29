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

export type GridBlock = {
  position: number | "centre";
  subGoalPosition?: number;
  cells: GridCell[];
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

const positions = Object.keys(ringCoordinates).map(Number);

function emptyCell(
  kind: GridCell["kind"],
  position: number,
  subGoalPosition?: number,
): GridCell {
  return {
    key: `${kind}-${subGoalPosition ?? "centre"}-${position}`,
    kind,
    position,
    subGoalPosition,
    title: null,
  };
}

export function buildGridBlocks(
  chart: ChartRecord,
  subGoals: SubGoalRecord[],
  actions: ActionRecord[],
): GridBlock[] {
  const subGoalsByPosition = new Map(subGoals.map((subGoal) => [subGoal.position, subGoal]));
  const actionsBySubGoal = new Map<string, ActionRecord[]>();

  actions.forEach((action) => {
    const current = actionsBySubGoal.get(action.sub_goal_id) ?? [];
    current.push(action);
    actionsBySubGoal.set(action.sub_goal_id, current);
  });

  const centreCells = positions.map((position) => {
    const subGoal = subGoalsByPosition.get(position);
    return subGoal
      ? {
          key: `sub-goal-centre-${subGoal.id}`,
          kind: "sub_goal" as const,
          position,
          subGoalPosition: position,
          title: subGoal.title,
          subGoal,
        }
      : emptyCell("sub_goal", position, position);
  });

  centreCells.splice(4, 0, {
    key: `main-${chart.id}`,
    kind: "main",
    position: 0,
    title: chart.title,
    chart,
  });

  const outerBlocks = positions.map((position) => {
    const subGoal = subGoalsByPosition.get(position);
    const actionsByPosition = new Map(
      (subGoal ? actionsBySubGoal.get(subGoal.id) ?? [] : []).map((action) => [action.position, action]),
    );
    const actionCells = positions.map((actionPosition) => {
      const action = actionsByPosition.get(actionPosition);
      return action
        ? {
            key: `action-${action.id}`,
            kind: "action" as const,
            position: actionPosition,
            subGoalPosition: position,
            title: action.title,
            action,
          }
        : emptyCell("action", actionPosition, position);
    });

    actionCells.splice(4, 0,
      subGoal
        ? {
            key: `sub-goal-block-${subGoal.id}`,
            kind: "sub_goal" as const,
            position: 0,
            subGoalPosition: position,
            title: subGoal.title,
            subGoal,
          }
        : emptyCell("sub_goal", 0, position),
    );

    return { position, subGoalPosition: position, cells: actionCells };
  });

  return [{ position: "centre", cells: centreCells }, ...outerBlocks];
}
