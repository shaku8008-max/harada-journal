import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";

type AetherFlowHeroProps = { email?: string };

export function AetherFlowHero({ email }: AetherFlowHeroProps) {
  return (
    <section className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-5 py-24 sm:px-8">
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(115,65,170,0.25),transparent_38%),linear-gradient(180deg,#111321_0%,#090a10_80%)]" />
      <div aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-[var(--aether-lilac)]/20 to-transparent" />
      <div aria-hidden="true" className="absolute left-1/2 top-1/2 size-[min(70vw,36rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5" />

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <div className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-[var(--aether-lilac)]/25 bg-[var(--aether-lilac)]/10 px-4 py-2 text-sm font-medium text-[var(--aether-lilac)]">
          <Zap className="size-4" aria-hidden="true" />
          <span>Open Window 64</span>
        </div>
        <h1 className="text-5xl font-semibold tracking-[-0.06em] text-white sm:text-7xl lg:text-8xl">Open the window.</h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">
          Turn one meaningful goal into eight directions, then make the next move visible. Your private space for thinking clearly and showing up steadily.
        </p>
        <div className="mt-10">
          <Link href="/chart" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-black transition-colors hover:bg-[var(--aether-lilac)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--aether-lilac)]">
            Enter your journal
            <ArrowRight className="size-5" aria-hidden="true" />
          </Link>
        </div>
        {email && <p className="mt-7 text-sm text-white/35">Signed in as {email}</p>}
      </div>
    </section>
  );
}
