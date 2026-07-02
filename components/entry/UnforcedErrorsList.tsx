"use client";

import { cn } from "@/lib/utils";
import type { UnforcedErrors } from "@/lib/storage/types";
import { Check } from "lucide-react";

interface Props {
  value: UnforcedErrors;
  par: number;
  onChange: (next: UnforcedErrors) => void;
}

const ITEMS: { key: keyof UnforcedErrors; label: string; showForPar?: number[] }[] = [
  { key: "sixPlusOnPar5", label: "6+ on a par 5?", showForPar: [5] },
  { key: "doubleOrWorse", label: "Double or worse?" },
  { key: "threePutt", label: "Three-putt?" },
  { key: "pwOrLessBogey", label: "PW-or-less bogey?" },
  { key: "shortSided", label: "Short-sided leave?" },
  { key: "penaltyObWater", label: "Penalty / OB / Water?" },
  { key: "mentalMistake", label: "Mental mistake?" },
];

export function UnforcedErrorsList({ value, par, onChange }: Props) {
  const items = ITEMS.filter((i) => !i.showForPar || i.showForPar.includes(par));
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map(({ key, label }) => {
        const on = !!value[key];
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange({ ...value, [key]: !on })}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-2 py-2 text-left text-xs",
              on
                ? "border-sg-loss/60 bg-sg-loss/10 text-fg"
                : "border-border bg-bg-raised text-fg-muted",
            )}
          >
            <span
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                on ? "border-sg-loss bg-sg-loss text-white" : "border-border",
              )}
            >
              {on && <Check size={10} strokeWidth={3} />}
            </span>
            <span className="leading-tight">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
