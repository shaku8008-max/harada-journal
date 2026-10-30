import { isActionLiveOnDate } from "./action-dates";

export type ChartActionData = {
  id: string;
  title: string;
  position: number;
  kind: string;
  weekly_target: number | null;
  created_at: string;
  archived_at: string | null;
};

export type ChartGroupData = {
  id: string;
  title: string;
  position: number;
  archived_at: string | null;
  actions: ChartActionData[];
};

export type ChartData = {
  sub_goals: ChartGroupData[];
} | null;

export type TodayLog = { actionId: string; date: string };

export type TodayAction = {
  id: string;
  title: string;
  position: number;
  kind: "daily" | "weekly" | "one_off";
  weeklyTarget: number | null;
  archivedAt: string | null;
};

export type TodayGroup = { id: string; title: string; position: number; actions: TodayAction[] };

export function chartActionIds(chart: ChartData) {
  return (chart?.sub_goals ?? []).flatMap((group) => group.actions.map((action) => action.id));
}

export function actionIdsForKind(chart: ChartData, kind: ChartActionData["kind"]) {
  return (chart?.sub_goals ?? []).flatMap((group) => group.actions.filter((action) => action.kind === kind).map((action) => action.id));
}

export function mapChartGroups(
  chart: ChartData,
  date: string,
  timezone: string,
  dayStartHour: number,
  logs: TodayLog[],
): TodayGroup[] {
  const loggedOnDate = new Set(logs.filter((log) => log.date === date).map((log) => log.actionId));
  const loggedBeforeDate = new Set(logs.filter((log) => log.date <= date).map((log) => log.actionId));

  return (chart?.sub_goals ?? [])
    .filter((group) => !group.archived_at)
    .sort((left, right) => left.position - right.position)
    .map((group) => ({
      id: group.id,
      title: group.title,
      position: group.position,
      actions: group.actions
        .filter((action) => {
          if (!["daily", "weekly", "one_off"].includes(action.kind)) return false;
          const live = isActionLiveOnDate({ createdAt: action.created_at, archivedAt: action.archived_at }, date, timezone, dayStartHour);
          const archivedOnDate = !live && action.archived_at !== null && loggedOnDate.has(action.id);
          const oneOffIsOpen = action.kind !== "one_off" || !loggedBeforeDate.has(action.id) || loggedOnDate.has(action.id);
          return (live && oneOffIsOpen) || archivedOnDate;
        })
        .sort((left, right) => left.position - right.position)
        .map((action) => {
          const live = isActionLiveOnDate({ createdAt: action.created_at, archivedAt: action.archived_at }, date, timezone, dayStartHour);
          return {
            id: action.id,
            title: action.title,
            position: action.position,
            kind: action.kind as TodayAction["kind"],
            weeklyTarget: action.weekly_target,
            archivedAt: live ? null : action.archived_at,
          };
        }),
    }))
    .filter((group) => group.actions.length > 0);
}
