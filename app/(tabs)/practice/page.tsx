"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { GAMES } from "@/lib/practice/games";
import type { GameArea } from "@/lib/practice/types";
import { listGameSessions } from "@/lib/storage";
import type { GameSession } from "@/lib/practice/types";
import { generatePracticeInsights, type PracticeInsight, type PracticeInsightSeverity } from "@/lib/practice/insights";
import { cn } from "@/lib/utils";
import {
  Target, Flag, Wind, ChevronRight, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle2, CalendarClock, Info,
} from "lucide-react";

const AREAS: { key: GameArea; label: string; icon: React.ReactNode }[] = [
  { key: "putting", label: "Putting", icon: <Target size={16} /> },
  { key: "short-game", label: "Short Game", icon: <Flag size={16} /> },
  { key: "ball-striking", label: "Ball Striking", icon: <Wind size={16} /> },
];

export default function PracticePage() {
  const [area, setArea] = useState<GameArea>("putting");
  const [sessions, setSessions] = useState<GameSession[]>([]);

  useEffect(() => {
    listGameSessions().then(setSessions);
  }, []);

  const practiceInsights = useMemo(
    () => generatePracticeInsights(sessions, Date.now()),
    [sessions],
  );

  const games = GAMES.filter((g) => g.area === area);

  // Latest session per game, for the "last score" chip
  const latestByGame = new Map<string, GameSession>();
  for (const s of sessions) {
    if (!latestByGame.has(s.gameId)) latestByGame.set(s.gameId, s);
  }

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="mb-4 flex items-baseline justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Practice</h1>
        <div className="num text-[10px] uppercase tracking-wide text-fg-faint">
          {sessions.length} logged
        </div>
      </div>

      {/* Practice Insights */}
      {practiceInsights.length > 0 && (
        <div className="mb-5">
          <h2 className="mb-2 text-[11px] uppercase tracking-wide text-fg-faint">Practice insights</h2>
          <div className="space-y-2">
            {practiceInsights.slice(0, 5).map((ins) => (
              <PracticeInsightCard key={ins.id} insight={ins} />
            ))}
          </div>
        </div>
      )}

      {/* Area tabs */}
      <div className="mb-4 grid grid-cols-3 gap-1.5">
        {AREAS.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={() => setArea(a.key)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg border py-2.5 text-xs font-medium",
              area === a.key
                ? "border-primary bg-primary text-white"
                : "border-border bg-bg-raised text-fg-muted",
            )}
          >
            {a.icon}
            <span className="hidden xs:inline">{a.label}</span>
          </button>
        ))}
      </div>

      {/* Games list */}
      <div className="space-y-2">
        {games.map((g) => {
          const last = latestByGame.get(g.id);
          const count = sessions.filter((s) => s.gameId === g.id).length;
          return (
            <Link
              key={g.id}
              href={`/practice/${g.id}`}
              className="block rounded-xl border border-border bg-bg-raised p-3 active:bg-bg-muted"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-fg">{g.name}</h3>
                    {g.source && (
                      <span className="rounded bg-bg px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-fg-faint">
                        {g.source}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-fg-muted">{g.tagline}</p>
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-fg-faint">
                    <span className="num">
                      Target {g.targetPoints}/{g.maxPoints}
                    </span>
                    {count > 0 && (
                      <span className="num flex items-center gap-1">
                        <TrendingUp size={10} /> {count} played
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {last && (
                    <span
                      className={cn(
                        "num rounded-md px-1.5 py-0.5 text-xs font-medium",
                        scoreIsGood(last.score, g.targetPoints, g.higherIsBetter !== false)
                          ? "bg-sg-gain/20 text-sg-gain"
                          : "bg-bg text-fg-muted",
                      )}
                    >
                      {last.score}
                    </span>
                  )}
                  <ChevronRight size={16} className="text-fg-faint" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <p className="mt-6 text-center text-[11px] text-fg-faint">
        Points games from tour ranges, DECADE, and coaching staples. Play, log your score, track trends.
      </p>
    </div>
  );
}

function scoreIsGood(score: number, target: number, higherIsBetter: boolean): boolean {
  return higherIsBetter ? score >= target : score <= target;
}

function PracticeInsightCard({ insight }: { insight: PracticeInsight }) {
  const { icon, border, chip } = practiceStyle(insight.severity);
  return (
    <div className={cn("rounded-xl border p-3", border)}>
      <div className="flex items-start gap-2.5">
        <div className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full", chip)}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-fg">{insight.headline}</h3>
            {insight.metric && (
              <span className="num shrink-0 rounded-md bg-bg px-1.5 py-0.5 text-[10px] text-fg-muted">
                {insight.metric}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">{insight.body}</p>
        </div>
      </div>
    </div>
  );
}

function practiceStyle(sev: PracticeInsightSeverity): { icon: React.ReactNode; border: string; chip: string } {
  switch (sev) {
    case "weakness":
      return { icon: <AlertTriangle size={14} className="text-sg-loss" />, border: "border-sg-loss/40 bg-sg-loss/5", chip: "bg-sg-loss/20" };
    case "trend-down":
      return { icon: <TrendingDown size={14} className="text-amber-500" />, border: "border-amber-500/40 bg-amber-500/5", chip: "bg-amber-500/20" };
    case "gap":
      return { icon: <CalendarClock size={14} className="text-amber-500" />, border: "border-amber-500/40 bg-amber-500/5", chip: "bg-amber-500/20" };
    case "trend-up":
      return { icon: <TrendingUp size={14} className="text-sg-gain" />, border: "border-sg-gain/40 bg-sg-gain/5", chip: "bg-sg-gain/20" };
    case "strength":
      return { icon: <CheckCircle2 size={14} className="text-sg-gain" />, border: "border-sg-gain/40 bg-sg-gain/5", chip: "bg-sg-gain/20" };
    default:
      return { icon: <Info size={14} className="text-fg-muted" />, border: "border-border bg-bg-raised", chip: "bg-bg" };
  }
}
