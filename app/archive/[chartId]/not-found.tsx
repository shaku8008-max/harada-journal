import Link from "next/link";

export default function ArchivedChartNotFound() {
  return <main className="grid min-h-screen place-items-center px-6 text-center text-[var(--ink)]"><div><p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--muted-ink)]">Archive</p><h1 className="mt-3 text-3xl">That finished chart is not available.</h1><p className="mt-3 text-base text-[var(--muted-ink)]">It may not belong to you, or it may still be active.</p><Link href="/archive" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-[var(--accent)] px-5 text-sm font-medium text-[var(--accent-foreground)]">Back to archive</Link></div></main>;
}
