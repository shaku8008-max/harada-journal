import { requireUser } from "@/lib/supabase/require-user";
import { getActiveChart } from "@/lib/charts";
import { ChartWizard } from "@/components/chart-wizard";
import { ChartWorkspace } from "@/components/chart-workspace";
import { signOut } from "./actions";

// The page reads the request-bound Supabase cookie for every authenticated visit.
export const instant = false;

export default async function Home() {
  const user = await requireUser();
  const chartData = await getActiveChart(user.id);

  return (
    <main className="min-h-screen bg-[var(--paper)] px-4 py-6 text-[var(--ink)] sm:px-8 sm:py-10">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--muted-ink)]">
              Harada Journal
            </p>
            <p className="mt-2 text-sm text-[var(--muted-ink)]">A quiet place to keep the window open.</p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="min-h-11 rounded-full border border-[var(--line)] bg-[var(--paper)] px-4 py-2 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              Sign out
            </button>
          </form>
        </header>
        {chartData ? <ChartWorkspace data={chartData} /> : <ChartWizard />}
      </div>
    </main>
  );
}
