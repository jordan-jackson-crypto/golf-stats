"use client";

import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowUp, ArrowRight } from "lucide-react";
import type { MissDirection } from "@/lib/storage/types";

interface Props {
  value: MissDirection | undefined;
  onChange: (v: MissDirection) => void;
  /** Suppress the "center/straight" option when it's not meaningful (e.g. penalty). */
  hideCenter?: boolean;
}

export function DirectionRow({ value, onChange, hideCenter }: Props) {
  const options: { v: MissDirection; label: string; icon: React.ReactNode }[] = [
    { v: "left", label: "Left", icon: <ArrowLeft size={14} /> },
    ...(hideCenter ? [] : [{ v: "center" as const, label: "Straight", icon: <ArrowUp size={14} /> }]),
    { v: "right", label: "Right", icon: <ArrowRight size={14} /> },
  ];
  return (
    <div className={cn("grid gap-1.5", hideCenter ? "grid-cols-2" : "grid-cols-3")}>
      {options.map(({ v, label, icon }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cn(
            "flex items-center justify-center gap-1 rounded-md border py-2 text-xs",
            value === v
              ? "border-fg bg-fg text-bg"
              : "border-border bg-bg text-fg-muted active:bg-bg-muted",
          )}
        >
          {icon} {label}
        </button>
      ))}
    </div>
  );
}
