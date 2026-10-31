import Link from "next/link";

import { TopNav } from "@/components/top-nav";
import { addDays, effectiveDate } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/require-user";

import { HistoryControls } from "./history-controls";
import { redirect } from "next/navigation";

export const instant = false;

type HistoryPageProps = { searchParams: Promise<{ page?: string }> };

function friendlyDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: profile, error: profileError } = await supabase.from("profiles").select("timezone, day_start_hour").eq("id", user.id).maybeSingle();
  if (profileError) throw new Error(profileError.message);
  if (!profile) redirect("/settings");

  const currentDate = effectiveDate(new Date(), profile.timezone, profile.day_start_hour);
  const yesterday = addDays(currentDate, -1);
  const requestedPage = Number.parseInt((await searchParams).page ?? "0", 10);
  const page = Number.isInteger(requestedPage) && requestedPage >= 0 ? requestedPage : 0;
  const upper = addDays(yesterday, -page * 30);
  const lower = addDays(upper, -29);
  const [{ data: journals, error: journalsError }, { data: logs, error: logsError }] = await Promise.all([
    supabase.from("journal_entries").select("entry_date, body, mood").eq("user_id", user.id).gte("entry_date", lower).lte("entry_date", upper),
    supabase.from("action_logs").select("log_date").eq("user_id", user.id).gte("log_date", lower).lte("log_date", upper),
  ]);
  if (journalsError) throw new Error(journalsError.message);
  if (logsError) throw new Error(logsError.message);

  const days = new Map<string, { body: string; mood: number | null; actions: number }>();
  for (const journal of journals ?? []) days.set(journal.entry_date, { body: journal.body, mood: journal.mood, actions: 0 });
  for (const log of logs ?? []) {
    const day = days.get(log.log_date) ?? { body: "", mood: null, actions: 0 };
    day.actions += 1;
    days.set(log.log_date, day);
  }
  const entries = [...days.entries()].sort(([left], [right]) => right.localeCompare(left));

  return (
    <main className="min-h-screen bg-transparent px-4 py-6 pb-24 text-[var(--ink)] sm:px-8 sm:py-10 md:pb-10">
      <div className="mx-auto w-full max-w-7xl"><TopNav active="history" /><section className="mx-auto max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--muted-ink)]">History</p>
        <h1 className="mt-3 text-4xl tracking-tight sm:text-5xl">Your past work, gathered here.</h1>
        <p className="mt-3 text-base leading-7 text-[var(--muted-ink)]">Revisit a day, or make a note for one that got away.</p>
        <HistoryControls yesterday={yesterday} />
        {entries.length === 0 ? <div className="mt-8 rounded-3xl border border-dashed border-[var(--line)] bg-[var(--surface)]/70 p-8 text-center"><h2 className="text-xl">No past days yet.</h2><p className="mt-2 text-sm leading-6 text-[var(--muted-ink)]">Yesterday is a good place to begin a backfill.</p></div> : <div className="mt-8 grid gap-3">{entries.map(([date, entry]) => <Link key={date} href={`/history/${date}`} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)]/85 p-5 transition-[border-color,transform,background-color] hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[var(--surface-raised)] active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"><div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="text-xl">{friendlyDate(date)}</h2><span className="text-sm text-[var(--muted-ink)]">{entry.actions} {entry.actions === 1 ? "action" : "actions"} done</span></div>{entry.body && <p className="mt-3 line-clamp-2 text-[15px] leading-6 text-[var(--muted-ink)]">{entry.body.trim()}</p>}{entry.mood !== null && <p className="mt-3 text-sm text-[var(--accent)]">Mood {entry.mood}/5</p>}</Link>)}</div>}
        {(entries.length > 0 || page === 0) && <Link href={`/history?page=${page + 1}`} className="mt-6 flex min-h-12 items-center justify-center rounded-full border border-[var(--line)] text-sm font-medium hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">Load older days</Link>}
      </section></div>
    </main>
  );
}
