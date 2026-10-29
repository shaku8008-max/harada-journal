"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";

import { archiveAction, archiveSubGoal, saveAction, saveChart, saveSubGoal } from "@/app/chart-actions";
import type { ChartData } from "@/lib/charts";
import type { GridCell } from "@/lib/grid";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

type CellEditorProps = {
  data: ChartData;
  cell: GridCell | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function useIsMobile() {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mediaQuery = window.matchMedia("(max-width: 767px)");
      mediaQuery.addEventListener("change", onStoreChange);
      return () => mediaQuery.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia("(max-width: 767px)").matches,
    () => false,
  );
}

function cellHeading(cell: GridCell) {
  if (cell.kind === "main") return "Main goal";
  if (cell.kind === "sub_goal") return `Sub-goal ${cell.subGoalPosition}`;
  return `Action ${cell.position} of sub-goal ${cell.subGoalPosition}`;
}

export function CellEditor({ data, cell, open, onOpenChange }: CellEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(() => cell?.title ?? "");
  const [why, setWhy] = useState(() => cell?.chart?.why ?? "");
  const [targetDate, setTargetDate] = useState(() => cell?.chart?.target_date ?? "");
  const [kind, setKind] = useState<"daily" | "weekly" | "one_off">(() => cell?.action?.kind === "weekly" || cell?.action?.kind === "one_off" ? cell.action.kind : "daily");
  const [weeklyTarget, setWeeklyTarget] = useState(() => cell?.action?.weekly_target ?? 3);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isMobile = useIsMobile();

  if (!cell) return null;
  const activeCell = cell;

  const subGoal = activeCell.subGoal ?? data.subGoals.find((item) => item.position === activeCell.subGoalPosition);
  const isCreate = !activeCell.title;

  function close() {
    if (!isPending) onOpenChange(false);
  }

  function save() {
    startTransition(async () => {
      const result = activeCell.kind === "main"
        ? await saveChart({ chartId: data.chart.id, title, why, targetDate })
        : activeCell.kind === "sub_goal"
          ? await saveSubGoal({ chartId: data.chart.id, subGoalId: activeCell.subGoal?.id, position: activeCell.subGoalPosition ?? activeCell.position, title })
          : subGoal
            ? await saveAction({ chartId: data.chart.id, subGoalId: subGoal.id, actionId: activeCell.action?.id, position: activeCell.position, title, kind, weeklyTarget })
            : { error: "Save the sub-goal before adding an action." };
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
      onOpenChange(false);
    });
  }

  function archive() {
    if (activeCell.kind === "main" || (!activeCell.subGoal?.id && !activeCell.action?.id)) return;
    startTransition(async () => {
      const result = activeCell.kind === "sub_goal"
        ? await archiveSubGoal({ chartId: data.chart.id, subGoalId: activeCell.subGoal!.id })
        : await archiveAction({ chartId: data.chart.id, actionId: activeCell.action!.id });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
      onOpenChange(false);
    });
  }

  const form = (
    <div className="grid max-h-[70dvh] gap-5 overflow-y-auto px-4 py-1 sm:px-0">
      <div className="grid gap-2">
        <label htmlFor="cell-title" className="text-sm font-medium">Title</label>
        <input id="cell-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} autoFocus className="min-h-12 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20" />
      </div>
      {activeCell.kind === "main" && <>
        <div className="grid gap-2"><label htmlFor="cell-why" className="text-sm font-medium">Why it matters <span className="font-normal text-[var(--muted-ink)]">Optional</span></label><textarea id="cell-why" value={why} onChange={(event) => setWhy(event.target.value)} maxLength={2000} rows={4} className="rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20" /></div>
        <div className="grid gap-2 sm:max-w-xs"><label htmlFor="cell-target-date" className="text-sm font-medium">Target date <span className="font-normal text-[var(--muted-ink)]">Optional</span></label><input id="cell-target-date" type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} className="min-h-12 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20" /></div>
      </>}
      {activeCell.kind === "action" && <>
        <div className="grid gap-2"><label htmlFor="cell-kind" className="text-sm font-medium">Action rhythm</label><select id="cell-kind" value={kind} onChange={(event) => setKind(event.target.value as typeof kind)} className="min-h-12 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="one_off">One-off</option></select></div>
        {kind === "weekly" && <div className="grid gap-2 sm:max-w-xs"><label htmlFor="cell-weekly-target" className="text-sm font-medium">Times per week</label><input id="cell-weekly-target" type="number" min={1} max={7} value={weeklyTarget} onChange={(event) => setWeeklyTarget(Number(event.target.value))} className="min-h-12 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-4 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20" /></div>}
      </>}
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
    </div>
  );

  const actions = <>
    {activeCell.kind !== "main" && !isCreate && <button type="button" onClick={archive} disabled={isPending} className="min-h-11 rounded-full px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50">Archive</button>}
    <div className="flex gap-2 sm:ml-auto"><button type="button" onClick={close} className="min-h-11 rounded-full border border-[var(--line)] px-5 py-2 text-sm font-medium hover:border-[var(--ink)]">Cancel</button><button type="button" onClick={save} disabled={isPending || !title.trim()} className="min-h-11 rounded-full bg-[var(--ink)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--accent)] disabled:opacity-50">{isPending ? "Saving..." : isCreate ? "Create" : "Save changes"}</button></div>
  </>;

  return isMobile ? (
    <Drawer open={open} onOpenChange={onOpenChange} swipeDirection="down"><DrawerContent className="max-h-[92dvh] border-[var(--line)] bg-[var(--surface)]"><DrawerHeader className="text-left"><DrawerTitle className="text-2xl">{isCreate ? `Add ${cellHeading(activeCell).toLowerCase()}` : `Edit ${cellHeading(activeCell).toLowerCase()}`}</DrawerTitle><DrawerDescription>Keep this part concrete and easy to return to.</DrawerDescription></DrawerHeader>{form}<DrawerFooter className="border-[var(--line)] bg-[var(--paper)]">{actions}</DrawerFooter></DrawerContent></Drawer>
  ) : (
    <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="border-[var(--line)] bg-[var(--surface)] sm:max-w-lg"><DialogHeader><DialogTitle className="text-2xl">{isCreate ? `Add ${cellHeading(activeCell).toLowerCase()}` : `Edit ${cellHeading(activeCell).toLowerCase()}`}</DialogTitle><DialogDescription>Keep this part concrete and easy to return to.</DialogDescription></DialogHeader>{form}<DialogFooter className="border-[var(--line)] bg-[var(--paper)]">{actions}</DialogFooter></DialogContent></Dialog>
  );
}
