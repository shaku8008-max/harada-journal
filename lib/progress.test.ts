import { describe, expect, it } from "vitest";

import { calculateProgress, type ProgressAction, type ProgressLog } from "./progress";

const settings = {
  today: "2026-01-14",
  chartStartDate: "2026-01-01",
  timezone: "UTC",
  dayStartHour: 3,
} as const;

function action(overrides: Partial<ProgressAction> = {}): ProgressAction {
  return {
    id: "daily-1",
    subGoalId: "sub-1",
    kind: "daily",
    weeklyTarget: null,
    createdAt: "2025-12-01T03:00:00Z",
    archivedAt: null,
    ...overrides,
  };
}

function log(actionId: string, logDate: string): ProgressLog {
  return { actionId, logDate };
}

describe("calculateProgress", () => {
  it("scores daily actions by logged live days over elapsed live days", () => {
    const result = calculateProgress({
      ...settings,
      window: "week",
      actions: [action()],
      logs: [log("daily-1", "2026-01-12"), log("daily-1", "2026-01-14")],
    });

    expect(result.actions["daily-1"]).toEqual({ score: 2 / 3, detail: "2/3 days" });
  });

  it("excludes an action with no live days in the window", () => {
    const result = calculateProgress({
      ...settings,
      window: "week",
      actions: [action({ createdAt: "2026-01-15T03:00:00Z" })],
      logs: [],
    });

    expect(result.actions["daily-1"]).toBeUndefined();
    expect(result.subGoals["sub-1"]).toEqual({ score: null, actionCount: 0 });
    expect(result.overallScore).toBeNull();
  });

  it("scores weekly actions and caps each overlapping week at one", () => {
    const result = calculateProgress({
      today: "2026-01-25",
      chartStartDate: "2026-01-01",
      timezone: "UTC",
      dayStartHour: 3,
      window: "all",
      actions: [action({ id: "weekly-1", kind: "weekly", weeklyTarget: 2 })],
      logs: [
        log("weekly-1", "2026-01-05"),
        log("weekly-1", "2026-01-06"),
        log("weekly-1", "2026-01-07"),
        log("weekly-1", "2026-01-19"),
      ],
    });

    expect(result.actions["weekly-1"]).toEqual({ score: 0.375, detail: "0/2 this week, 3/2 this week, 0/2 this week, 1/2 this week" });
  });

  it("scores one-off actions from any logged date", () => {
    const result = calculateProgress({
      ...settings,
      window: "week",
      actions: [
        action({ id: "done", kind: "one_off" }),
        action({ id: "open", kind: "one_off" }),
        action({ id: "archived", kind: "one_off", archivedAt: "2025-12-10T03:00:00Z" }),
      ],
      logs: [log("done", "2025-12-20")],
    });

    expect(result.actions.done).toEqual({ score: 1, detail: "Done" });
    expect(result.actions.open).toEqual({ score: 0, detail: "Not done" });
    expect(result.actions.archived).toBeUndefined();
  });
});
