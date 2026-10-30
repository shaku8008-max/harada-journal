import { describe, expect, it } from "vitest";

import { isActionLiveOnDate } from "./action-dates";

const timezone = "UTC";
const dayStartHour = 3;

function action(createdAt: string, archivedAt: string | null = null) {
  return { createdAt, archivedAt };
}

describe("isActionLiveOnDate", () => {
  it("uses the day before at midnight and switches at day start", () => {
    expect(isActionLiveOnDate(action("2026-01-02T02:59:00Z"), "2026-01-01", timezone, dayStartHour)).toBe(true);
    expect(isActionLiveOnDate(action("2026-01-02T02:59:00Z"), "2026-01-02", timezone, dayStartHour)).toBe(true);
    expect(isActionLiveOnDate(action("2026-01-02T03:00:00Z"), "2026-01-01", timezone, dayStartHour)).toBe(false);
    expect(isActionLiveOnDate(action("2026-01-02T03:00:00Z"), "2026-01-02", timezone, dayStartHour)).toBe(true);
  });

  it("stops being live on the effective archive day", () => {
    const item = action("2026-01-01T03:00:00Z", "2026-01-03T03:00:00Z");
    expect(isActionLiveOnDate(item, "2026-01-02", timezone, dayStartHour)).toBe(true);
    expect(isActionLiveOnDate(item, "2026-01-03", timezone, dayStartHour)).toBe(false);
  });

  it("is not live when created and archived on the same effective day", () => {
    const item = action("2026-01-04T03:10:00Z", "2026-01-04T04:10:00Z");
    expect(isActionLiveOnDate(item, "2026-01-03", timezone, dayStartHour)).toBe(false);
    expect(isActionLiveOnDate(item, "2026-01-04", timezone, dayStartHour)).toBe(false);
  });
});
