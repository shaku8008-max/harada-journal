import { describe, expect, it } from "vitest";

import { calculateStreaks, type ActivityDay } from "./streaks";

function day(date: string, overrides: Partial<ActivityDay> = {}): ActivityDay {
  return { date, actionsDone: 0, hasEntry: false, ...overrides };
}

describe("calculateStreaks", () => {
  it("returns zeroes with no data", () => {
    expect(calculateStreaks([], "2026-10-31")).toEqual({ current: 0, longest: 0 });
  });

  it("counts an active today as the current streak", () => {
    expect(calculateStreaks([day("2026-10-31", { actionsDone: 1 })], "2026-10-31")).toEqual({ current: 1, longest: 1 });
  });

  it("counts back from yesterday when today is empty", () => {
    expect(calculateStreaks([
      day("2026-10-30", { actionsDone: 2 }),
      day("2026-10-31"),
    ], "2026-10-31")).toEqual({ current: 1, longest: 1 });
  });

  it("returns zero when today and yesterday are empty", () => {
    expect(calculateStreaks([
      day("2026-10-29", { actionsDone: 1 }),
      day("2026-10-31"),
    ], "2026-10-31")).toEqual({ current: 0, longest: 1 });
  });

  it("stops the current streak at a gap", () => {
    expect(calculateStreaks([
      day("2026-10-28", { actionsDone: 1 }),
      day("2026-10-30", { actionsDone: 1 }),
      day("2026-10-31", { actionsDone: 1 }),
    ], "2026-10-31")).toEqual({ current: 2, longest: 2 });
  });

  it("keeps a longer older streak separate from the current streak", () => {
    expect(calculateStreaks([
      day("2026-10-24", { actionsDone: 1 }),
      day("2026-10-25", { actionsDone: 1 }),
      day("2026-10-26", { actionsDone: 1 }),
      day("2026-10-30", { actionsDone: 1 }),
      day("2026-10-31", { actionsDone: 1 }),
    ], "2026-10-31")).toEqual({ current: 2, longest: 3 });
  });

  it("treats journal-only days as active", () => {
    expect(calculateStreaks([
      day("2026-10-30", { hasEntry: true }),
      day("2026-10-31", { hasEntry: true }),
    ], "2026-10-31")).toEqual({ current: 2, longest: 2 });
  });

  it("handles unsorted input and duplicate dates without inflating the streak", () => {
    expect(calculateStreaks([
      day("2026-10-30"),
      day("2026-10-31", { actionsDone: 1 }),
      day("2026-10-29", { actionsDone: 1 }),
      day("2026-10-30", { hasEntry: true }),
      day("2026-10-31", { actionsDone: 4 }),
    ], "2026-10-31")).toEqual({ current: 3, longest: 3 });
  });
});
