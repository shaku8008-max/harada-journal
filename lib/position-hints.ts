export const positionHints = {
  1: "Financial goals",
  2: "Career & work",
  3: "Fitness & health",
  4: "Mindset & wellbeing",
  5: "Relationships",
  6: "Learning & skills",
  7: "Fun & hobbies",
  8: "Home & life admin",
} as const;

export const actionHint = "Walk 30 minutes";

export function positionStyle(position: number): CSSProperties {
  return {
    "--position-background": `var(--position-${position}-background)`,
    "--position-accent": `var(--position-${position}-accent)`,
    "--position-text": `var(--position-${position}-text)`,
    "--position-fill": `var(--position-${position}-fill)`,
  } as CSSProperties;
}
import type { CSSProperties } from "react";
