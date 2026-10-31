import type { Tables } from "@/lib/supabase/database.types";

import { createClient } from "@/lib/supabase/server";

export type ChartRecord = Pick<Tables<"charts">, "id" | "title" | "why" | "target_date" | "started_at" | "archived_at" | "status">;
export type SubGoalRecord = Pick<Tables<"sub_goals">, "id" | "chart_id" | "position" | "title" | "archived_at">;
export type ActionKind = "daily" | "weekly" | "one_off";
export type ActionRecord = Pick<Tables<"actions">, "id" | "sub_goal_id" | "position" | "title" | "weekly_target" | "created_at" | "archived_at"> & { kind: ActionKind };
export type ActionLogRecord = Pick<Tables<"action_logs">, "action_id" | "log_date">;

export type ChartData = {
  chart: ChartRecord;
  subGoals: SubGoalRecord[];
  actions: ActionRecord[];
};

function isActionKind(value: string): value is ActionKind {
  return value === "daily" || value === "weekly" || value === "one_off";
}

export async function getActiveChart(userId: string): Promise<ChartData | null> {
  const supabase = await createClient();
  const { data: chart, error: chartError } = await supabase
    .from("charts")
    .select("id, title, why, target_date, started_at, archived_at, status")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (chartError) {
    throw new Error(`Unable to load the active chart: ${chartError.message}`);
  }

  if (!chart) {
    return null;
  }

  const { data: subGoals, error: subGoalError } = await supabase
    .from("sub_goals")
    .select("id, chart_id, position, title, archived_at")
    .eq("chart_id", chart.id)
    .eq("user_id", userId)
    .is("archived_at", null)
    .order("position");

  if (subGoalError) {
    throw new Error(`Unable to load sub-goals: ${subGoalError.message}`);
  }

  const subGoalIds = subGoals.map((subGoal) => subGoal.id);
  const { data: actions, error: actionError } = subGoalIds.length
    ? await supabase
        .from("actions")
        .select("id, sub_goal_id, position, title, kind, weekly_target, created_at, archived_at")
        .in("sub_goal_id", subGoalIds)
        .eq("user_id", userId)
        .is("archived_at", null)
        .order("position")
    : { data: [], error: null };

  if (actionError) {
    throw new Error(`Unable to load actions: ${actionError.message}`);
  }

  const normalisedActions = (actions ?? [])
    .filter((action) => isActionKind(action.kind))
    .map((action) => ({ ...action, kind: action.kind as ActionKind }));
  return { chart, subGoals, actions: normalisedActions };
}

async function loadArchivedChart(userId: string, chart: ChartRecord): Promise<ChartData> {
  const supabase = await createClient();
  const { data: subGoals, error: subGoalError } = await supabase
    .from("sub_goals")
    .select("id, chart_id, position, title, archived_at")
    .eq("chart_id", chart.id)
    .eq("user_id", userId)
    .order("position");
  if (subGoalError) throw new Error(`Unable to load sub-goals: ${subGoalError.message}`);

  const subGoalIds = (subGoals ?? []).map((subGoal) => subGoal.id);
  const { data: actions, error: actionError } = subGoalIds.length
    ? await supabase
        .from("actions")
        .select("id, sub_goal_id, position, title, kind, weekly_target, created_at, archived_at")
        .in("sub_goal_id", subGoalIds)
        .eq("user_id", userId)
        .order("position")
    : { data: [], error: null };
  if (actionError) throw new Error(`Unable to load actions: ${actionError.message}`);

  return {
    chart,
    subGoals: subGoals ?? [],
    actions: (actions ?? [])
      .filter((action) => isActionKind(action.kind))
      .map((action) => ({ ...action, kind: action.kind as ActionKind })),
  };
}

export async function getArchivedCharts(userId: string): Promise<ChartData[]> {
  const supabase = await createClient();
  const { data: charts, error } = await supabase
    .from("charts")
    .select("id, title, why, target_date, started_at, archived_at, status")
    .eq("user_id", userId)
    .eq("status", "archived")
    .order("archived_at", { ascending: false });
  if (error) throw new Error(`Unable to load archived charts: ${error.message}`);
  return Promise.all((charts ?? []).map((chart) => loadArchivedChart(userId, chart)));
}

export async function getArchivedChart(userId: string, chartId: string): Promise<ChartData | null> {
  const supabase = await createClient();
  const { data: chart, error } = await supabase
    .from("charts")
    .select("id, title, why, target_date, started_at, archived_at, status")
    .eq("id", chartId)
    .eq("user_id", userId)
    .eq("status", "archived")
    .maybeSingle();
  if (error) throw new Error(`Unable to load archived chart: ${error.message}`);
  return chart ? loadArchivedChart(userId, chart) : null;
}

export async function getActionLogsForProgress(
  userId: string,
  actionIds: string[],
  oneOffActionIds: string[],
  startDate: string,
  endDate: string,
): Promise<ActionLogRecord[]> {
  if (!actionIds.length) return [];

  const supabase = await createClient();
  const logs: ActionLogRecord[] = [];
  const pageSize = 1000;
  let offset = 0;
  const actionFilter = `action_id.in.(${actionIds.join(",")})`;
  const dateFilter = `and(log_date.gte.${startDate},log_date.lte.${endDate},${actionFilter})`;
  const oneOffFilter = oneOffActionIds.length ? `action_id.in.(${oneOffActionIds.join(",")})` : null;

  // Supabase defaults to 1,000 rows; paginate until a short page so history cannot truncate silently.
  while (true) {
    const query = supabase
      .from("action_logs")
      .select("action_id, log_date")
      .eq("user_id", userId)
      .or(oneOffFilter ? `${dateFilter},${oneOffFilter}` : dateFilter)
      .order("log_date")
      .order("action_id")
      .range(offset, offset + pageSize - 1);
    const { data, error } = await query;
    if (error) throw new Error(`Unable to load action progress: ${error.message}`);
    logs.push(...(data ?? []));
    if (!data || data.length < pageSize) return logs;
    offset += pageSize;
  }
}
