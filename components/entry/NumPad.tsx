"use client";

import { cn } from "@/lib/utils";
import { Delete } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  /** Label shown on submit key. Default "Next". */
  submitLabel?: string;
  /** When true, the submit key is disabled. */
  submitDisabled?: boolean;
  /** Unit shown under the value (e.g. "yards" or "feet"). */
  unit?: string;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export function NumPad({ value, onChange, onSubmit, submitLabel = "Next", submitDisabled, unit }: Props) {
  const tap = (k: string) => {
    if (k === "back") {
      onChange(value.slice(0, -1));
      return;
    }
    // Cap at 4 digits (max 9999)
    if (value.length >= 4) return;
    // No leading zero
    if (value === "0") {
      onChange(k);
      return;
    }
    onChange(value + k);
  };

  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-border bg-bg-muted px-4 py-3">
        <div className="flex items-baseline justify-between">
          <div className="num text-4xl font-medium tabular-nums text-fg">
            {value || <span className="text-fg-faint">—</span>}
          </div>
          {unit && <div className="text-xs uppercase tracking-wide text-fg-faint">{unit}</div>}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {KEYS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => tap(k)}
            className="rounded-lg border border-border bg-bg-raised py-4 text-xl font-medium tabular-nums text-fg active:bg-bg-muted"
          >
            {k}
          </button>
        ))}
        <button
          type="button"
          onClick={() => tap("back")}
          className="rounded-lg border border-border bg-bg-raised py-4 text-fg-muted active:bg-bg-muted"
          aria-label="Backspace"
        >
          <Delete size={18} className="mx-auto" />
        </button>
        <button
          type="button"
          onClick={() => tap("0")}
          className="rounded-lg border border-border bg-bg-raised py-4 text-xl font-medium tabular-nums text-fg active:bg-bg-muted"
        >
          0
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitDisabled}
          className={cn(
            "rounded-lg py-4 text-sm font-semibold uppercase tracking-wide transition-colors",
            submitDisabled
              ? "bg-bg-muted text-fg-faint"
              : "bg-fg text-bg active:bg-fg-muted",
          )}
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
