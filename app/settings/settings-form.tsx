"use client";

import { useState, useSyncExternalStore, useTransition } from "react";

import { saveSettings } from "@/app/settings-actions";

type SettingsFormProps = {
  displayName: string;
  timezone: string | null;
  dayStartHour: number;
  timezones: string[];
};

export function SettingsForm({ displayName: initialDisplayName, timezone: initialTimezone, dayStartHour: initialDayStartHour, timezones }: SettingsFormProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [timezone, setTimezone] = useState<string | null>(initialTimezone);
  const [dayStartHour, setDayStartHour] = useState(initialDayStartHour);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const browserTimezone = useSyncExternalStore(
    () => () => {},
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "Australia/Melbourne",
    () => "",
  );
  const selectedTimezone = timezone ?? browserTimezone;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await saveSettings({ displayName, timezone: selectedTimezone, dayStartHour });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-6">
      <div className="grid gap-2">
        <label htmlFor="display-name" className="text-sm font-medium">Display name</label>
        <input
          id="display-name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          maxLength={160}
          autoComplete="name"
          className="min-h-12 rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 text-base outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
        />
      </div>
      <div className="grid gap-2">
        <label htmlFor="timezone" className="text-sm font-medium">Timezone</label>
        <input
          id="timezone"
          list="timezone-options"
          value={selectedTimezone}
          onChange={(event) => setTimezone(event.target.value)}
          required
          className="min-h-12 rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 text-base outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
        />
        <datalist id="timezone-options">
          {timezones.map((item) => <option key={item} value={item} />)}
        </datalist>
        <p className="text-sm text-[var(--muted-ink)]">Use an IANA timezone such as Australia/Melbourne.</p>
      </div>
      <div className="grid gap-2">
        <label htmlFor="day-start-hour" className="text-sm font-medium">My day starts at</label>
        <select
          id="day-start-hour"
          value={dayStartHour}
          onChange={(event) => setDayStartHour(Number(event.target.value))}
          className="min-h-12 rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 text-base outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
        >
          {Array.from({ length: 7 }, (_, hour) => <option key={hour} value={hour}>{hour}:00</option>)}
        </select>
        <p className="text-sm text-[var(--muted-ink)]">Entries before this hour count toward the previous day.</p>
      </div>
      <button type="submit" disabled={isPending} className="min-h-12 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-medium text-[var(--accent-foreground)] transition hover:bg-[var(--aether-lilac)] disabled:cursor-wait disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">
        {isPending ? "Saving..." : "Save settings"}
      </button>
      {saved && <p role="status" className="text-sm text-emerald-300">Settings saved.</p>}
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
    </form>
  );
}
