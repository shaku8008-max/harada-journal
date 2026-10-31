"use client";

import { useState, useSyncExternalStore, useTransition } from "react";

import { saveSettings } from "@/app/settings-actions";
import { createClient } from "@/lib/supabase/client";

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
  const [newPassword, setNewPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [isPasswordPending, setIsPasswordPending] = useState(false);

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

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError(null);
    setPasswordSaved(false);

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== passwordConfirmation) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setIsPasswordPending(true);
    try {
      const { error } = await createClient().auth.updateUser({ password: newPassword });
      if (error) {
        const text = error.message.toLowerCase();
        if (text.includes("different") || text.includes("same") || text.includes("old password")) {
          setPasswordError("Choose a password different from your current one.");
        } else if (error.status === 401 || text.includes("expired") || text.includes("session") || text.includes("jwt")) {
          setPasswordError("Please sign in again, then retry.");
        } else {
          setPasswordError("Something went wrong. Please try again.");
        }
        return;
      }
      setNewPassword("");
      setPasswordConfirmation("");
      setPasswordSaved(true);
    } catch {
      setPasswordError("Something went wrong. Please try again.");
    } finally {
      setIsPasswordPending(false);
    }
  }

  return (
    <div className="grid gap-10">
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

      <section className="border-t border-[var(--line)] pt-8">
        <h2 className="text-xl font-semibold">Set or change password</h2>
        <p className="mt-2 text-sm text-[var(--muted-ink)]">Use at least 8 characters.</p>
        <form onSubmit={changePassword} className="mt-5 grid gap-5">
          <div className="grid gap-2">
            <label htmlFor="new-password" className="text-sm font-medium">New password</label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="min-h-12 rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 text-base outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="password-confirmation" className="text-sm font-medium">Confirm new password</label>
            <input
              id="password-confirmation"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={passwordConfirmation}
              onChange={(event) => setPasswordConfirmation(event.target.value)}
              className="min-h-12 rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 text-base outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
            />
          </div>
          <button type="submit" disabled={isPasswordPending} className="min-h-12 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-medium text-[var(--accent-foreground)] transition hover:bg-[var(--aether-lilac)] disabled:cursor-wait disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">
            {isPasswordPending ? "Saving..." : "Save password"}
          </button>
          {passwordSaved && <p role="status" className="text-sm text-emerald-300">Password saved.</p>}
          {passwordError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{passwordError}</p>}
        </form>
      </section>
    </div>
  );
}
