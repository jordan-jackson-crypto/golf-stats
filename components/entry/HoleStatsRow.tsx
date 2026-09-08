"use client";

import { cn } from "@/lib/utils";
import type { HoleStats, FairwayResult } from "@/lib/storage/types";
import { Check } from "lucide-react";

interface Props {
  value: HoleStats;
  /** Values implied by logged shot detail — shown greyed as a fallback. */
  derived?: HoleStats;
  par: 3 | 4 | 5;
  /** Receives an updater so rapid taps compose instead of overwriting. */
  onChange: (update: (cur: HoleStats) => HoleStats) => void;
}

const PUTT_OPTIONS = [0, 1, 2, 3, 4, 5];

/**
 * Fairway / green / putts in three taps. Sits between the score stepper and
 * shot detail, so a score-only round still produces FIR, GIR, putts,
 * three-putt and scrambling numbers.
 *
 * Tapping the active choice again clears it.
 */
export function HoleStatsRow({ value, derived, par, onChange }: Props) {
  const set = <K extends keyof HoleStats>(key: K, v: HoleStats[K]) =>
    onChange((cur) => ({ ...cur, [key]: cur[key] === v ? undefined : v }));

  const fairway = value.fairway ?? derived?.fairway;
  const gir = value.gir ?? derived?.gir;
  const putts = value.putts ?? derived?.putts;
  const isDerived = (k: keyof HoleStats) => value[k] == null && derived?.[k] != null;

  return (
    <div className="space-y-2 rounded-xl border border-border bg-bg-raised p-3">
      {par >= 4 && (
        <Row label="Fairway" ghost={isDerived("fairway")}>
          {([
            { v: "left", label: "L" },
            { v: "hit", label: "Hit" },
            { v: "right", label: "R" },
          ] as { v: FairwayResult; label: string }[]).map((o) => (
            <Pill
              key={o.v}
              active={fairway === o.v}
              good={o.v === "hit"}
              ghost={isDerived("fairway")}
              onClick={() => set("fairway", o.v)}
            >
              {o.v === "hit" && fairway === "hit" ? <Check size={12} strokeWidth={3} /> : null}
              {o.label}
            </Pill>
          ))}
        </Row>
      )}

      <Row label="Green" ghost={isDerived("gir")} hint={`in ${Math.max(1, par - 2)}`}>
        <Pill active={gir === false} bad ghost={isDerived("gir")} onClick={() => set("gir", false)}>
          Miss
        </Pill>
        <Pill active={gir === true} good ghost={isDerived("gir")} onClick={() => set("gir", true)}>
          {gir === true ? <Check size={12} strokeWidth={3} /> : null}
          GIR
        </Pill>
      </Row>

      <Row label="Putts" ghost={isDerived("putts")}>
        {PUTT_OPTIONS.map((n) => (
          <Pill
            key={n}
            active={putts === n}
            good={n <= 1}
            bad={n >= 3}
            ghost={isDerived("putts")}
            onClick={() => set("putts", n)}
          >
            {n === 5 ? "5+" : n}
          </Pill>
        ))}
      </Row>

      {(isDerived("fairway") || isDerived("gir") || isDerived("putts")) && (
        <div className="pt-0.5 text-[10px] text-fg-faint">
          Greyed values come from your shot detail — tap to override.
        </div>
      )}
    </div>
  );
}

function Row({
  label, hint, ghost, children,
}: {
  label: string; hint?: string; ghost?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-14 shrink-0">
        <div className="text-[10px] uppercase tracking-wide text-fg-faint">{label}</div>
        {hint && <div className="text-[9px] text-fg-faint/70">{hint}</div>}
      </div>
      <div className={cn("flex flex-1 gap-1", ghost && "opacity-70")}>{children}</div>
    </div>
  );
}

function Pill({
  active, good, bad, ghost, onClick, children,
}: {
  active: boolean; good?: boolean; bad?: boolean; ghost?: boolean;
  onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "num flex h-9 flex-1 items-center justify-center gap-1 rounded-lg border text-xs transition-colors",
        !active && "border-border bg-bg text-fg-muted",
        active && ghost && "border-border bg-bg-muted text-fg-muted",
        active && !ghost && good && "border-sg-gain bg-sg-gain/15 text-fg",
        active && !ghost && bad && "border-sg-loss bg-sg-loss/15 text-fg",
        active && !ghost && !good && !bad && "border-primary bg-primary/15 text-fg",
      )}
    >
      {children}
    </button>
  );
}
