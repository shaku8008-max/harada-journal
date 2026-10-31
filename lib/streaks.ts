import { addDays, compareDates } from "./dates";

export const STREAK_WINDOW_DAYS = 400;

// The activity RPC fetches the maximum 400-day range so a long-running streak
// is not cut off at the 26-week heatmap boundary.
export type ActivityDay = {
  date: string;
  actionsDone: number;
  hasEntry: boolean;
};

export type Streaks = {
  current: number;
  longest: number;
};

export function calculateStreaks(days: ActivityDay[], today: string): Streaks {
  const activityByDate = new Map<string, boolean>();

  for (const day of days) {
    const active = day.actionsDone > 0 || day.hasEntry;
    activityByDate.set(day.date, Boolean(activityByDate.get(day.date) || active));
  }

  const activeDateList = [...activityByDate]
    .filter(([, active]) => active)
    .map(([date]) => date)
    .sort(compareDates);

  let longest = 0;
  let run = 0;
  let previous: string | null = null;
  for (const date of activeDateList) {
    if (previous && compareDates(date, addDays(previous, 1)) === 0) run += 1;
    else run = 1;
    longest = Math.max(longest, run);
    previous = date;
  }

  const currentStart = activityByDate.get(today) ? today : addDays(today, -1);
  let current = 0;
  if (activityByDate.get(currentStart)) {
    let date = currentStart;
    while (activityByDate.get(date)) {
      current += 1;
      date = addDays(date, -1);
    }
  }

  return { current, longest };
}
