import Link from "next/link";
import { LinkPending } from "@/components/link-pending";

const items = [
  ["chart", "Chart", "/chart"],
  ["today", "Today", "/today"],
  ["history", "History", "/history"],
  ["activity", "Activity", "/activity"],
] as const;

const moreItems = [
  ["archive", "Archive", "/archive"],
  ["settings", "Settings", "/settings"],
] as const;

export function TopNav({ active }: { active: string }) {
  return (
    <nav aria-label="Primary navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--surface)]/95 p-2 backdrop-blur-xl md:static md:mb-10 md:rounded-2xl md:border md:border-[var(--line)] md:bg-[var(--surface)]/80 md:p-2">
      <div className="mx-auto flex max-w-7xl items-center gap-6">
        <Link href="/chart" className="hidden items-center gap-2 px-3 text-sm font-semibold tracking-tight text-[var(--ink)] md:flex">
          <span className="grid size-7 place-items-center rounded-lg bg-[var(--accent)] text-xs font-bold text-[var(--accent-foreground)]">H</span>
          <span>Harada</span>
        </Link>
        <div className="grid flex-1 grid-cols-4 gap-1 md:max-w-2xl">
        {items.map(([key, label, href]) => (
          <Link
            key={key}
            href={href}
            aria-current={active === key ? "page" : undefined}
            className={`relative flex min-h-11 items-center justify-center rounded-xl px-2 text-[15px] font-medium transition-[background-color,color,transform] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${active === key ? "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-[0_6px_20px_rgb(164_120_234_/_0.18)]" : "text-[var(--muted-ink)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"}`}
          >
            {label}
            <LinkPending />
           </Link>
         ))}
         <details className="group relative">
           <summary aria-current={moreItems.some(([key]) => active === key) ? "page" : undefined} className={`flex min-h-11 cursor-pointer list-none items-center justify-center rounded-xl px-2 text-[15px] font-medium transition-[background-color,color,transform] marker:hidden active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] [&::-webkit-details-marker]:hidden ${moreItems.some(([key]) => active === key) ? "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-[0_6px_20px_rgb(164_120_234_/_0.18)]" : "text-[var(--muted-ink)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"}`}>More</summary>
           <div className="absolute bottom-full right-0 mb-2 grid min-w-44 gap-1 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-2 shadow-[0_16px_48px_rgb(36_48_71_/_0.16)] group-open:animate-[flow-cell-in_var(--motion-fast)_var(--ease-out)] md:bottom-auto md:top-full md:mb-0 md:mt-2">
             {moreItems.map(([key, label, href]) => <Link key={key} href={href} aria-current={active === key ? "page" : undefined} className={`flex min-h-11 items-center rounded-xl px-4 text-[15px] font-medium focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent)] ${active === key ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "text-[var(--muted-ink)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"}`}>{label}<LinkPending /></Link>)}
           </div>
         </details>
        </div>
      </div>
    </nav>
  );
}
