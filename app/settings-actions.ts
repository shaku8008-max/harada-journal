"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/require-user";

export type SettingsResult = {
  error?: string;
};

function isValidTimeZone(value: string) {
  if (!value) return false;

  try {
    const supported = Intl.supportedValuesOf("timeZone");
    return supported.includes(value) || value === "UTC";
  } catch {
    return false;
  }
}

export async function saveSettings(input: {
  displayName: string;
  timezone: string;
  dayStartHour: number;
}): Promise<SettingsResult> {
  const user = await requireUser();
  const displayName = input.displayName.trim();

  if (displayName.length > 160) {
    return { error: "Display name must be 160 characters or fewer." };
  }
  if (!isValidTimeZone(input.timezone)) {
    return { error: "Choose a valid timezone." };
  }
  if (!Number.isInteger(input.dayStartHour) || input.dayStartHour < 0 || input.dayStartHour > 6) {
    return { error: "Day start must be an hour from 0 to 6." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    display_name: displayName || null,
    timezone: input.timezone,
    day_start_hour: input.dayStartHour,
  });

  return error ? { error: "Something went wrong. Please try again." } : {};
}
