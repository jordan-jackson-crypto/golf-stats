"use client";

import { cn } from "@/lib/utils";
import type { PenaltyType } from "@/lib/storage/types";

interface Props {
  active: boolean;
  value: PenaltyType | undefined;
  onToggle: () => void;
  onPickType: (v: PenaltyType) => void;
}

const TYPES: { v: PenaltyType; label: string }[] = [
  { v: "ob", label: "OB" },
  { v: "hazard", label: "Hazard" },
  { v: "lost", label: "Lost" },
];

export function PenaltyMenu({ active, value, onToggle, onPickType }: Props) {
  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex w-full items-center justify-center gap-1 rounded-md border py-1.5 text-[11px]",
          active ? "border-sg-loss bg-sg-loss/20 text-sg-loss" : "border-border bg-bg text-fg-muted active:bg-bg-muted",
        )}
      >
        Penalty {active && value && `· ${TYPES.find(t => t.v === value)?.label}`}
      </button>
      {active && (
        <div className="grid grid-cols-3 gap-1">
          {TYPES.map(({ v, label }) => (
            <button
              key={v}
              type="button"
              onClick={() => onPickType(v)}
              className={cn(
                "rounded-md border py-1 text-[10px]",
                value === v ? "border-fg bg-fg text-bg" : "border-border bg-bg text-fg-muted",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
