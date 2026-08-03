"use client";

import { useState } from "react";
import { PREP, type PrepCard } from "@/lib/prep/content";
import { cn } from "@/lib/utils";
import { ChevronDown, BrainCircuit, ListChecks, LineChart } from "lucide-react";

const SECTION_ICON: Record<string, React.ReactNode> = {
  mastery: <BrainCircuit size={16} />,
  "best-practices": <ListChecks size={16} />,
  "stats-approach": <LineChart size={16} />,
};

export default function PrepPage() {
  const [section, setSection] = useState(PREP[0].id);
  const active = PREP.find((s) => s.id === section) ?? PREP[0];

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="mb-1">
        <h1 className="text-xl font-semibold tracking-tight">Play Prep</h1>
        <p className="mt-1 text-xs text-fg-muted">
          How to take a good game to the course and actually score.
        </p>
      </div>

      {/* Section tabs */}
      <div className="mt-4 mb-4 grid grid-cols-3 gap-1.5">
        {PREP.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg border py-2.5 text-[11px] font-medium",
              section === s.id
                ? "border-primary bg-primary text-white"
                : "border-border bg-bg-raised text-fg-muted",
            )}
          >
            {SECTION_ICON[s.id]}
            <span>{s.title}</span>
          </button>
        ))}
      </div>

      <p className="mb-3 text-[11px] leading-relaxed text-fg-faint">{active.subtitle}</p>

      <div className="space-y-2">
        {active.cards.map((c) => (
          <PrepCardItem key={c.id} card={c} />
        ))}
      </div>

      <p className="mt-6 text-center text-[10px] text-fg-faint">
        Sources: Jon Sherman · Scott Fawcett (DECADE) · Mark Broadie
      </p>
    </div>
  );
}

function PrepCardItem({ card }: { card: PrepCard }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-bg-raised">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-2 px-3 py-3 text-left"
      >
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-fg">{card.title}</h3>
          <p className="mt-0.5 text-xs text-fg-muted">{card.summary}</p>
          {card.source && (
            <span className="mt-1 inline-block rounded bg-bg px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-fg-faint">
              {card.source}
            </span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={cn("mt-1 shrink-0 text-fg-faint transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <ul className="space-y-2 border-t border-border px-3 py-3">
          {card.points.map((p, i) => (
            <li key={i} className="flex gap-2 text-xs leading-relaxed text-fg-muted">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
