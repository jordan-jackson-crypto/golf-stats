"use client";

import { useEffect, useMemo, useState } from "react";
import { listRounds } from "@/lib/storage";
import type { StoredRound } from "@/lib/storage/types";
import { generateInsights, type Insight, type InsightSeverity } from "@/lib/insights/engine";
import { LEVEL_LABEL, type SkillLevel } from "@/lib/benchmarks";
import { cn } from "@/lib/utils";
import { AlertTriangle, TrendingUp, TrendingDown, Info, CheckCircle2, Target } from "lucide-react";

export default function InsightsPage() {
  const [rounds, setRounds] = useState<StoredRound[] | null>(null);
  const [target, setTarget] = useState<SkillLevel>("scratch");

  useEffect(() => {
    listRounds().then((all) => setRounds(all.filter((r) => r.status === "complete")));
  }, []);

  const insights = useMemo(() => (rounds ? generateInsights(rounds, target) : []), [rounds, target]);

  if (rounds === null) return <div className="p-6 text-fg-faint">Loading…</div>;

  if (rounds.length < 3) {
    return (
      <div className="px-4 pt-6">
        <h1 className="mb-4 text-xl font-semibold tracking-tight">Insights</h1>
        <div className="rounded-lg border border-border bg-bg-raised p-4">
          <div className="text-sm text-fg">Log at least 3 rounds to unlock insights.</div>
          <div className="mt-1 text-xs text-fg-faint">
            You have {rounds.length}. Log shot detail on each hole for the fullest analysis.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="mb-1 flex items-baseline justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Insights</h1>
        <div className="text-[10px] uppercase tracking-wide text-fg-faint">
          Last {rounds.length} rounds
        </div>
      </div>

      {/* Target selector */}
      <div className="mt-3 rounded-lg border border-border bg-bg-raised p-3">
        <div className="mb-2 text-[11px] uppercase tracking-wide text-fg-faint">Ranking your game vs.</div>
        <div className="grid grid-cols-3 gap-1.5">
          {(["tour", "scratch", "5hcp"] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setTarget(lvl)}
              className={cn(
                "rounded-md border py-1.5 text-[11px]",
                target === lvl
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-bg text-fg-muted",
              )}
            >
              {LEVEL_LABEL[lvl]}
            </button>
          ))}
        </div>
      </div>

      {/* Insight cards */}
      <div className="mt-4 space-y-3">
        {insights.length === 0 ? (
          <div className="rounded-lg border border-border bg-bg-raised p-3 text-sm text-fg-faint">
            Not enough data yet — keep logging rounds.
          </div>
        ) : (
          insights.map((i, idx) => <InsightCard key={i.id} insight={i} rank={idx + 1} />)
        )}
      </div>
    </div>
  );
}

function InsightCard({ insight, rank }: { insight: Insight; rank: number }) {
  const { icon, color, bg } = severityStyle(insight.severity);
  return (
    <div className={cn("rounded-xl border p-4", color)}>
      <div className="flex items-start gap-3">
        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", bg)}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-fg">
              <span className="text-fg-faint">#{rank} · </span>
              {insight.headline}
            </h3>
            {insight.metric && (
              <span className="num shrink-0 rounded-md bg-bg px-1.5 py-0.5 text-[10px] text-fg-muted">
                {insight.metric}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-fg-muted">{insight.body}</p>
          {insight.targetHelp && (
            <div className="mt-2 flex items-start gap-1.5 rounded-md bg-bg/50 px-2 py-1.5">
              <Target size={11} className="mt-0.5 shrink-0 text-primary" />
              <div className="text-[11px] leading-snug text-fg">{insight.targetHelp}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function severityStyle(sev: InsightSeverity): { icon: React.ReactNode; color: string; bg: string } {
  switch (sev) {
    case "critical":
      return {
        icon: <AlertTriangle size={16} className="text-sg-loss" />,
        color: "border-sg-loss/40 bg-sg-loss/5",
        bg: "bg-sg-loss/20",
      };
    case "warning":
      return {
        icon: <TrendingDown size={16} className="text-amber-500" />,
        color: "border-amber-500/40 bg-amber-500/5",
        bg: "bg-amber-500/20",
      };
    case "positive":
      return {
        icon: <CheckCircle2 size={16} className="text-sg-gain" />,
        color: "border-sg-gain/40 bg-sg-gain/5",
        bg: "bg-sg-gain/20",
      };
    default:
      return {
        icon: <Info size={16} className="text-fg-muted" />,
        color: "border-border bg-bg-raised",
        bg: "bg-bg",
      };
  }
}
