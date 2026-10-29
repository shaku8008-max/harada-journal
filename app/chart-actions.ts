"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/require-user";

const MAX_TITLE_LENGTH = 160;
const MAX_WHY_LENGTH = 2000;

export type ActionResult = {
  error?: string;
  id?: string;
};

type ChartInput = {
  chartId?: string;
  title: string;
  why?: string;
  targetDate?: string;
};

type SubGoalInput = {
  chartId: string;
  subGoalId?: string;
  position: number;
  title: string;
};

type ActionInput = {
  chartId: string;
  subGoalId: string;
  actionId?: string;
  position: number;
  title: string;
  kind: "daily" | "weekly" | "one_off";
  weeklyTarget?: number | null;
};

function cleanText(value: string | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function validateTitle(title: string) {
  const cleanTitle = cleanText(title);
  if (!cleanTitle) return "Add a title before saving.";
  if (cleanTitle.length > MAX_TITLE_LENGTH) {
    return `Titles must be ${MAX_TITLE_LENGTH} characters or fewer.`;
  }
  return null;
}

function validatePosition(position: number) {
  return typeof position === "number" && Number.isInteger(position) && position >= 1 && position <= 8;
}

function validateTargetDate(targetDate: string | undefined) {
  if (!targetDate) return null;
  if (typeof targetDate !== "string") return "Choose a valid target date.";
  return /^\d{4}-\d{2}-\d{2}$/.test(targetDate)
    ? null
    : "Choose a valid target date.";
}

async function ownedChart(chartId: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("charts")
    .select("id")
    .eq("id", chartId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function saveChart(input: ChartInput): Promise<ActionResult> {
  const user = await requireUser();
  const titleError = validateTitle(input.title);
  const targetDateError = validateTargetDate(input.targetDate);
  const why = cleanText(input.why);

  if (titleError) return { error: titleError };
  if (targetDateError) return { error: targetDateError };
  if (why.length > MAX_WHY_LENGTH) {
    return { error: `Why notes must be ${MAX_WHY_LENGTH} characters or fewer.` };
  }

  const supabase = await createClient();
  const values = {
    title: input.title.trim(),
    why: why || null,
    target_date: input.targetDate || null,
  };

  if (input.chartId) {
    const chart = await ownedChart(input.chartId, user.id);
    if (!chart) return { error: "That chart is no longer available." };

    const { error } = await supabase
      .from("charts")
      .update(values)
      .eq("id", input.chartId)
      .eq("user_id", user.id);
    return error ? { error: error.message } : { id: input.chartId };
  }

  const { data, error } = await supabase
    .from("charts")
    .insert({
      id: crypto.randomUUID(),
      user_id: user.id,
      ...values,
    })
    .select("id")
    .single();

  return error ? { error: error.message } : { id: data.id };
}

export async function saveSubGoal(input: SubGoalInput): Promise<ActionResult> {
  const user = await requireUser();
  const titleError = validateTitle(input.title);
  if (titleError) return { error: titleError };
  if (!validatePosition(input.position)) return { error: "Choose a valid sub-goal position." };
  if (!(await ownedChart(input.chartId, user.id))) {
    return { error: "That chart is no longer available." };
  }

  const supabase = await createClient();
  const values = {
    chart_id: input.chartId,
    position: input.position,
    title: input.title.trim(),
    user_id: user.id,
  };

  if (input.subGoalId) {
    const { data, error } = await supabase
      .from("sub_goals")
      .update({ position: values.position, title: values.title })
      .eq("id", input.subGoalId)
      .eq("chart_id", input.chartId)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();
    return error ? { error: error.message } : { id: data?.id ?? input.subGoalId };
  }

  const { data: existingSubGoal, error: existingError } = await supabase
    .from("sub_goals")
    .select("id")
    .eq("chart_id", input.chartId)
    .eq("position", input.position)
    .eq("user_id", user.id)
    .is("archived_at", null)
    .maybeSingle();
  if (existingError) return { error: existingError.message };
  if (existingSubGoal) {
    const { error } = await supabase
      .from("sub_goals")
      .update({ title: values.title })
      .eq("id", existingSubGoal.id)
      .eq("user_id", user.id);
    return error ? { error: error.message } : { id: existingSubGoal.id };
  }

  const { data, error } = await supabase
    .from("sub_goals")
    .insert({ id: crypto.randomUUID(), ...values })
    .select("id")
    .single();
  return error ? { error: error.message } : { id: data.id };
}

export async function saveAction(input: ActionInput): Promise<ActionResult> {
  const user = await requireUser();
  const titleError = validateTitle(input.title);
  if (titleError) return { error: titleError };
  if (!validatePosition(input.position)) return { error: "Choose a valid action position." };
  if (!['daily', 'weekly', 'one_off'].includes(input.kind)) return { error: "Choose a valid action rhythm." };
  if (!(await ownedChart(input.chartId, user.id))) {
    return { error: "That chart is no longer available." };
  }

  const supabase = await createClient();
  const { data: subGoal, error: subGoalError } = await supabase
    .from("sub_goals")
    .select("id")
    .eq("id", input.subGoalId)
    .eq("chart_id", input.chartId)
    .eq("user_id", user.id)
    .is("archived_at", null)
    .maybeSingle();
  if (subGoalError) return { error: subGoalError.message };
  if (!subGoal) return { error: "Save the sub-goal before adding an action." };

  const weeklyTarget = input.kind === "weekly" ? input.weeklyTarget ?? 3 : null;
  if (input.kind === "weekly" && (weeklyTarget === null || !Number.isInteger(weeklyTarget) || weeklyTarget < 1 || weeklyTarget > 7)) {
    return { error: "Weekly actions need a target from 1 to 7." };
  }

  const values = {
    kind: input.kind,
    position: input.position,
    title: input.title.trim(),
    user_id: user.id,
    weekly_target: weeklyTarget,
  };

  if (input.actionId) {
    const { data, error } = await supabase
      .from("actions")
      .update({
        kind: values.kind,
        position: values.position,
        title: values.title,
        weekly_target: values.weekly_target,
      })
      .eq("id", input.actionId)
      .eq("sub_goal_id", input.subGoalId)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();
    return error ? { error: error.message } : { id: data?.id ?? input.actionId };
  }

  const { data: existingAction, error: existingError } = await supabase
    .from("actions")
    .select("id")
    .eq("sub_goal_id", input.subGoalId)
    .eq("position", input.position)
    .eq("user_id", user.id)
    .is("archived_at", null)
    .maybeSingle();
  if (existingError) return { error: existingError.message };
  if (existingAction) {
    const { error } = await supabase
      .from("actions")
      .update({
        kind: values.kind,
        title: values.title,
        weekly_target: values.weekly_target,
      })
      .eq("id", existingAction.id)
      .eq("user_id", user.id);
    return error ? { error: error.message } : { id: existingAction.id };
  }

  const { data, error } = await supabase
    .from("actions")
    .insert({
      id: crypto.randomUUID(),
      sub_goal_id: input.subGoalId,
      ...values,
    })
    .select("id")
    .single();
  return error ? { error: error.message } : { id: data.id };
}

export async function archiveAction(input: { actionId: string; chartId: string }): Promise<ActionResult> {
  const user = await requireUser();
  if (!(await ownedChart(input.chartId, user.id))) {
    return { error: "That chart is no longer available." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("actions")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", input.actionId)
    .eq("user_id", user.id);
  return error ? { error: error.message } : {};
}

export async function archiveSubGoal(input: { subGoalId: string; chartId: string }): Promise<ActionResult> {
  const user = await requireUser();
  if (!(await ownedChart(input.chartId, user.id))) {
    return { error: "That chart is no longer available." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("archive_sub_goal", {
    p_chart_id: input.chartId,
    p_sub_goal_id: input.subGoalId,
  });
  return error ? { error: error.message } : {};
}
