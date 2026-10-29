import { AetherFlowHero } from "@/components/aether-flow-hero";
import { requireUser } from "@/lib/supabase/require-user";
import { signOut } from "./actions";

export const instant = false;

export default async function Home() {
  const user = await requireUser();

  return (
    <main className="min-h-screen bg-[var(--aether-black)] text-white">
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-5 sm:px-10 sm:py-7">
        <p className="text-sm font-medium tracking-[0.18em] text-white/70">HARADA JOURNAL</p>
        <form action={signOut}>
          <button type="submit" className="min-h-11 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-sm transition hover:border-white/35 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--aether-lilac)]">Sign out</button>
        </form>
      </header>
      <AetherFlowHero email={user.email ?? undefined} />
    </main>
  );
}
