export function PageFallback({ label = "Loading your journal..." }: { label?: string }) {
  return <div className="mx-auto flex min-h-48 max-w-2xl items-center justify-center rounded-3xl border border-[var(--line)] bg-[var(--surface)]/60 p-8 text-center text-[15px] text-[var(--muted-ink)]">{label}</div>;
}
