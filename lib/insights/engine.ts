/**
 * Insights engine — pure functions over completed rounds.
 * UI just renders whatever Insight[] this returns.
 */

import type { StoredRound } from "@/lib/storage/types";
import { BENCHMARKS, LEVEL_LABEL, type SkillLevel } from "@/lib/benchmarks";
import { TIGER5_TARGETS_ONE_HCP, type Tiger5Counts } from "@/lib/tiger5";

export type InsightSeverity = "critical" | "warning" | "positive" | "info";

export interface Insight {
  id: string;
  severity: InsightSeverity;
  headline: string; // one-line hook
  body: string; // 1-2 sentence explanation
  metric?: string; // small pill under headline, e.g. "1.4 shots/round"
  targetHelp?: string; // actionable "focus on..." advice
}

/**
 * Rank the four SG categories by leaked strokes vs the target skill level.
 * The category with the biggest deficit ranks #1.
 */
export function biggestLeak(
  rounds: StoredRound[],
  target: SkillLevel = "scratch",
): Insight | null {
  if (rounds.length === 0) return null;
  const avg = averageSG(rounds);
  const bench = BENCHMARKS[target];

  const deltas = [
    { key: "ott", label: "Off the tee", short: "OTT", delta: avg.ott - bench.ott },
    { key: "app", label: "Approach", short: "APP", delta: avg.app - bench.app },
    { key: "arg", label: "Around the green", short: "ARG", delta: avg.arg - bench.arg },
    { key: "putt", label: "Putting", short: "PUTT", delta: avg.putt - bench.putt },
  ];
  deltas.sort((a, b) => a.delta - b.delta); // worst first

  const worst = deltas[0];
  if (worst.delta >= -0.1) {
    // No meaningful leak — everything is at or above benchmark
    return {
      id: "leak-none",
      severity: "positive",
      headline: `You're playing above ${LEVEL_LABEL[target]} across the board`,
      body: `Every SG category is at or above the ${LEVEL_LABEL[target]} benchmark over your last ${rounds.length} rounds.`,
    };
  }
  return {
    id: "leak-" + worst.key,
    severity: "critical",
    headline: `Biggest leak: ${worst.label}`,
    body: `You're losing ${Math.abs(worst.delta).toFixed(1)} strokes/round on ${worst.label.toLowerCase()} vs a ${LEVEL_LABEL[target]}. This is the #1 area to work on.`,
    metric: `${worst.delta.toFixed(2)} vs ${LEVEL_LABEL[target]}`,
    targetHelp: targetHelpFor(worst.key),
  };
}

/**
 * Tiger 5 top offender — the mistake type with the largest count over the
 * target threshold (weighted by strokes each mistake typically costs).
 */
export function tiger5TopOffender(rounds: StoredRound[]): Insight | null {
  const filtered = rounds.filter((r) => r.tiger5);
  if (filtered.length === 0) return null;

  const avg = averageTiger5(filtered);
  const t = TIGER5_TARGETS_ONE_HCP;

  const items: { key: keyof Tiger5Counts; label: string; count: number; target: number; strokeCost: number; help: string }[] = [
    { key: "doubleBogeys",       label: "Doubles+",       count: avg.doubleBogeys,       target: t.doubleBogeys,       strokeCost: 2, help: "Course management on trouble holes. Play to the fat part of the green when in trouble." },
    { key: "par5BogeysOrWorse",  label: "Par-5 bogeys",   count: avg.par5BogeysOrWorse,  target: t.par5BogeysOrWorse,  strokeCost: 1, help: "Par 5s are scoring holes. Practice controlled 3rd shots from 100-150y." },
    { key: "threePutts",         label: "Three-putts",    count: avg.threePutts,         target: t.threePutts,         strokeCost: 1, help: "Lag putting from 25+ ft. Speed control matters more than line." },
    { key: "bogeysFrom150OrIn",  label: "Bogeys ≤150y",   count: avg.bogeysFrom150OrIn,  target: t.bogeysFrom150OrIn,  strokeCost: 1, help: "Wedge dispersion. Track your carry distances." },
    { key: "blownParSaves",      label: "Blown par saves",count: avg.blownParSaves,      target: t.blownParSaves,      strokeCost: 1, help: "Inside 8 ft — this is a green-reading and stroke consistency thing." },
  ];

  items.sort((a, b) => (b.count - b.target) * b.strokeCost - (a.count - a.target) * a.strokeCost);
  const worst = items[0];
  const over = worst.count - worst.target;

  if (over <= 0.05) {
    return {
      id: "tiger5-clean",
      severity: "positive",
      headline: "Tiger 5 in check",
      body: `You're at or below target for all five mistake types.`,
    };
  }

  return {
    id: "tiger5-" + worst.key,
    severity: over > 0.5 ? "critical" : "warning",
    headline: `Tiger 5: ${worst.label}`,
    body: `You're averaging ${worst.count.toFixed(1)}/round vs target ${worst.target.toFixed(2)}. This is your top Tiger 5 leak.`,
    metric: `+${over.toFixed(1)} over target`,
    targetHelp: worst.help,
  };
}

/**
 * Trend alert — compare rolling 5 vs rolling 20 for any SG category.
 * Flag if a category has dropped meaningfully.
 */
