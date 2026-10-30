import Link from "next/link";

const items = [
  ["chart", "Chart", "/chart"],
  ["today", "Today", "/today"],
  ["history", "History", "/history"],
  ["settings", "Settings", "/settings"],
] as const;

export function TopNav({ active }: { active: (typeof items)[number][0] }) {
  return (
    <nav aria-label="Primary navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--surface)]/95 p-2 backdrop-blur-sm md:static md:mb-8 md:border md:border-[var(--line)] md:bg-[var(--surface)] md:p-2">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1 md:max-w-none">
        {items.map(([key, label, href]) => (
          <Link
            key={key}
            href={href}
            aria-current={active === key ? "page" : undefined}
            className={`flex min-h-11 items-center justify-center rounded-xl px-2 text-[15px] font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${active === key ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "text-[var(--muted-ink)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"}`}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
