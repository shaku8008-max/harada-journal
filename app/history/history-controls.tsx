"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type HistoryControlsProps = {
  date?: string;
  currentDate: string;
  yesterday: string;
  previousDate?: string;
  nextHref?: string;
};

export function HistoryControls({ date, currentDate, yesterday, previousDate, nextHref }: HistoryControlsProps) {
  const router = useRouter();

  function chooseDate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("date");
    if (typeof value === "string" && value) router.push(`/history/${value}`);
  }

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      {date && <Link href={date === yesterday ? "/today" : `/history/${yesterday}`} className="min-h-11 rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">{date === yesterday ? "Today" : "Yesterday"}</Link>}
      {!date && <Link href={`/history/${yesterday}`} className="min-h-11 rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">Yesterday</Link>}
      {date && previousDate && nextHref && <div className="flex items-center gap-2"><Link href={`/history/${previousDate}`} aria-label="Previous day" className="grid min-h-11 min-w-11 place-items-center rounded-full border border-[var(--line)] text-lg hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">←</Link><Link href={nextHref} aria-label="Next day" className="grid min-h-11 min-w-11 place-items-center rounded-full border border-[var(--line)] text-lg hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">→</Link></div>}
      <form onSubmit={chooseDate} className="flex min-h-11 items-center gap-2"><label htmlFor="history-date" className="sr-only">Choose a past date</label><input id="history-date" name="date" type="date" defaultValue={date} max={date ? yesterday : currentDate} className="min-h-11 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 text-[15px] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20" /><button type="submit" className="min-h-11 rounded-full bg-[var(--ink)] px-4 text-sm font-medium text-[var(--paper)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">Open</button></form>
    </div>
  );
}
