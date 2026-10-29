"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { saveAction, saveChart, saveSubGoal } from "@/app/chart-actions";
import { positionHints, positionStyle } from "@/lib/position-hints";

type DraftSubGoal = { id?: string; position: number; title: string };
type DraftAction = {
  id?: string;
  position: number;
  title: string;
  kind: "daily" | "weekly" | "one_off";
  weeklyTarget: number;
};

const positions = Array.from({ length: 8 }, (_, index) => index + 1);

function emptySubGoals(): DraftSubGoal[] {
  return positions.map((position) => ({ position, title: "" }));
}

function emptyActions(): DraftAction[][] {
  return positions.map(() =>
    positions.map((position) => ({
      position,
      title: "",
      kind: "daily",
      weeklyTarget: 3,
    })),
  );
}

export function ChartWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [chartId, setChartId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [why, setWhy] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [subGoals, setSubGoals] = useState(emptySubGoals);
  const [actions, setActions] = useState(emptyActions);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function saveMainGoal() {
    startTransition(async () => {
      const result = await saveChart({ chartId: chartId ?? undefined, title, why, targetDate });
      if (result.error) {
        setError(result.error);
        return;
      }
      setChartId(result.id ?? chartId);
      setError(null);
      setStep(2);
    });
  }

  function saveOneSubGoal(index: number) {
    const subGoal = subGoals[index];
    if (!chartId || !subGoal.title.trim()) return;
    startTransition(async () => {
      const result = await saveSubGoal({
        chartId,
        subGoalId: subGoal.id,
        position: subGoal.position,
        title: subGoal.title,
      });
      if (result.error) setError(result.error);
      if (result.id) {
        setSubGoals((current) =>
          current.map((item, itemIndex) =>
            itemIndex === index ? { ...item, id: result.id } : item,
          ),
        );
      }
    });
  }

  function saveOneAction(subGoalIndex: number, actionIndex: number) {
    const subGoal = subGoals[subGoalIndex];
    const action = actions[subGoalIndex][actionIndex];
    if (!chartId || !subGoal.id || !action.title.trim()) return;
    startTransition(async () => {
      const result = await saveAction({
        actionId: action.id,
        chartId,
        subGoalId: subGoal.id!,
        position: action.position,
        title: action.title,
        kind: action.kind,
        weeklyTarget: action.weeklyTarget,
      });
      if (result.error) setError(result.error);
      if (result.id) {
        setActions((current) =>
          current.map((group, groupIndex) =>
            groupIndex === subGoalIndex
              ? group.map((item, itemIndex) =>
                  itemIndex === actionIndex ? { ...item, id: result.id } : item,
                )
              : group,
          ),
        );
      }
    });
  }

  function continueToActions() {
    if (!chartId) return;
    startTransition(async () => {
      const filled = subGoals.filter((subGoal) => subGoal.title.trim());
      const saved = await Promise.all(filled.map((subGoal) => saveSubGoal({
        chartId,
        subGoalId: subGoal.id,
        position: subGoal.position,
        title: subGoal.title,
      })));
      const failed = saved.find((result) => result.error);
      if (failed?.error) {
        setError(failed.error);
        return;
      }
      setSubGoals((current) => current.map((subGoal) => {
        const resultIndex = filled.findIndex((item) => item.position === subGoal.position);
        const result = resultIndex >= 0 ? saved[resultIndex] : undefined;
        return result?.id ? { ...subGoal, id: result.id } : subGoal;
      }));
      setError(null);
      setStep(3);
    });
  }

  function finishWizard() {
    if (!chartId) return;
    startTransition(async () => {
      const pendingSaves = subGoals.flatMap((subGoal, subGoalIndex) => {
        if (!subGoal.id || !subGoal.title.trim()) return [];
        return actions[subGoalIndex]
          .filter((action) => action.title.trim())
          .map((action) => saveAction({
            actionId: action.id,
            chartId,
            subGoalId: subGoal.id!,
            position: action.position,
            title: action.title,
            kind: action.kind,
            weeklyTarget: action.weeklyTarget,
          }));
      });
      const results = await Promise.all(pendingSaves);
      const failed = results.find((result) => result.error);
      if (failed?.error) {
        setError(failed.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <section className="mx-auto max-w-4xl">
      <div className="mb-8 max-w-2xl">
        <p className="text-sm font-medium text-[var(--accent)]">Start with one meaningful window</p>
        <h1 className="mt-3 text-4xl leading-tight tracking-tight sm:text-5xl">
          Make room for the goal you want to grow.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-[var(--muted-ink)]">
          The Open Window method turns one goal into eight directions, then eight small actions for each direction. You can leave any later cell empty and return to it from the grid.
        </p>
      </div>

      <div className="mb-8 flex items-center gap-2 text-sm text-[var(--muted-ink)]" aria-label="Chart setup progress">
        {["Main goal", "Sub-goals", "Actions"].map((label, index) => (
          <div key={label} className="flex items-center gap-2">
            <span className={`grid size-8 place-items-center rounded-full border ${step === index + 1 ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--line)] bg-white"}`}>
              {index + 1}
            </span>
            <span className="hidden sm:inline">{label}</span>
            {index < 2 && <span className="mx-1 h-px w-5 bg-[var(--line)] sm:w-12" />}
          </div>
        ))}
      </div>

      <div className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_18px_60px_rgba(63,52,40,0.06)] sm:p-8">
        {step === 1 && (
          <div>
            <h2 className="text-3xl">Name your main goal</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted-ink)]">This is the centre of your window. The title is the one thing needed to begin.</p>
            <div className="mt-7 grid gap-5">
              <label className="grid gap-2 text-sm font-medium">
                Main goal <span className="text-[var(--accent)]">Required</span>
                <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} autoFocus className="min-h-12 rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 text-base font-normal outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Why does this matter?
                <textarea value={why} onChange={(event) => setWhy(event.target.value)} maxLength={2000} rows={4} className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-base font-normal outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20" />
              </label>
              <label className="grid gap-2 text-sm font-medium sm:max-w-xs">
                Target date <span className="font-normal text-[var(--muted-ink)]">Optional</span>
                <input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} className="min-h-12 rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 text-base font-normal outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20" />
              </label>
            </div>
            <div className="mt-8 flex justify-end">
              <button type="button" disabled={!title.trim() || isPending} onClick={saveMainGoal} className="min-h-12 rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-medium text-white transition hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">
                {isPending ? "Saving..." : "Continue to sub-goals"}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-3xl">Choose eight directions</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-ink)]">Think broadly: health, people, skills, places, resources, or anything else that helps the main goal. Empty directions can be filled from the grid later.</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {subGoals.map((subGoal, index) => (
                <label key={subGoal.position} style={positionStyle(subGoal.position)} className="grid gap-2 text-sm font-medium text-[var(--position-text)]">
                  <span>Direction {subGoal.position}</span>
                  <input value={subGoal.title} onChange={(event) => setSubGoals((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item))} onBlur={() => saveOneSubGoal(index)} maxLength={160} placeholder={`e.g. ${positionHints[subGoal.position as keyof typeof positionHints]}`} className="min-h-12 rounded-2xl border border-[var(--position-accent)] bg-[var(--position-background)] px-4 text-base font-normal outline-none placeholder:text-[var(--position-text)]/70 focus:border-[var(--position-accent)] focus:ring-2 focus:ring-[var(--position-accent)]/20" />
                </label>
              ))}
            </div>
            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button type="button" onClick={() => setStep(1)} className="min-h-12 rounded-full px-5 py-3 text-sm font-medium text-[var(--muted-ink)] hover:bg-[var(--paper)]">Back</button>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={() => setStep(3)} className="min-h-12 rounded-full border border-[var(--line)] px-5 py-3 text-sm font-medium hover:border-[var(--ink)]">Skip for now</button>
                <button type="button" onClick={continueToActions} disabled={isPending} className="min-h-12 rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-medium text-white hover:bg-[var(--accent)] disabled:opacity-50">{isPending ? "Saving..." : "Continue to actions"}</button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-3xl">Make the next moves visible</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-ink)]">Add up to eight actions under each direction. Daily, weekly, and one-off actions all have a place here. You can keep this light and add more later.</p>
            <div className="mt-7 grid gap-6">
              {subGoals.map((subGoal, subGoalIndex) => (
                <fieldset key={subGoal.position} disabled={!subGoal.id} className="rounded-2xl border border-[var(--line)] p-4 disabled:opacity-50 sm:p-5">
                  <legend className="px-2 text-base font-medium">{subGoal.title || `Direction ${subGoal.position}`}</legend>
                  {!subGoal.id && <p className="px-2 pb-2 text-xs text-[var(--muted-ink)]">Save a direction first to add its actions.</p>}
                  <div className="grid gap-3">
                    {actions[subGoalIndex].map((action, actionIndex) => (
                      <div key={action.position} className="grid gap-2 sm:grid-cols-[1fr_8rem_5rem]">
                        <label className="sr-only" htmlFor={`action-${subGoal.position}-${action.position}`}>Action {action.position} of {subGoal.title || `direction ${subGoal.position}`}</label>
                        <input id={`action-${subGoal.position}-${action.position}`} value={action.title} onChange={(event) => setActions((current) => current.map((group, groupIndex) => groupIndex === subGoalIndex ? group.map((item, itemIndex) => itemIndex === actionIndex ? { ...item, title: event.target.value } : item) : group))} onBlur={() => saveOneAction(subGoalIndex, actionIndex)} maxLength={160} placeholder={`Action ${action.position}`} className="min-h-11 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20" />
                        <label className="sr-only" htmlFor={`kind-${subGoal.position}-${action.position}`}>Kind for action {action.position}</label>
                        <select id={`kind-${subGoal.position}-${action.position}`} value={action.kind} onChange={(event) => { const kind = event.target.value as DraftAction["kind"]; setActions((current) => current.map((group, groupIndex) => groupIndex === subGoalIndex ? group.map((item, itemIndex) => itemIndex === actionIndex ? { ...item, kind } : item) : group)); }} onBlur={() => saveOneAction(subGoalIndex, actionIndex)} className="min-h-11 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20">
                          <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="one_off">One-off</option>
                        </select>
                        {action.kind === "weekly" ? <label className="flex min-h-11 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 text-sm"><span className="sr-only">Weekly target</span><input type="number" min={1} max={7} value={action.weeklyTarget} onChange={(event) => setActions((current) => current.map((group, groupIndex) => groupIndex === subGoalIndex ? group.map((item, itemIndex) => itemIndex === actionIndex ? { ...item, weeklyTarget: Number(event.target.value) } : item) : group))} onBlur={() => saveOneAction(subGoalIndex, actionIndex)} className="w-full bg-transparent outline-none" /><span className="text-xs text-[var(--muted-ink)]">/ wk</span></label> : <span className="hidden sm:block" />}
                      </div>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button type="button" onClick={() => setStep(2)} className="min-h-12 rounded-full px-5 py-3 text-sm font-medium text-[var(--muted-ink)] hover:bg-[var(--paper)]">Back</button>
              <button type="button" onClick={finishWizard} disabled={isPending} className="min-h-12 rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-medium text-white hover:bg-[var(--accent)] disabled:opacity-50">Open my chart</button>
            </div>
          </div>
        )}
        {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      </div>
    </section>
  );
}
