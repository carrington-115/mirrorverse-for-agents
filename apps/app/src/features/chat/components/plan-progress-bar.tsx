"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PlanProgressStep {
  step: number;
  title: string;
  completed: boolean;
}

interface PlanProgressBarProps {
  steps: PlanProgressStep[];
}

export function PlanProgressBar({ steps }: PlanProgressBarProps) {
  if (steps.length === 0) return null;
  if (steps.every((s) => s.completed)) return null;

  return (
    <div className="mb-2 space-y-2 px-4 py-3 rounded-xl bg-muted/50">
      {steps.map((step) => (
        <div key={step.step} className="gap-2.5 flex items-center">
          {step.completed ? (
            <span className="size-4 flex shrink-0 items-center justify-center rounded-full bg-primary">
              <Check className="size-2.5 text-primary-foreground" />
            </span>
          ) : (
            <span className="size-4 shrink-0 rounded-full border-2 border-muted-foreground/30" />
          )}
          <span
            className={cn(
              "text-xs leading-snug line-clamp-1",
              step.completed ? "text-muted-foreground line-through" : "text-foreground/75",
            )}
          >
            {step.title}
          </span>
        </div>
      ))}
    </div>
  );
}
