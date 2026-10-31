"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { archiveChart } from "@/app/chart-actions";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function FinishChart({ chartId }: { chartId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function finish() {
    startTransition(async () => {
      const result = await archiveChart({ chartId });
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.push("/chart");
      router.refresh();
    });
  }

  return (
    <>
      <button type="button" onClick={() => { setError(null); setOpen(true); }} className="min-h-11 rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--muted-ink)] transition hover:border-[var(--accent)] hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">
        Finish this chart
      </button>
      <Dialog open={open} onOpenChange={(nextOpen) => !isPending && setOpen(nextOpen)}>
        <DialogContent className="border-[var(--line)] bg-[var(--surface)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl">Finish this chart?</DialogTitle>
            <DialogDescription className="text-base leading-6">The chart will become read-only. Its history and check-offs will be kept, and you can start a new chart right away.</DialogDescription>
          </DialogHeader>
          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
          <DialogFooter className="border-[var(--line)] bg-[var(--paper)] sm:flex-row">
            <button type="button" onClick={() => setOpen(false)} disabled={isPending} className="min-h-11 rounded-full border border-[var(--line)] px-5 py-2 text-sm font-medium hover:border-[var(--ink)] disabled:opacity-50">Keep editing</button>
            <button type="button" onClick={finish} disabled={isPending} className="min-h-11 rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-medium text-[var(--accent-foreground)] hover:bg-[var(--aether-lilac)] disabled:opacity-50">{isPending ? "Finishing..." : "Finish chart"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
