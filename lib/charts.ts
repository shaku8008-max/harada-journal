import type { Tables } from "@/lib/supabase/database.types";

import { createClient } from "@/lib/supabase/server";

export type ChartRecord = Pick<Tables<"charts">, "id" | "title" | "why" | "target_date">;
export type SubGoalRecord = Pick<Tables<"sub_goals">, "id" | "chart_id" | "position" | "title">;
export type ActionRecord = Pick<Tables<"actions">, "id" | "sub_goal_id" | "position" | "title" | "kind" | "weekly_target">;

export type ChartData = {
  chart: ChartRecord;
  subGoals: SubGoalRecord[];
  actions: ActionRecord[];
};

export async function getActiveChart(userId: string): Promise<ChartData | null> {
  const supabase = await createClient();
  const { data: chart, error: chartError } = await supabase
    .from("charts")
    .select("id, title, why, target_date")
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
    .select("id, chart_id, position, title")
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
        .select("id, sub_goal_id, position, title, kind, weekly_target")
        .in("sub_goal_id", subGoalIds)
        .eq("user_id", userId)
        .is("archived_at", null)
        .order("position")
    : { data: [], error: null };

  if (actionError) {
    throw new Error(`Unable to load actions: ${actionError.message}`);
  }

  return { chart, subGoals, actions };
}
