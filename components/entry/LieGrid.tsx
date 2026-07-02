"use client";

import { cn } from "@/lib/utils";
import type { Lie } from "@/lib/sg/types";

const LIES: { lie: Lie; label: string; short: string }[] = [
  { lie: "tee", label: "Tee", short: "T" },
  { lie: "fairway", label: "Fairway", short: "F" },
  { lie: "rough", label: "Rough", short: "R" },
  { lie: "sand", label: "Sand", short: "S" },
  { lie: "recovery", label: "Recovery", short: "X" },
  { lie: "green", label: "Green", short: "G" },
];

interface Props {
  value: Lie | null;
  onChange: (lie: Lie) => void;
  /** Optional subset of lies to show. */
  allow?: Lie[];
  /** Compact = smaller buttons for the "start lie" edit view. */
  compact?: boolean;
}

export function LieGrid({ value, onChange, allow, compact }: Props) {
  const items = allow ? LIES.filter((l) => allow.includes(l.lie)) : LIES;
  return (
    <div className={cn("grid grid-cols-3 gap-2", compact && "gap-1.5")}>
      {items.map(({ lie, label }) => {
        const active = value === lie;
        return (
          <button
            key={lie}
            type="button"
            onClick={() => onChange(lie)}
            className={cn(
              "rounded-lg border font-medium transition-colors",
              compact ? "py-2 text-xs" : "py-4 text-sm",
              active
                ? "border-fg bg-fg text-bg"
                : "border-border bg-bg-raised text-fg-muted hover:border-border-strong hover:text-fg",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
