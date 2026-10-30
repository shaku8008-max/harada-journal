"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";

import { saveJournalEntry, toggleActionLog } from "@/app/today-actions";

export type Action = {
  id: string;
  title: string;
  position: number;
  kind: "daily" | "weekly" | "one_off";
  weeklyTarget: number | null;
  archivedAt: string | null;
};

export type Group = { id: string; title: string; position: number; actions: Action[] };

export type TodayClientProps = {
  userId: string;
  date: string;
  isHistory?: boolean;
  yesterday?: string;
  calendarDate: string;
  dayStartHour: number;
  weekStart: string;
  groups: Group[];
  logs: { actionId: string; date: string }[];
  journal: { body: string; mood: number | null; createdAt: string | null; updatedAt: string | null } | null;
};

type Draft = { body: string; mood: number | null; savedAt: number };
type SaveStatus = "Saved" | "Saving..." | "Not saved. Retry";

function timestamp() {
  return Date.now();
}

function draftKey(userId: string, date: string) {
  return `harada-journal-draft:${userId}:${date}`;
}

function friendlyDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

function friendlyWeekday(date: string) {
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function TodayClient({ userId, date, isHistory = false, yesterday, calendarDate, dayStartHour, weekStart, groups, logs, journal }: TodayClientProps) {
  const [doneIds, setDoneIds] = useState(() => new Set(logs.filter((log) => log.date === date).map((log) => log.actionId)));
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [body, setBody] = useState(journal?.body ?? "");
  const [mood, setMood] = useState<number | null>(journal?.mood ?? null);
  const [status, setStatus] = useState<SaveStatus>("Saved");
  const [restoreDraft, setRestoreDraft] = useState<Draft | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveSequence = useRef(0);
  const [, startTransition] = useTransition();

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(draftKey(userId, date));
      if (raw) {
        const draft = JSON.parse(raw) as Draft;
        if (typeof draft.body === "string" && typeof draft.savedAt === "number" && draft.savedAt > new Date(journal?.updatedAt ?? 0).getTime()) {
          queueMicrotask(() => setRestoreDraft({ body: draft.body, mood: Number.isInteger(draft.mood) ? draft.mood : null, savedAt: draft.savedAt }));
        }
      }
    } catch {
      // A blocked or full localStorage must not prevent server saving.
    }
    queueMicrotask(() => setHydrated(true));
  }, [date, journal?.updatedAt, userId]);

  function cacheDraft(nextBody: string, nextMood: number | null) {
    try {
      window.localStorage.setItem(draftKey(userId, date), JSON.stringify({ body: nextBody, mood: nextMood, savedAt: timestamp() }));
    } catch {
      // The server save remains available when localStorage is unavailable.
    }
  }

  function clearDraft() {
    try {
      window.localStorage.removeItem(draftKey(userId, date));
    } catch {
      // A blocked localStorage does not affect the saved server entry.
    }
  }

  async function saveDraft(nextBody = body, nextMood = mood) {
    const sequence = ++saveSequence.current;
    setStatus("Saving...");
    try {
      const result = await saveJournalEntry(date, nextBody, nextMood);
      if (sequence !== saveSequence.current) return;
      if (result.error) {
        setStatus("Not saved. Retry");
      } else {
        clearDraft();
        setStatus("Saved");
      }
    } catch {
      if (sequence === saveSequence.current) setStatus("Not saved. Retry");
    }
  }

  function queueSave(nextBody: string, nextMood: number | null) {
    cacheDraft(nextBody, nextMood);
    setStatus("Saving...");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      startTransition(() => { void saveDraft(nextBody, nextMood); });
    }, 1500);
  }

  function changeBody(nextBody: string) {
    setBody(nextBody);
    if (hydrated) queueSave(nextBody, mood);
  }

  function changeMood(nextMood: number | null) {
    setMood(nextMood);
    if (hydrated) queueSave(body, nextMood);
  }

  function restore() {
    if (!restoreDraft) return;
    setBody(restoreDraft.body);
    setMood(restoreDraft.mood);
    setRestoreDraft(null);
    queueSave(restoreDraft.body, restoreDraft.mood);
  }

  function blurSave() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    startTransition(() => { void saveDraft(); });
  }

  async function toggle(actionId: string) {
    if (pendingAction) return;
    if (groups.some((group) => group.actions.some((action) => action.id === actionId && action.archivedAt))) return;
    setActionError(null);
    const wasDone = doneIds.has(actionId);
    setDoneIds((current) => {
      const next = new Set(current);
      if (wasDone) next.delete(actionId); else next.add(actionId);
      return next;
    });
    setPendingAction(actionId);
    try {
      const result = await toggleActionLog(actionId, date);
      if (result.error) throw new Error(result.error);
    } catch (error) {
      setDoneIds((current) => {
        const next = new Set(current);
        if (wasDone) next.add(actionId); else next.delete(actionId);
        return next;
      });
      setActionError(error instanceof Error ? error.message : "Could not save that check-off. Try again.");
    } finally {
      setPendingAction(null);
    }
  }

  const visibleGroups = groups.map((group) => ({
    ...group,
    actions: group.actions.filter((action) => isHistory || action.kind !== "one_off" || !logs.some((log) => log.actionId === action.id)),
  })).filter((group) => group.actions.length > 0);

  return (
    <>
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--muted-ink)]">{isHistory ? "Backfill" : "Today"}</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">{friendlyDate(date)}</h1>
        {!isHistory && date !== calendarDate && <p className="mt-2 text-sm text-[var(--accent)]">Counting as {friendlyWeekday(date)} until {dayStartHour}:00</p>}
        <p className="mt-3 text-base leading-7 text-[var(--muted-ink)]">Small steps, kept visible.</p>
        {!isHistory && yesterday && <Link href={`/history/${yesterday}`} className="mt-5 inline-flex min-h-11 items-center rounded-full border border-[var(--line)] px-4 text-sm font-medium hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">Yesterday</Link>}
      </header>
      <section className="mt-8 rounded-3xl border border-[var(--line)] border-t-[var(--accent)]/70 bg-[var(--surface)]/90 p-5 shadow-[0_24px_80px_rgb(0_0_0_/_0.22)] backdrop-blur-sm sm:p-7" aria-labelledby="journal-heading">
        <div className="flex items-start justify-between gap-4">
          <div><h2 id="journal-heading" className="text-2xl">Reflection</h2><p className="mt-1 text-sm text-[var(--muted-ink)]">What is worth remembering from today?</p></div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${status === "Saved" ? "bg-emerald-400/10 text-emerald-300" : status === "Saving..." ? "bg-[var(--accent)]/10 text-[var(--accent)]" : "bg-[var(--destructive)]/10 text-[var(--destructive)]"}`} role="status">{status}</span>
        </div>
        {restoreDraft && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-4 py-3 text-sm"><span>A newer local draft is available.</span><button type="button" onClick={restore} className="min-h-11 rounded-full bg-[var(--accent)] px-4 font-medium text-[var(--accent-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">Restore draft</button></div>}
        <textarea value={body} onChange={(event) => changeBody(event.target.value)} onBlur={blurSave} maxLength={20000} aria-label={`${isHistory ? "Reflection for" : "Today's reflection"} ${friendlyDate(date)}`} placeholder="A few honest lines are enough..." className="mt-5 min-h-44 w-full resize-y rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 text-base leading-7 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20" />
        <div className="mt-5 flex flex-wrap items-center gap-3"><span className="text-sm font-medium">Mood <span className="font-normal text-[var(--muted-ink)]">(optional)</span></span>{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" aria-label={`Mood ${value} of 5`} aria-pressed={mood === value} onClick={() => changeMood(mood === value ? null : value)} className={`min-h-11 min-w-11 rounded-full border text-base font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${mood === value ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]" : "border-[var(--line)] text-[var(--muted-ink)] hover:border-[var(--accent)]"}`}>{value}</button>)}</div>
        {journal && <p className="mt-4 text-xs text-[var(--muted-ink)]">Created {journal.createdAt ? formatTimestamp(journal.createdAt) : "unknown"} · Last edited {journal.updatedAt ? formatTimestamp(journal.updatedAt) : "unknown"}</p>}
        {status === "Not saved. Retry" && <button type="button" onClick={() => void saveDraft()} className="mt-4 text-sm font-medium text-[var(--accent)] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">Retry saving</button>}
      </section>
      <section className="mt-8" aria-labelledby="actions-heading"><div className="flex items-end justify-between gap-4"><div><h2 id="actions-heading" className="text-2xl">Actions</h2><p className="mt-1 text-sm text-[var(--muted-ink)]">A few check-offs can carry a lot of momentum.</p></div>{actionError && <p role="alert" className="max-w-xs text-right text-sm text-[var(--destructive)]">{actionError}</p>}</div>
        {visibleGroups.length === 0 ? <div className="mt-5 rounded-3xl border border-dashed border-[var(--line)] bg-[var(--surface)]/70 p-8 text-center"><h3 className="text-xl">Nothing to check off yet.</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--muted-ink)]">Build your chart first, then your daily actions will meet you here.</p></div> : <div className="mt-5 grid gap-4">{visibleGroups.map((group) => <div key={group.id} style={{ "--position-accent": `var(--position-${group.position}-accent)` } as CSSProperties} className="overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)]/90 shadow-[0_16px_48px_rgb(0_0_0_/_0.16)]"><div className="border-l-4 border-[var(--position-accent)] px-5 py-4"><h3 className="text-lg">{group.title}</h3></div><div className="border-t border-[var(--line)]">{group.actions.map((action) => { const done = doneIds.has(action.id); const todayWasLogged = logs.some((log) => log.actionId === action.id && log.date === date); const weeklyCount = logs.filter((log) => log.actionId === action.id && log.date >= weekStart && log.date <= date).length + (done && !todayWasLogged ? 1 : 0) - (!done && todayWasLogged ? 1 : 0); const archived = Boolean(action.archivedAt); return <button key={action.id} type="button" disabled={archived || pendingAction === action.id} onClick={() => void toggle(action.id)} aria-label={`${action.title}${archived ? ", archived" : `, done: ${done ? "yes" : "no"}`}`} className={`flex min-h-14 w-full items-center gap-4 border-b border-[var(--line)] px-5 text-left transition-[background-color,transform] last:border-b-0 hover:bg-[var(--paper)] active:scale-[0.995] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent)] ${archived ? "bg-[var(--paper)]" : ""}`}><span aria-hidden="true" className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 ${done ? "border-[var(--position-accent)] bg-[var(--position-accent)] text-[var(--paper)]" : "border-[var(--muted-ink)]"}`}>{done ? "✓" : ""}</span><span className={done ? "text-[var(--muted-ink)] line-through" : ""}>{action.title}</span>{archived && <span className="ml-auto shrink-0 text-sm text-[var(--muted-ink)]">Archived</span>}{!archived && action.kind === "weekly" && <span className="ml-auto shrink-0 text-sm text-[var(--muted-ink)]">{weeklyCount}/{action.weeklyTarget ?? 1} this week</span>}</button> })}</div></div>)}</div>}
      </section>
    </>
  );
}
