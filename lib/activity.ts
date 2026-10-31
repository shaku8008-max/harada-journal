import { addDays, compareDates, weekStart } from "./dates";

export type ActivityRecord = {
  date: string;
  actionsDone: number;
  hasEntry: boolean;
};

export type ActivityCell = ActivityRecord & {
  intensity: 0 | 1 | 2 | 3 | 4;
  journalOnly: boolean;
  isFuture: boolean;
  interactive: boolean;
  label: string;
};

export type ActivityMonthLabel = {
  weekIndex: number;
  label: string;
};

export type ActivityGrid = {
  weeks: ActivityCell[][];
  monthLabels: ActivityMonthLabel[];
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function activityIntensity(actionsDone: number): 0 | 1 | 2 | 3 | 4 {
  if (actionsDone <= 0) return 0;
  if (actionsDone === 1) return 1;
  if (actionsDone <= 3) return 2;
  if (actionsDone <= 5) return 3;
  return 4;
}

function shortDate(date: string): string {
  const month = MONTHS[Number(date.slice(5, 7)) - 1];
  return `${Number(date.slice(8, 10))} ${month.slice(0, 3)}`;
}

export function formatActivityLabel(displayDate: string, activity: ActivityRecord): string {
  if (activity.actionsDone === 0 && !activity.hasEntry) return `${displayDate}: no activity`;

  const actions = activity.actionsDone === 0
    ? "no actions"
    : `${activity.actionsDone} action${activity.actionsDone === 1 ? "" : "s"}`;
  return `${displayDate}: ${actions}${activity.hasEntry ? ", journal written" : ""}`;
}

function monthLabels(weeks: string[][]): ActivityMonthLabel[] {
  const labels: ActivityMonthLabel[] = [];
  const seenMonths = new Set<string>();

  weeks.forEach((week, weekIndex) => {
    const month = week[0].slice(0, 7);
    if (week.every((date) => date.slice(0, 7) === month) && !seenMonths.has(month)) {
      seenMonths.add(month);
      labels.push({ weekIndex, label: MONTHS[Number(month.slice(5, 7)) - 1] });
    }
  });

  return labels;
}

export function buildActivityGrid(today: string, records: ActivityRecord[]): ActivityGrid {
  const currentWeekStart = weekStart(today);
  const firstWeekStart = addDays(currentWeekStart, -25 * 7);
  const recordByDate = new Map<string, ActivityRecord>();

  for (const record of records) {
    const previous = recordByDate.get(record.date);
    recordByDate.set(record.date, previous
      ? {
          date: record.date,
          actionsDone: Math.max(previous.actionsDone, record.actionsDone),
          hasEntry: previous.hasEntry || record.hasEntry,
        }
      : record);
  }

  const weekDates = Array.from({ length: 26 }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) => addDays(firstWeekStart, weekIndex * 7 + dayIndex)),
  );

  return {
    weeks: weekDates.map((week) => week.map((date) => {
      const isFuture = compareDates(date, today) === 1;
      const activity = isFuture ? { date, actionsDone: 0, hasEntry: false } : recordByDate.get(date) ?? { date, actionsDone: 0, hasEntry: false };
      return {
        ...activity,
        intensity: activityIntensity(activity.actionsDone),
        journalOnly: activity.actionsDone === 0 && activity.hasEntry,
        isFuture,
        interactive: !isFuture,
        label: isFuture ? `${shortDate(date)}: upcoming` : formatActivityLabel(shortDate(date), activity),
      };
    })),
    monthLabels: monthLabels(weekDates),
  };
}
