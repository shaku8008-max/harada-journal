import { isActionLiveOnDate } from "./action-dates";
import { addDays, compareDates, weekStart } from "./dates";

export type ProgressWindow = "week" | "30d" | "all";
export type ProgressActionKind = "daily" | "weekly" | "one_off";

export type ProgressAction = {
  id: string;
  subGoalId: string;
  kind: ProgressActionKind;
  weeklyTarget: number | null;
  createdAt: string;
  archivedAt: string | null;
};

export type ProgressLog = {
  actionId: string;
  logDate: string;
};

export type ActionProgress = {
  score: number;
  detail: string;
};

export type SubGoalProgress = {
  score: number | null;
  actionCount: number;
};

export type ProgressResult = {
  actions: Record<string, ActionProgress>;
  subGoals: Record<string, SubGoalProgress>;
  overallScore: number | null;
};

export type ProgressInput = {
  actions: ProgressAction[];
  logs: ProgressLog[];
  timezone: string;
  dayStartHour: number;
  today: string;
  chartStartDate: string;
  window: ProgressWindow;
};

function average(values: number[]) {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : null;
}

function windowStart(input: ProgressInput) {
  if (input.window === "week") return weekStart(input.today);
  if (input.window === "30d") return addDays(input.today, -29);
  return input.chartStartDate;
}

function datesBetween(start: string, end: string) {
  if (compareDates(start, end) > 0) return [];
  const dates: string[] = [];
  for (let date = start; compareDates(date, end) <= 0; date = addDays(date, 1)) dates.push(date);
  return dates;
}

function scoreDaily(action: ProgressAction, dates: string[], loggedDates: Set<string>, input: ProgressInput) {
  const liveDates = dates.filter((date) => isActionLiveOnDate(action, date, input.timezone, input.dayStartHour));
  if (!liveDates.length) return null;
  const logged = liveDates.filter((date) => loggedDates.has(date)).length;
  return { score: logged / liveDates.length, detail: `${logged}/${liveDates.length} days` };
}

function scoreWeekly(action: ProgressAction, dates: string[], loggedDates: Set<string>, input: ProgressInput) {
  if (!action.weeklyTarget || action.weeklyTarget < 1) throw new RangeError("weekly actions need a positive weeklyTarget");

  const weeks = new Map<string, string[]>();
  dates.forEach((date) => {
    if (!isActionLiveOnDate(action, date, input.timezone, input.dayStartHour)) return;
    const start = weekStart(date);
    weeks.set(start, [...(weeks.get(start) ?? []), date]);
  });
  if (!weeks.size) return null;

  const scores = [...weeks.entries()].map(([start]) => {
    const logged = datesBetween(start, addDays(start, 6)).filter((date) => dates.includes(date) && loggedDates.has(date)).length;
    return { score: Math.min(1, logged / action.weeklyTarget!), detail: `${logged}/${action.weeklyTarget} this week` };
  });
  return { score: average(scores.map((item) => item.score))!, detail: scores.map((item) => item.detail).join(", ") };
}

function scoreOneOff(action: ProgressAction, logs: ProgressLog[]) {
  const logged = logs.some((log) => log.actionId === action.id);
  if (action.archivedAt && !logged) return null;
  return { score: logged ? 1 : 0, detail: logged ? "Done" : "Not done" };
}

export function calculateProgress(input: ProgressInput): ProgressResult {
  const start = windowStart(input);
  const dates = datesBetween(start, input.today);
  const logsByAction = new Map<string, Set<string>>();
  input.logs.forEach((log) => {
    const datesForAction = logsByAction.get(log.actionId) ?? new Set<string>();
    datesForAction.add(log.logDate);
    logsByAction.set(log.actionId, datesForAction);
  });

  const actions: Record<string, ActionProgress> = {};
  const subGoalScores = new Map<string, number[]>();
  input.actions.forEach((action) => {
    if (!subGoalScores.has(action.subGoalId)) subGoalScores.set(action.subGoalId, []);
    const loggedDates = logsByAction.get(action.id) ?? new Set<string>();
    const score = action.kind === "daily"
      ? scoreDaily(action, dates, loggedDates, input)
      : action.kind === "weekly"
        ? scoreWeekly(action, dates, loggedDates, input)
        : scoreOneOff(action, input.logs);
    if (!score) return;
    actions[action.id] = score;
    subGoalScores.set(action.subGoalId, [...(subGoalScores.get(action.subGoalId) ?? []), score.score]);
  });

  const subGoals: Record<string, SubGoalProgress> = {};
  subGoalScores.forEach((scores, subGoalId) => {
    subGoals[subGoalId] = { score: average(scores), actionCount: scores.length };
  });
  const overallScore = average(Object.values(subGoals).flatMap(({ score }) => score === null ? [] : [score]));
  return { actions, subGoals, overallScore };
}
