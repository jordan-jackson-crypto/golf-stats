"use client";

import { cn } from "@/lib/utils";
import type { Lie } from "@/lib/sg/types";

const LIES: { lie: Lie; label: string }[] = [
  { lie: "tee", label: "Tee" },
  { lie: "fairway", label: "Fwy" },
  { lie: "rough", label: "Rgh" },
  { lie: "sand", label: "Snd" },
  { lie: "recovery", label: "Rec" },
  { lie: "green", label: "Grn" },
];

interface Props {
  value: Lie | null;
  onChange: (lie: Lie) => void;
}

export function CompactLieRow({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-6 gap-1">
      {LIES.map(({ lie, label }) => {
        const active = value === lie;
        return (
          <button
            key={lie}
            type="button"
            onClick={() => onChange(lie)}
            className={cn(
              "rounded-md border py-2.5 text-xs font-medium transition-colors",
              active
                ? "border-fg bg-fg text-bg"
                : "border-border bg-bg-raised text-fg-muted active:bg-bg-muted",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
