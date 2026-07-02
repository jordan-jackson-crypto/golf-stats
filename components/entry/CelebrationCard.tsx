"use client";

import { cn, fmtSG, sgColorClass } from "@/lib/utils";

interface Props {
  hole: number;
  par: number;
  score: number;
  sg: number;
  isLastHole: boolean;
  onNextHole: () => void;
  onFinish: () => void;
  onUndo: () => void;
}

function scoreLabel(score: number, par: number): { label: string; emoji: string; tone: "gain" | "loss" | "neutral" } {
  const diff = score - par;
  if (score === 1) return { label: "HOLE-IN-ONE", emoji: "🏌️‍♂️", tone: "gain" };
  if (diff <= -3) return { label: "ALBATROSS", emoji: "🦢", tone: "gain" };
  if (diff === -2) return { label: "EAGLE", emoji: "🦅", tone: "gain" };
  if (diff === -1) return { label: "BIRDIE", emoji: "🐦", tone: "gain" };
  if (diff === 0) return { label: "PAR", emoji: "🟢", tone: "neutral" };
  if (diff === 1) return { label: "BOGEY", emoji: "😐", tone: "loss" };
  if (diff === 2) return { label: "DOUBLE", emoji: "😬", tone: "loss" };
  if (diff === 3) return { label: "TRIPLE", emoji: "💀", tone: "loss" };
  return { label: `+${diff}`, emoji: "☠️", tone: "loss" };
}

export function CelebrationCard({ hole, par, score, sg, isLastHole, onNextHole, onFinish, onUndo }: Props) {
  const { label, emoji, tone } = scoreLabel(score, par);
  const diff = score - par;

  return (
    <div className="flex h-full flex-col px-4 pb-safe">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="mb-2 text-xs uppercase tracking-widest text-fg-faint">Hole {hole} · Par {par}</div>
        <div className="mb-3 text-7xl">{emoji}</div>
        <div
          className={cn(
            "mb-2 text-3xl font-bold tracking-tight",
            tone === "gain" && "text-sg-gain",
            tone === "loss" && "text-sg-loss",
            tone === "neutral" && "text-fg",
          )}
        >
          {label}
        </div>
        <div className="num text-4xl font-semibold text-fg">{score}</div>
        <div className="num mt-1 text-sm text-fg-muted">
          {diff > 0 ? `+${diff}` : diff === 0 ? "E" : diff} to par
        </div>
        <div className={cn("num mt-3 text-sm", sgColorClass(sg))}>
          SG {fmtSG(sg)}
        </div>
      </div>

      <div className="space-y-2 pt-4">
        {isLastHole ? (
          <button
            type="button"
            onClick={onFinish}
            className="w-full rounded-xl bg-fg py-4 text-base font-semibold uppercase tracking-wide text-bg"
          >
            Finish round →
          </button>
        ) : (
          <button
            type="button"
            onClick={onNextHole}
            className="w-full rounded-xl bg-fg py-4 text-base font-semibold uppercase tracking-wide text-bg"
          >
            Next hole →
          </button>
        )}
        <button
          type="button"
          onClick={onUndo}
          className="w-full rounded-lg border border-border py-2 text-xs uppercase tracking-wide text-fg-muted"
        >
          Undo last shot
        </button>
      </div>
    </div>
  );
}
