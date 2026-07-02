"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}

export function ScoreStepper({ value, onChange, min = 1, max = 15 }: Props) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        type="button"
        onClick={dec}
        disabled={value <= min}
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full border transition-colors",
          value <= min
            ? "border-border text-fg-faint"
            : "border-border bg-bg-raised text-fg active:bg-bg-muted",
        )}
        aria-label="Decrease"
      >
        <Minus size={18} />
      </button>
      <div className="num flex h-20 w-24 items-center justify-center rounded-2xl border border-border bg-bg-raised text-4xl font-semibold">
        {value}
      </div>
      <button
        type="button"
        onClick={inc}
        disabled={value >= max}
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full border transition-colors",
          value >= max
            ? "border-border text-fg-faint"
            : "border-border bg-bg-raised text-fg active:bg-bg-muted",
        )}
        aria-label="Increase"
      >
        <Plus size={18} />
      </button>
    </div>
  );
}
