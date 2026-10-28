import { requireUser } from "@/lib/supabase/require-user";
import { signOut } from "./actions";

// The page reads the request-bound Supabase cookie for every authenticated visit.
export const instant = false;

export default async function Home() {
  const user = await requireUser();

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 px-4 py-10 text-stone-950">
      <section className="w-full max-w-lg rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-stone-500">
          Harada Journal
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Your window is ready.
        </h1>
        <p className="mt-3 text-stone-600">
          You are signed in as <span className="font-medium text-stone-950">{user.email}</span>.
        </p>
        <p className="mt-8 rounded-2xl bg-stone-100 p-4 text-sm leading-6 text-stone-600">
          The goal chart and daily journal will appear here in the next phases.
        </p>
        <form action={signOut} className="mt-8">
          <button
            type="submit"
            className="min-h-11 w-full rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
          >
            Sign out
          </button>
        </form>
      </section>
    </main>
  );
}
