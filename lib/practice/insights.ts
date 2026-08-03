/**
 * Practice insights — pure functions over logged game sessions.
 * Surfaces what's working, what's slipping, and what's being neglected,
 * so practice time flows to where it moves scores.
 */

import type { GameSession } from "./types";
import { GAMES, getGame } from "./games";
import type { GameArea } from "./types";

export type PracticeInsightSeverity = "strength" | "weakness" | "trend-up" | "trend-down" | "gap" | "info";

export interface PracticeInsight {
  id: string;
  severity: PracticeInsightSeverity;
  headline: string;
  body: string;
  metric?: string;
}

const AREA_LABEL: Record<GameArea, string> = {
  putting: "Putting",
  "short-game": "Short game",
  "ball-striking": "Ball striking",
};

const DAY = 86400000;

export function generatePracticeInsights(sessions: GameSession[], now: number): PracticeInsight[] {
  if (sessions.length === 0) return [];

  const insights: PracticeInsight[] = [];
  const byGame = groupBy(sessions, (s) => s.gameId);

  // --- Per-game trend + target standing ---
  for (const [gameId, gs] of byGame) {
    const game = getGame(gameId);
    if (!game) continue;
    const higher = game.higherIsBetter !== false;
    const sorted = [...gs].sort((a, b) => a.createdAt - b.createdAt);

    // Trend: compare recent half vs earlier half (need >= 4 sessions).
    if (sorted.length >= 4) {
      const mid = Math.floor(sorted.length / 2);
      const earlier = avg(sorted.slice(0, mid).map((s) => s.score));
      const recent = avg(sorted.slice(mid).map((s) => s.score));
      const delta = recent - earlier;
      const improving = higher ? delta > 0 : delta < 0;
      if (Math.abs(delta) >= Math.max(1, game.targetPoints * 0.08)) {
        insights.push({
          id: `trend-${gameId}`,
          severity: improving ? "trend-up" : "trend-down",
          headline: `${game.name} ${improving ? "improving" : "sliding"}`,
          body: improving
            ? `Recent sessions average ${fmt(recent)} vs ${fmt(earlier)} earlier. Keep the reps going.`
            : `Recent sessions average ${fmt(recent)} vs ${fmt(earlier)} earlier. Worth a focused block.`,
          metric: `${delta > 0 ? "+" : ""}${fmt(delta)}`,
        });
      }
    }

    // Target standing (need >= 3 sessions for a stable read).
    if (sorted.length >= 3) {
      const recentAvg = avg(sorted.slice(-3).map((s) => s.score));
      const beatsTarget = higher ? recentAvg >= game.targetPoints : recentAvg <= game.targetPoints;
      const gapPct = Math.abs(recentAvg - game.targetPoints) / Math.max(1, game.targetPoints);
      if (beatsTarget && gapPct >= 0.05) {
        insights.push({
          id: `strength-${gameId}`,
          severity: "strength",
          headline: `Strength: ${game.name}`,
          body: `You're beating the target (${fmt(recentAvg)} vs ${game.targetPoints}) over your last 3. This part of your game is sharp.`,
          metric: `avg ${fmt(recentAvg)}`,
        });
      } else if (!beatsTarget && gapPct >= 0.12) {
        insights.push({
          id: `weakness-${gameId}`,
          severity: "weakness",
          headline: `Below target: ${game.name}`,
          body: `Last 3 average ${fmt(recentAvg)} vs a target of ${game.targetPoints}. ${game.whyItMatters ?? "Prioritize this."}`,
          metric: `avg ${fmt(recentAvg)}`,
        });
      }
    }
  }

  // --- Area coverage / neglect ---
  const areaCounts: Record<GameArea, number> = { putting: 0, "short-game": 0, "ball-striking": 0 };
  const areaLast: Record<GameArea, number> = { putting: 0, "short-game": 0, "ball-striking": 0 };
  for (const s of sessions) {
    const g = getGame(s.gameId);
    if (!g) continue;
    areaCounts[g.area]++;
    areaLast[g.area] = Math.max(areaLast[g.area], s.createdAt);
  }
  const areas = Object.keys(areaCounts) as GameArea[];
  // Neglected: no session in 14+ days (but some history exists).
  for (const a of areas) {
    if (areaLast[a] === 0) {
      insights.push({
        id: `gap-never-${a}`,
        severity: "gap",
        headline: `No ${AREA_LABEL[a].toLowerCase()} logged`,
        body: `You haven't logged a ${AREA_LABEL[a].toLowerCase()} game yet. Even a baseline helps spot leaks.`,
      });
    } else if (now - areaLast[a] > 14 * DAY) {
      const days = Math.round((now - areaLast[a]) / DAY);
      insights.push({
        id: `gap-stale-${a}`,
        severity: "gap",
        headline: `${AREA_LABEL[a]} going stale`,
        body: `${days} days since your last ${AREA_LABEL[a].toLowerCase()} session. Rotate it back in.`,
        metric: `${days}d ago`,
      });
    }
  }

  // --- Balance: over-indexing on one area ---
  const total = sessions.length;
  if (total >= 6) {
    for (const a of areas) {
      if (areaCounts[a] / total >= 0.6) {
        insights.push({
          id: `balance-${a}`,
          severity: "info",
          headline: `Heavy on ${AREA_LABEL[a].toLowerCase()}`,
          body: `${Math.round((areaCounts[a] / total) * 100)}% of your logged practice is ${AREA_LABEL[a].toLowerCase()}. Make sure the other areas aren't quietly leaking strokes.`,
        });
      }
    }
  }

  // Order: weaknesses & downtrends first (actionable), then gaps, then strengths.
  const rank: Record<PracticeInsightSeverity, number> = {
    weakness: 0, "trend-down": 1, gap: 2, "trend-up": 3, strength: 4, info: 5,
  };
  return insights.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

// --- helpers ---
function groupBy<T, K>(arr: T[], key: (t: T) => K): Map<K, T[]> {
  const m = new Map<K, T[]>();
  for (const item of arr) {
    const k = key(item);
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(item);
  }
  return m;
}
function avg(ns: number[]): number { return ns.length ? ns.reduce((a, b) => a + b, 0) / ns.length : 0; }
function fmt(n: number): string { return (Math.round(n * 10) / 10).toString(); }

export const PRACTICE_GAME_COUNT = GAMES.length;
