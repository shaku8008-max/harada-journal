import { TopNav } from "@/components/top-nav";
import { requireUser } from "@/lib/supabase/require-user";

export const instant = false;

export default async function HistoryPage() {
  await requireUser();

  return (
    <main className="min-h-screen bg-[var(--paper)] px-4 py-6 pb-24 text-[var(--ink)] sm:px-8 sm:py-10 md:pb-10">
      <div className="mx-auto w-full max-w-7xl">
        <TopNav active="history" />
        <section className="mx-auto max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--muted-ink)]">History</p>
          <h1 className="mt-3 text-4xl tracking-tight sm:text-5xl">Your past work, gathered here.</h1>
          <p className="mt-3 text-base leading-7 text-[var(--muted-ink)]">History and backfilling are coming in Phase 4b.</p>
        </section>
      </div>
    </main>
  );
}
