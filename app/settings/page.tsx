import { requireUser } from "@/lib/supabase/require-user";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./settings-form";

export const instant = false;

export default async function SettingsPage() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("display_name, timezone, day_start_hour")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw new Error(`Unable to load settings: ${error.message}`);

  return (
    <main className="min-h-screen bg-[var(--paper)] px-4 py-6 text-[var(--ink)] sm:px-8 sm:py-10">
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-10">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--muted-ink)]">Harada Journal</p>
          <h1 className="mt-3 text-4xl tracking-tight sm:text-5xl">Settings</h1>
          <p className="mt-3 text-base leading-7 text-[var(--muted-ink)]">Set the timezone and day boundary used for your journal.</p>
        </header>
        <section className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.18)] sm:p-8">
          <SettingsForm
            displayName={profile?.display_name ?? ""}
            timezone={profile?.timezone ?? null}
            dayStartHour={profile?.day_start_hour ?? 3}
            timezones={Intl.supportedValuesOf("timeZone")}
          />
        </section>
      </div>
    </main>
  );
}
