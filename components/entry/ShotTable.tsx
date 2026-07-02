"use client";

import { cn } from "@/lib/utils";
import type { Lie } from "@/lib/sg/types";
import type { StoredShot } from "@/lib/storage/types";
import { Flag } from "lucide-react";

interface Props {
  teeYardage: number;
  onTeeYardageChange: (n: number) => void;
  shots: StoredShot[]; // sorted by shotNumber, length = score
  onRowLieChange: (rowIndex: number, lie: Lie) => void;
  onRowDistanceChange: (rowIndex: number, distance: number) => void;
}

const NON_TEE_LIES: { lie: Lie; label: string }[] = [
  { lie: "fairway", label: "Fairway" },
  { lie: "rough", label: "Rough" },
  { lie: "sand", label: "Sand" },
  { lie: "recovery", label: "Recovery" },
  { lie: "green", label: "Green" },
];

/**
 * Position-based shot table. For a score of N:
 *   - "Tee to hole" input above (shot 1's start distance)
 *   - Rows 1..N-1: user picks the LIE the shot ended in + distance to hole
 *   - Row N: fixed "Holed" (no editing needed)
 *
 * Each row K represents shot K's END position. shot K+1 starts where K ended.
 */
export function ShotTable({
  teeYardage, onTeeYardageChange, shots, onRowLieChange, onRowDistanceChange,
}: Props) {
  const score = shots.length;

  return (
    <div className="space-y-2">
      {/* Tee yardage header */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-bg-raised px-3 py-2.5">
        <div className="text-xs">
          <div className="text-fg-faint">Tee to hole</div>
          <div className="text-fg-muted">Shot 1 start</div>
        </div>
        <div className="flex items-center gap-1.5">
          <NumberField
            value={teeYardage || ""}
            onChange={(n) => onTeeYardageChange(n)}
            placeholder="yd"
            className="w-20 text-right"
          />
          <span className="text-xs text-fg-faint">yd</span>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[24px_1fr_100px] gap-2 px-1 text-[10px] uppercase tracking-wide text-fg-faint">
        <div>#</div>
        <div>Shot ended in</div>
        <div className="text-right">Distance to hole</div>
      </div>

      {/* Rows */}
      {shots.map((shot, i) => {
        const isLast = i === score - 1;
        const isHoled = shot.holed;
        const rowUnit = shot.endLie === "green" ? "ft" : "yd";
        return (
          <div
            key={shot.id}
            className="grid grid-cols-[24px_1fr_100px] items-center gap-2 rounded-lg border border-border bg-bg-raised px-2 py-2"
          >
            <div className="num text-center text-sm text-fg-muted">{i + 1}</div>

            {isLast || isHoled ? (
              <div className="flex items-center gap-1.5 rounded-md bg-sg-gain/15 px-2 py-1.5 text-sm text-sg-gain">
                <Flag size={12} /> Holed
              </div>
            ) : (
              <LieSelect value={shot.endLie} onChange={(l) => onRowLieChange(i, l)} />
            )}

            {isLast || isHoled ? (
              <div className="text-right text-xs text-fg-faint">—</div>
            ) : (
              <div className="flex items-center justify-end gap-1">
                <NumberField
                  value={shot.endDistance || ""}
                  onChange={(n) => onRowDistanceChange(i, n)}
                  placeholder={rowUnit}
                  className="w-16 text-right"
                />
                <span className="w-4 text-[11px] text-fg-faint">{rowUnit}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// --- helpers ---

function NumberField({
  value, onChange, placeholder, className,
}: {
  value: number | string;
  onChange: (n: number) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={value}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "");
        onChange(digits ? parseInt(digits, 10) : 0);
      }}
      placeholder={placeholder}
      className={cn(
        "num rounded-md border border-border bg-bg px-2 py-1.5 text-sm text-fg focus:border-fg focus:outline-none",
        className,
      )}
    />
  );
}

function LieSelect({ value, onChange }: { value: Lie; onChange: (l: Lie) => void }) {
  // Compact chip-style select — grid of 5 buttons, wraps to 2 rows on narrow screens
  return (
    <div className="grid grid-cols-5 gap-1">
      {NON_TEE_LIES.map(({ lie, label }) => {
        const active = value === lie;
        return (
          <button
            key={lie}
            type="button"
            onClick={() => onChange(lie)}
            className={cn(
              "rounded-md border py-1 text-[10px] font-medium",
              active
                ? "border-primary bg-primary text-white"
                : "border-border bg-bg text-fg-muted active:bg-bg-muted",
            )}
          >
            {label.slice(0, 4)}
          </button>
        );
      })}
    </div>
  );
}
