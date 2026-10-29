import { getActiveChart } from "@/lib/charts";
import { requireUser } from "@/lib/supabase/require-user";
import { ChartWizard } from "@/components/chart-wizard";
import { ChartWorkspace } from "@/components/chart-workspace";
import { signOut } from "@/app/actions";

export const instant = false;

export default async function ChartPage({
  searchParams,
}: {
  searchParams: Promise<{ subGoal?: string | string[] | undefined }>;
}) {
  const user = await requireUser();
  const chartData = await getActiveChart(user.id);
  const query = await searchParams;
  const rawSubGoal = Array.isArray(query.subGoal) ? query.subGoal[0] : query.subGoal;
  const parsedSubGoal = rawSubGoal ? Number(rawSubGoal) : NaN;
  const expandedPosition = Number.isInteger(parsedSubGoal) && parsedSubGoal >= 1 && parsedSubGoal <= 8 ? parsedSubGoal : null;

  return (
    <main className="min-h-screen bg-[var(--paper)] px-4 py-6 text-[var(--ink)] sm:px-8 sm:py-10">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--muted-ink)]">Harada Journal</p>
            <p className="mt-2 text-sm text-[var(--muted-ink)]">Your goal, opened out.</p>
          </div>
          <form action={signOut}>
            <button type="submit" className="min-h-11 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">Sign out</button>
          </form>
        </header>
        {chartData ? <ChartWorkspace data={chartData} expandedPosition={expandedPosition} /> : <ChartWizard />}
      </div>
    </main>
  );
}
