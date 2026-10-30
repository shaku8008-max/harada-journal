import { effectiveDate, isValidDateString } from "./dates";

export type ActionDateBounds = {
  createdAt: string;
  archivedAt: string | null;
};

export function isActionLiveOnDate(
  action: ActionDateBounds,
  date: string,
  timezone: string,
  dayStartHour: number,
): boolean {
  if (!isValidDateString(date)) throw new RangeError(`Invalid date: ${date}`);

  const createdDate = effectiveDate(new Date(action.createdAt), timezone, dayStartHour);
  if (createdDate > date) return false;
  if (!action.archivedAt) return true;

  const archivedDate = effectiveDate(new Date(action.archivedAt), timezone, dayStartHour);
  return date < archivedDate;
}
