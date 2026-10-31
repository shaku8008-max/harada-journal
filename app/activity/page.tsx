import { ActivityHeatmap } from "@/components/activity-heatmap";
import { PageFallback } from "@/components/page-fallback";
import { TopNav } from "@/components/top-nav";
import { addDays, effectiveDate } from "@/lib/dates";
import { buildActivityGrid, type ActivityRecord } from "@/lib/activity";
import { calculateStreaks, STREAK_WINDOW_DAYS } from "@/lib/streaks";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/require-user";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const instant = false;

export default function ActivityPage() {
  return <Suspense fallback={<PageFallback label="Loading activity..." variant="activity" />}><ActivityPageContent /></Suspense>;
}

async function ActivityPageContent() {
  await connection();
  const user = await requireUser();
  const supabase = await createClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("timezone, day_start_hour")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) throw new Error(profileError.message);
  if (!profile) redirect("/settings");

  const today = effectiveDate(new Date(), profile.timezone, profile.day_start_hour);
  const fromDate = addDays(today, -(STREAK_WINDOW_DAYS - 1));
  const { data, error } = await supabase.rpc("daily_activity", { from_date: fromDate, to_date: today });
  if (error) throw new Error(error.message);

  const records: ActivityRecord[] = (data ?? []).map((row) => ({
    date: row.log_date,
    actionsDone: row.actions_done,
    hasEntry: row.has_entry,
  }));
  const streaks = calculateStreaks(records, today);
  const grid = buildActivityGrid(today, records);

  return (
    <main className="min-h-screen bg-transparent px-4 py-6 pb-24 text-[var(--ink)] sm:px-8 sm:py-10 md:pb-10">
      <div className="mx-auto w-full max-w-7xl">
        <TopNav active="activity" />
        <section className="mx-auto max-w-4xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--muted-ink)]">Activity</p>
          <h1 className="mt-3 text-4xl tracking-tight sm:text-5xl">A record of showing up.</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted-ink)]">Actions and journal days together, so the pattern is easier to see than the individual days.</p>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4">
            <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)]/85 p-5 sm:p-6">
              <p className="text-sm text-[var(--muted-ink)]">Current streak</p>
              <p className="mt-2 text-4xl font-semibold tracking-tight">{streaks.current}<span className="ml-2 text-base font-normal text-[var(--muted-ink)]">{streaks.current === 1 ? "day" : "days"}</span></p>
            </div>
            <div className="rounded-3xl border border-[var(--line)] bg-[var(--surface)]/85 p-5 sm:p-6">
              <p className="text-sm text-[var(--muted-ink)]">Longest (past year)</p>
              <p className="mt-2 text-4xl font-semibold tracking-tight">{streaks.longest}<span className="ml-2 text-base font-normal text-[var(--muted-ink)]">{streaks.longest === 1 ? "day" : "days"}</span></p>
            </div>
          </div>

          {records.length === 0 && <div className="mt-6 rounded-3xl border border-dashed border-[var(--line)] bg-[var(--surface)]/70 p-6 sm:p-8"><h2 className="text-xl">Your page is still open.</h2><p className="mt-2 max-w-xl text-[15px] leading-6 text-[var(--muted-ink)]">There is nothing to measure yet. Add a journal note or check off an action whenever it feels right.</p></div>}
          <ActivityHeatmap grid={grid} />
        </section>
      </div>
    </main>
  );
}
