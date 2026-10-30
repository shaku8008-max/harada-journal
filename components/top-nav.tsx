import Link from "next/link";

const items = [
  ["chart", "Chart", "/chart"],
  ["today", "Today", "/today"],
  ["history", "History", "/history"],
  ["settings", "Settings", "/settings"],
] as const;

export function TopNav({ active }: { active: (typeof items)[number][0] }) {
  return (
    <nav aria-label="Primary navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--surface)]/95 p-2 backdrop-blur-xl md:static md:mb-10 md:rounded-2xl md:border md:border-[var(--line)] md:bg-[var(--surface)]/80 md:p-2">
      <div className="mx-auto flex max-w-7xl items-center gap-6">
        <Link href="/chart" className="hidden items-center gap-2 px-3 text-sm font-semibold tracking-tight text-[var(--ink)] md:flex">
          <span className="grid size-7 place-items-center rounded-lg bg-[var(--accent)] text-xs font-bold text-[var(--accent-foreground)]">H</span>
          <span>Harada</span>
        </Link>
        <div className="grid flex-1 grid-cols-4 gap-1 md:max-w-xl">
        {items.map(([key, label, href]) => (
          <Link
            key={key}
            href={href}
            aria-current={active === key ? "page" : undefined}
            className={`flex min-h-11 items-center justify-center rounded-xl px-2 text-[15px] font-medium transition-[background-color,color,transform] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${active === key ? "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-[0_6px_20px_rgb(164_120_234_/_0.18)]" : "text-[var(--muted-ink)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"}`}
          >
            {label}
          </Link>
        ))}
        </div>
      </div>
    </nav>
  );
}
