"use client";

import { useReducedMotion } from "framer-motion";
import { useState, type CSSProperties, type ReactNode } from "react";

import { CanvasRevealEffect } from "@/components/ui/canvas-reveal-effect";
import { cn } from "@/lib/utils";

type CanvasRevealCardProps = {
  children: ReactNode;
  colors: [number, number, number][];
  className?: string;
  style?: CSSProperties;
};

export function CanvasRevealCard({ children, colors, className, style }: CanvasRevealCardProps) {
  const [active, setActive] = useState(false);
  const reducedMotion = useReducedMotion();

  return (
    <div
      style={style}
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
      onFocusCapture={() => setActive(true)}
      onBlurCapture={() => setActive(false)}
      onPointerDown={() => setActive(true)}
      className={cn("relative isolate overflow-hidden rounded-[inherit]", className)}
    >
      {active && !reducedMotion && <CanvasRevealEffect colors={colors} />}
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
