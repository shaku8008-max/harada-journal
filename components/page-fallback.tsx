type FallbackVariant = "chart" | "today" | "activity" | "list" | "archive" | "settings" | "login";

const skeleton = "animate-skeleton-pulse rounded-2xl bg-[var(--line)]/60";

function ListSkeleton({ count = 5 }: { count?: number }) {
  return <div className="grid gap-3">{Array.from({ length: count }, (_, index) => <div key={index} className={`${skeleton} h-24 w-full`} />)}</div>;
}

export function PageFallback({ label = "Loading your journal...", variant = "list" }: { label?: string; variant?: FallbackVariant }) {
  return (
    <div className="mx-auto w-full max-w-4xl" role="status" aria-busy="true">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">
         {variant === "chart" && <div className="grid grid-cols-3 gap-2 sm:gap-3">{Array.from({ length: 9 }, (_, index) => <div key={index} className={`${skeleton} ${index === 4 ? "min-h-48" : "min-h-36"} ${index === 0 ? "bg-[var(--position-1-background)]" : index === 1 ? "bg-[var(--position-2-background)]" : index === 2 ? "bg-[var(--position-3-background)]" : index === 3 ? "bg-[var(--position-4-background)]" : index === 5 ? "bg-[var(--position-5-background)]" : index === 6 ? "bg-[var(--position-6-background)]" : index === 7 ? "bg-[var(--position-7-background)]" : index === 8 ? "bg-[var(--position-8-background)]" : "bg-[var(--surface)]"}`} />)}</div>}
         {variant === "today" && <div className="grid gap-6"><div className={`${skeleton} h-72`} /><ListSkeleton count={4} /></div>}
         {variant === "activity" && <div className="grid gap-6"><div className="grid grid-cols-2 gap-3"><div className={`${skeleton} h-28`} /><div className={`${skeleton} h-28`} /></div><div className={`${skeleton} h-56`} /><div className={`${skeleton} h-5 w-52`} /></div>}
        {variant === "list" && <ListSkeleton />}
        {variant === "archive" && <ListSkeleton count={3} />}
        {variant === "settings" && <div className="grid gap-6 rounded-3xl border border-[var(--line)] bg-[var(--surface)]/70 p-6"><div className={`${skeleton} h-12`} /><div className={`${skeleton} h-12`} /><div className={`${skeleton} h-12`} /><div className={`${skeleton} h-12 w-36`} /></div>}
        {variant === "login" && <div className="mx-auto grid max-w-md gap-6 rounded-3xl border border-[var(--line)] bg-[var(--surface)]/70 p-8"><div className={`${skeleton} h-9 w-40`} /><div className={`${skeleton} h-12 w-4/5`} /><div className={`${skeleton} h-20`} /><div className={`${skeleton} h-12`} /></div>}
      </div>
    </div>
  );
}
