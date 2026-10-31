"use server";

import { effectiveDate, isValidDateString } from "@/lib/dates";
import { isActionLiveOnDate } from "@/lib/action-dates";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/require-user";

const MAX_BODY_LENGTH = 20_000;

export type TodayActionResult = { error?: string };

async function userDaySettings(userId: string) {
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("timezone, day_start_hour")
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile) throw new Error(error?.message ?? "Your profile is unavailable.");
  return profile;
}

function validateDate(date: unknown): date is string {
  return typeof date === "string" && isValidDateString(date);
}

export async function toggleActionLog(actionId: string, date: string): Promise<TodayActionResult> {
  const user = await requireUser();
  if (typeof actionId !== "string" || !actionId) return { error: "That action is not available." };
  if (!validateDate(date)) return { error: "Choose a valid date." };

  const profile = await userDaySettings(user.id);
  const currentDate = effectiveDate(new Date(), profile.timezone, profile.day_start_hour);
  if (date > currentDate) return { error: "Future actions cannot be checked off." };

  const supabase = await createClient();
  const { data: action, error: actionError } = await supabase
    .from("actions")
    .select("id, created_at, archived_at, sub_goals!inner(chart_id, charts!inner(status))")
    .eq("id", actionId)
    .eq("user_id", user.id)
    .eq("sub_goals.charts.status", "active")
    .maybeSingle();
  if (actionError) return { error: actionError.message };
  if (!action) return { error: "That action is no longer available." };
  if (!isActionLiveOnDate({ createdAt: action.created_at, archivedAt: action.archived_at }, date, profile.timezone, profile.day_start_hour)) {
    return { error: "That action was not available on this day." };
  }

  const { data: existing, error: existingError } = await supabase
    .from("action_logs")
    .select("id")
    .eq("action_id", actionId)
    .eq("user_id", user.id)
    .eq("log_date", date)
    .maybeSingle();
  if (existingError) return { error: existingError.message };

  if (existing) {
    const { error } = await supabase
      .from("action_logs")
      .delete()
      .eq("id", existing.id)
      .eq("user_id", user.id);
    return error ? { error: error.message } : {};
  }

  const { error } = await supabase.from("action_logs").insert({
    id: crypto.randomUUID(),
    action_id: actionId,
    user_id: user.id,
    log_date: date,
  });
  return error ? { error: error.message } : {};
}

export async function saveJournalEntry(
  date: string,
  body: string,
  mood: number | null,
): Promise<TodayActionResult> {
  const user = await requireUser();
  if (!validateDate(date)) return { error: "Choose a valid date." };
  if (typeof body !== "string" || body.length > MAX_BODY_LENGTH) {
    return { error: `Reflections must be ${MAX_BODY_LENGTH} characters or fewer.` };
  }
  if (mood !== null && (!Number.isInteger(mood) || mood < 1 || mood > 5)) {
    return { error: "Mood must be between 1 and 5." };
  }

  const profile = await userDaySettings(user.id);
  const currentDate = effectiveDate(new Date(), profile.timezone, profile.day_start_hour);
  if (date > currentDate) return { error: "Future entries cannot be saved." };

  const supabase = await createClient();
  const { error } = await supabase.from("journal_entries").upsert(
    {
      id: crypto.randomUUID(),
      user_id: user.id,
      entry_date: date,
      body,
      mood,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,entry_date" },
  );
  return error ? { error: error.message } : {};
}
