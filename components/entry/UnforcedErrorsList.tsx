"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { UnforcedErrors, UnforcedErrorFlag, MentalMistakeDetail, MentalPhase } from "@/lib/storage/types";
import { MENTAL_MISTAKES, PHASE_LABEL, type MentalMistakeTag } from "@/lib/mental";
import { Check } from "lucide-react";

interface Props {
  value: UnforcedErrors;
  par: number;
  /** Receives an updater so rapid taps compose instead of overwriting. */
  onChange: (update: (cur: UnforcedErrors) => UnforcedErrors) => void;
}

/**
 * NOTE: the parent should key this component by hole so the note draft resets
 * when you move on.
 */

const ITEMS: { key: UnforcedErrorFlag; label: string; showForPar?: number[] }[] = [
  { key: "sixPlusOnPar5", label: "6+ on a par 5?", showForPar: [5] },
  { key: "doubleOrWorse", label: "Double or worse?" },
  { key: "threePutt", label: "Three-putt?" },
  { key: "pwOrLessBogey", label: "PW-or-less bogey?" },
  { key: "shortSided", label: "Short-sided leave?" },
  { key: "penaltyObWater", label: "Penalty / OB / Water?" },
  { key: "mentalMistake", label: "Mental mistake?" },
];

const PHASES: MentalPhase[] = ["tee", "approach", "short-game", "putt", "between"];

export function UnforcedErrorsList({ value, par, onChange }: Props) {
  const items = ITEMS.filter((i) => !i.showForPar || i.showForPar.includes(par));
  const mental: MentalMistakeDetail = value.mental ?? { tags: [] };

  const setMental = (patch: Partial<MentalMistakeDetail>) =>
    onChange((cur) => ({ ...cur, mental: { tags: [], ...cur.mental, ...patch } }));

  // The note is edited locally and committed on blur — persisting the whole
  // round on every keystroke would hammer IndexedDB and the cloud push.
  const [noteDraft, setNoteDraft] = useState(mental.note ?? "");

  const toggleTag = (tag: MentalMistakeTag) =>
    onChange((cur) => {
      const tags = cur.mental?.tags ?? [];
      return {
        ...cur,
        mental: {
          ...cur.mental,
          tags: tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag],
        },
      };
    });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {items.map(({ key, label }) => {
          const on = !!value[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange((cur) => ({ ...cur, [key]: !cur[key] }))}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-2 py-2 text-left text-xs",
                on
                  ? "border-sg-loss/60 bg-sg-loss/10 text-fg"
                  : "border-border bg-bg-raised text-fg-muted",
              )}
            >
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                  on ? "border-sg-loss bg-sg-loss text-white" : "border-border",
                )}
              >
                {on && <Check size={10} strokeWidth={3} />}
              </span>
              <span className="leading-tight">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Mental-mistake detail — only once the flag is on. Tagging it here is
          what feeds the Library of mental mistakes on the Insights tab. */}
      {value.mentalMistake && (
        <div className="space-y-3 rounded-xl border border-sg-loss/40 bg-sg-loss/5 p-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
              What kind of mistake?
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {MENTAL_MISTAKES.map((m) => {
                const on = mental.tags.includes(m.tag);
                return (
                  <button
                    key={m.tag}
                    type="button"
                    onClick={() => toggleTag(m.tag)}
                    title={m.what}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11px] leading-none transition-colors",
                      on
                        ? "border-sg-loss bg-sg-loss text-white"
                        : "border-border bg-bg text-fg-muted",
                    )}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
            {mental.tags.length > 0 && (
              <p className="mt-2 text-[11px] leading-snug text-fg-muted">
                {MENTAL_MISTAKES.find((m) => m.tag === mental.tags[mental.tags.length - 1])?.cue}
              </p>
            )}
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">Where</div>
            <div className="mt-2 grid grid-cols-5 gap-1">
              {PHASES.map((p) => {
                const on = mental.phase === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setMental({ phase: on ? undefined : p })}
                    className={cn(
                      "rounded-md border px-1 py-1.5 text-[10px] leading-tight",
                      on ? "border-primary bg-primary/15 text-fg" : "border-border bg-bg text-fg-muted",
                    )}
                  >
                    {PHASE_LABEL[p]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
              What happened?
            </div>
            <textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              onBlur={() => {
                const next = noteDraft.trim();
                if (next !== (mental.note ?? "")) setMental({ note: next || undefined });
              }}
              rows={2}
              placeholder="One line, in your own words — you'll read this back on the Insights tab."
              className="mt-2 w-full resize-none rounded-lg border border-border bg-bg px-2.5 py-2 text-xs text-fg placeholder:text-fg-faint focus:border-primary focus:outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
