"use client";

import { useLinkStatus } from "next/link";

export function LinkPending() {
  const { pending } = useLinkStatus();

  return <span aria-hidden="true" className={`pointer-events-none absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-current transition-opacity duration-[var(--motion-fast)] ${pending ? "opacity-60" : "opacity-0"}`} />;
}
