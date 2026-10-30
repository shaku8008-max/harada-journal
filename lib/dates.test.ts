import { describe, expect, it } from "vitest";

import {
  WEEK_STARTS_ON,
  addDays,
  compareDates,
  effectiveDate,
  isValidDateString,
  weekDates,
  weekStart,
} from "./dates";

describe("effectiveDate", () => {
  it("handles midnight in UTC", () => {
    expect(effectiveDate(new Date("2024-01-01T23:59:59Z"), "UTC", 0)).toBe("2024-01-01");
    expect(effectiveDate(new Date("2024-01-02T00:00:00Z"), "UTC", 0)).toBe("2024-01-02");
  });

  it("uses the configured day-start hour", () => {
    expect(effectiveDate(new Date("2024-01-02T02:59:00Z"), "UTC", 3)).toBe("2024-01-01");
    expect(effectiveDate(new Date("2024-01-02T03:00:00Z"), "UTC", 3)).toBe("2024-01-02");
  });

  it("supports day start at midnight", () => {
    expect(effectiveDate(new Date("2024-02-29T00:00:00Z"), "UTC", 0)).toBe("2024-02-29");
  });

  it("handles Melbourne spring-forward and the skipped hour", () => {
    expect(effectiveDate(new Date("2026-10-03T15:59:00Z"), "Australia/Melbourne", 3)).toBe("2026-10-03");
    expect(effectiveDate(new Date("2026-10-03T16:00:00Z"), "Australia/Melbourne", 3)).toBe("2026-10-04");
  });

  it("handles Melbourne fall-back and the repeated hour", () => {
    expect(effectiveDate(new Date("2026-04-04T15:30:00Z"), "Australia/Melbourne", 3)).toBe("2026-04-04");
    expect(effectiveDate(new Date("2026-04-04T16:30:00Z"), "Australia/Melbourne", 3)).toBe("2026-04-04");
    expect(effectiveDate(new Date("2026-04-04T17:00:00Z"), "Australia/Melbourne", 3)).toBe("2026-04-05");
  });

  it("does not hardcode Melbourne", () => {
    expect(effectiveDate(new Date("2024-06-15T06:59:00Z"), "America/Los_Angeles", 0)).toBe("2024-06-14");
    expect(effectiveDate(new Date("2024-06-15T07:00:00Z"), "America/Los_Angeles", 0)).toBe("2024-06-15");
  });

  it("rejects invalid clock inputs", () => {
    expect(() => effectiveDate(new Date("invalid"), "UTC", 0)).toThrow(RangeError);
    expect(() => effectiveDate(new Date("2024-01-01T00:00:00Z"), "Not/AZone", 0)).toThrow(RangeError);
    expect(() => effectiveDate(new Date("2024-01-01T00:00:00Z"), "UTC", 7)).toThrow(RangeError);
  });
});

describe("date helpers", () => {
  it("starts weeks on Monday and handles Sunday/Monday boundaries", () => {
    expect(WEEK_STARTS_ON).toBe(1);
    expect(weekStart("2024-01-07")).toBe("2024-01-01");
    expect(weekStart("2024-01-08")).toBe("2024-01-08");
    expect(weekDates("2024-01-07")).toEqual([
      "2024-01-01",
      "2024-01-02",
      "2024-01-03",
      "2024-01-04",
      "2024-01-05",
      "2024-01-06",
      "2024-01-07",
    ]);
  });

  it("adds days across leap day", () => {
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDays("2024-02-29", 1)).toBe("2024-03-01");
    expect(addDays("2024-03-01", -1)).toBe("2024-02-29");
  });

  it("validates and compares date strings", () => {
    expect(isValidDateString("2024-02-29")).toBe(true);
    expect(isValidDateString("2023-02-29")).toBe(false);
    expect(isValidDateString("2024-1-01")).toBe(false);
    expect(isValidDateString("not-a-date")).toBe(false);
    expect(compareDates("2024-01-01", "2024-01-02")).toBe(-1);
    expect(compareDates("2024-01-02", "2024-01-01")).toBe(1);
    expect(compareDates("2024-01-01", "2024-01-01")).toBe(0);
    expect(() => addDays("2024-02-30", 1)).toThrow(RangeError);
    expect(() => addDays("2024-01-01", 1.5)).toThrow(RangeError);
    expect(() => weekStart("2024-02-30")).toThrow(RangeError);
  });
});
