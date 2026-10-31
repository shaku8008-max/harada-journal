import Link from "next/link";

export default function HistoryDateNotFound() {
  return (
    <main className="min-h-screen bg-transparent px-4 py-10 text-[var(--ink)] sm:px-8">
      <section className="mx-auto max-w-xl rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-8 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--muted-ink)]">History</p>
        <h1 className="mt-3 text-3xl">That day is not available.</h1>
        <p className="mt-3 text-base leading-7 text-[var(--muted-ink)]">Choose a valid past date to open or backfill an entry.</p>
        <Link href="/history" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-[var(--accent)] px-5 text-sm font-medium text-[var(--accent-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">Back to history</Link>
      </section>
    </main>
  );
}