export function trendAlerts(rounds: StoredRound[]): Insight[] {
  if (rounds.length < 5) return [];
  const sorted = [...rounds].sort((a, b) => a.updatedAt - b.updatedAt);
  const last5 = sorted.slice(-5);
  const window20 = sorted.slice(-Math.min(20, sorted.length));

  const avg5 = averageSG(last5);
  const avg20 = averageSG(window20);

  const cats = [
    { k: "ott" as const, label: "Off the tee" },
    { k: "app" as const, label: "Approach" },
    { k: "arg" as const, label: "Around the green" },
    { k: "putt" as const, label: "Putting" },
  ];

  const alerts: Insight[] = [];
  for (const c of cats) {
    const delta = avg5[c.k] - avg20[c.k];
    if (delta <= -0.5) {
      alerts.push({
        id: "trend-down-" + c.k,
        severity: "warning",
        headline: `${c.label} trending down`,
        body: `Last 5 rounds averaging ${avg5[c.k].toFixed(2)}, down from ${avg20[c.k].toFixed(2)} over the last ${window20.length}.`,
        metric: `${delta.toFixed(2)} SG shift`,
      });
    } else if (delta >= 0.5) {
      alerts.push({
        id: "trend-up-" + c.k,
        severity: "positive",
        headline: `${c.label} trending up`,
        body: `Last 5 rounds averaging ${avg5[c.k].toFixed(2)}, up from ${avg20[c.k].toFixed(2)} over the last ${window20.length}.`,
        metric: `+${delta.toFixed(2)} SG shift`,
      });
    }
  }
  return alerts;
}

/**
 * Best / worst round callouts, useful for context.
 */
export function bestWorstRounds(rounds: StoredRound[]): Insight[] {
  if (rounds.length < 3) return [];
  const withSG = rounds.filter((r) => r.sgTotal != null);
  if (withSG.length < 2) return [];
  const best = [...withSG].sort((a, b) => (b.sgTotal! - a.sgTotal!))[0];
  const worst = [...withSG].sort((a, b) => (a.sgTotal! - b.sgTotal!))[0];
  return [
    {
      id: "best-round",
      severity: "positive",
      headline: `Best round: ${best.courseName}`,
      body: `${best.date} · Score ${best.totalScore} · SG ${best.sgTotal!.toFixed(2)}`,
    },
    {
      id: "worst-round",
      severity: "info",
      headline: `Toughest round: ${worst.courseName}`,
      body: `${worst.date} · Score ${worst.totalScore} · SG ${worst.sgTotal!.toFixed(2)}`,
    },
  ];
}

/**
 * Top-level insights ordering.
 */
export function generateInsights(rounds: StoredRound[], target: SkillLevel = "scratch"): Insight[] {
  const insights: Insight[] = [];
  const leak = biggestLeak(rounds, target);
  if (leak) insights.push(leak);
  const tigerTop = tiger5TopOffender(rounds);
  if (tigerTop) insights.push(tigerTop);
  insights.push(...trendAlerts(rounds));
  insights.push(...bestWorstRounds(rounds));
  return insights;
}

// ---------- helpers ----------

function averageSG(rounds: StoredRound[]) {
  const n = rounds.length;
  const sum = { total: 0, ott: 0, app: 0, arg: 0, putt: 0 };
  for (const r of rounds) {
    sum.total += r.sgTotal ?? 0;
    sum.ott += r.sgOTT ?? 0;
    sum.app += r.sgAPP ?? 0;
    sum.arg += r.sgARG ?? 0;
    sum.putt += r.sgPUTT ?? 0;
  }
  return {
    total: sum.total / n,
    ott: sum.ott / n,
    app: sum.app / n,
    arg: sum.arg / n,
    putt: sum.putt / n,
  };
}

function averageTiger5(rounds: StoredRound[]): Tiger5Counts {
  const n = rounds.length;
  const sum: Tiger5Counts = {
    doubleBogeys: 0,
    par5BogeysOrWorse: 0,
    threePutts: 0,
    bogeysFrom150OrIn: 0,
    blownParSaves: 0,
  };
  for (const r of rounds) {
    if (!r.tiger5) continue;
    sum.doubleBogeys += r.tiger5.doubleBogeys;
    sum.par5BogeysOrWorse += r.tiger5.par5BogeysOrWorse;
    sum.threePutts += r.tiger5.threePutts;
    sum.bogeysFrom150OrIn += r.tiger5.bogeysFrom150OrIn;
    sum.blownParSaves += r.tiger5.blownParSaves;
  }
  return {
    doubleBogeys: sum.doubleBogeys / n,
    par5BogeysOrWorse: sum.par5BogeysOrWorse / n,
    threePutts: sum.threePutts / n,
    bogeysFrom150OrIn: sum.bogeysFrom150OrIn / n,
    blownParSaves: sum.blownParSaves / n,
  };
}

function targetHelpFor(key: string): string {
  switch (key) {
    case "ott":  return "Off-the-tee — driver dispersion. Prioritize keeping it in play at your typical distance over adding 10 yards.";
    case "app":  return "Approach — proximity from 125-175y is the single biggest scoring skill. Track your dispersion by club.";
    case "arg":  return "Short game — 20-40 yard proximity control. Landing spot, not swing length.";
    case "putt": return "Putting — lag from 25+ ft and make % from 5-10 ft. Speed control and start line.";
    default: return "";
  }
}
