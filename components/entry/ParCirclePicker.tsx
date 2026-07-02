"use client";

import { cn } from "@/lib/utils";

interface Props {
  value: 3 | 4 | 5 | null;
  onPick: (par: 3 | 4 | 5) => void;
}

export function ParCirclePicker({ value, onPick }: Props) {
  return (
    <div className="flex items-center justify-center gap-4">
      {[3, 4, 5].map((p) => {
        const active = value === p;
        return (
          <button
            key={p}
            type="button"
            onClick={() => onPick(p as 3 | 4 | 5)}
            className={cn(
              "num flex h-16 w-16 items-center justify-center rounded-full text-2xl font-semibold transition-colors",
              active
                ? "bg-primary text-white shadow-lg shadow-primary/30"
                : "border border-border bg-bg-raised text-fg-muted active:bg-bg-muted",
            )}
            aria-label={`Par ${p}`}
          >
            {p}
          </button>
        );
      })}
    </div>
  );
}
