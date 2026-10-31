import { describe, expect, it } from "vitest";

import {
  activityIntensity,
  buildActivityGrid,
  formatActivityLabel,
  type ActivityRecord,
} from "./activity";

function record(date: string, overrides: Partial<ActivityRecord> = {}): ActivityRecord {
  return { date, actionsDone: 0, hasEntry: false, ...overrides };
}

describe("activityIntensity", () => {
  it.each([
    [0, 0],
    [1, 1],
    [2, 2],
    [3, 2],
    [4, 3],
    [5, 3],
    [6, 4],
    [12, 4],
  ])("maps %i actions to level %i", (actionsDone, expected) => {
    expect(activityIntensity(actionsDone)).toBe(expected);
  });
});

describe("buildActivityGrid", () => {
  it("builds 26 Monday-start weeks ending in the current week", () => {
    const grid = buildActivityGrid("2026-10-31", []);

    expect(grid.weeks).toHaveLength(26);
    expect(grid.weeks[0][0].date).toBe("2026-05-04");
    expect(grid.weeks[25][0].date).toBe("2026-10-26");
    expect(grid.weeks[25].map((cell) => cell.date)).toEqual([
      "2026-10-26",
      "2026-10-27",
      "2026-10-28",
      "2026-10-29",
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
    ]);
  });

  it("marks future days in the current week blank and non-interactive", () => {
    const grid = buildActivityGrid("2026-10-31", [
      record("2026-11-01", { actionsDone: 6, hasEntry: true }),
    ]);
    const sunday = grid.weeks[25][6];

    expect(sunday).toMatchObject({
      actionsDone: 0,
      hasEntry: false,
      intensity: 0,
      isFuture: true,
      interactive: false,
    });
    expect(sunday.label).toBe("1 Nov: upcoming");
  });

  it("marks journal-only days without raising their intensity", () => {
    const grid = buildActivityGrid("2026-10-31", [record("2026-10-30", { hasEntry: true })]);
    const friday = grid.weeks[25][4];

    expect(friday).toMatchObject({ intensity: 0, journalOnly: true, interactive: true });
    expect(friday.label).toBe("30 Oct: no actions, journal written");
  });

  it("labels action counts and journal activity accessibly", () => {
    expect(formatActivityLabel("12 Oct", record("2026-10-12", { actionsDone: 5, hasEntry: true }))).toBe("12 Oct: 5 actions, journal written");
    expect(formatActivityLabel("13 Oct", record("2026-10-13"))).toBe("13 Oct: no activity");
  });

  it("places month labels on the first full week of each month", () => {
    const grid = buildActivityGrid("2026-10-31", []);

    expect(grid.monthLabels).toEqual([
      { weekIndex: 0, label: "May" },
      { weekIndex: 4, label: "June" },
      { weekIndex: 9, label: "July" },
      { weekIndex: 13, label: "August" },
      { weekIndex: 18, label: "September" },
      { weekIndex: 22, label: "October" },
    ]);
  });
});
