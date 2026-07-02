"use client";

import { cn } from "@/lib/utils";

interface Props {
  hole: number;
  value: 3 | 4 | 5 | null;
  onPick: (par: 3 | 4 | 5) => void;
}

export function ParPicker({ hole, value, onPick }: Props) {
  return (
    <div className="flex h-full flex-col justify-center px-4 pb-safe">
      <div className="mb-1 text-center text-xs uppercase tracking-widest text-fg-faint">Hole {hole}</div>
      <h2 className="mb-6 text-center text-2xl font-semibold">What par is this hole?</h2>
      <div className="space-y-3">
        {[3, 4, 5].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPick(p as 3 | 4 | 5)}
            className={cn(
              "num flex w-full items-center justify-center rounded-xl border-2 py-6 text-3xl font-semibold",
              value === p
                ? "border-fg bg-fg text-bg"
                : "border-border bg-bg-raised text-fg active:bg-bg-muted",
            )}
          >
            Par {p}
          </button>
        ))}
      </div>
    </div>
  );
}
