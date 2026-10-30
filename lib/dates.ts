export const WEEK_STARTS_ON = 1;

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

function parseDateString(value: string) {
  const match = DATE_PATTERN.exec(value);
  if (!match) return null;

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    return null;
  }

  return date;
}

function requireDate(value: string) {
  const date = parseDateString(value);
  if (!date) throw new RangeError(`Invalid date: ${value}`);
  return date;
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function localParts(nowUtc: Date, timezone: string) {
  if (Number.isNaN(nowUtc.getTime())) throw new RangeError("Invalid UTC date");

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    calendar: "gregory",
    numberingSystem: "latn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(nowUtc).map(({ type, value }) => [type, value]),
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

export function effectiveDate(nowUtc: Date, timezone: string, dayStartHour: number): string {
  if (!Number.isInteger(dayStartHour) || dayStartHour < 0 || dayStartHour > 6) {
    throw new RangeError("dayStartHour must be an integer from 0 to 6");
  }

  const parts = localParts(nowUtc, timezone);
  const wallClock = new Date(0);
  wallClock.setUTCFullYear(parts.year, parts.month - 1, parts.day);
  wallClock.setUTCHours(parts.hour, parts.minute, parts.second, 0);
  wallClock.setTime(wallClock.getTime() - dayStartHour * 60 * 60 * 1000);
  return formatDate(wallClock);
}

export function isValidDateString(value: string): boolean {
  return typeof value === "string" && parseDateString(value) !== null;
}

export function addDays(value: string, days: number): string {
  if (!Number.isInteger(days)) throw new RangeError("days must be an integer");
  const date = requireDate(value);
  date.setTime(date.getTime() + days * DAY_IN_MS);
  return formatDate(date);
}

export function weekStart(value: string): string {
  const date = requireDate(value);
  const daysSinceWeekStart = (date.getUTCDay() - WEEK_STARTS_ON + 7) % 7;
  return addDays(value, -daysSinceWeekStart);
}

export function weekDates(value: string): string[] {
  const start = weekStart(value);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

export function compareDates(left: string, right: string): -1 | 0 | 1 {
  requireDate(left);
  requireDate(right);
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}
