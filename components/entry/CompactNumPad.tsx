"use client";

import { cn } from "@/lib/utils";
import { Delete } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  submitDisabled?: boolean;
  submitLabel?: string;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * Compact 3-col keypad with a tall Save key spanning two rows on the right.
 * Fits the entire keypad + save into ~4 rows of vertical space.
 */
export function CompactNumPad({ value, onChange, onSubmit, submitDisabled, submitLabel = "Save" }: Props) {
  const tap = (k: string) => {
    if (k === "back") return onChange(value.slice(0, -1));
    if (value.length >= 4) return;
    if (value === "0") return onChange(k);
    onChange(value + k);
  };

  return (
    <div className="grid grid-cols-4 grid-rows-4 gap-1.5">
      {KEYS.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => tap(k)}
          className="rounded-md border border-border bg-bg-raised py-3 text-xl font-medium tabular-nums text-fg active:bg-bg-muted"
        >
          {k}
        </button>
      ))}
      <button
        type="button"
        onClick={() => tap("back")}
        className="rounded-md border border-border bg-bg-raised py-3 text-fg-muted active:bg-bg-muted"
        aria-label="Backspace"
      >
        <Delete size={18} className="mx-auto" />
      </button>
      <button
        type="button"
        onClick={() => tap("0")}
        className="rounded-md border border-border bg-bg-raised py-3 text-xl font-medium tabular-nums text-fg active:bg-bg-muted"
      >
        0
      </button>
      <button
        type="button"
        disabled
        className="rounded-md bg-transparent"
        aria-hidden
      />
      {/* Save spans rows 1-4 in col 4 */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={submitDisabled}
        className={cn(
          "col-start-4 row-start-1 row-end-5 rounded-md text-sm font-semibold uppercase tracking-wide",
          submitDisabled ? "bg-bg-muted text-fg-faint" : "bg-fg text-bg active:bg-fg-muted",
        )}
      >
        {submitLabel}
      </button>
    </div>
  );
}
