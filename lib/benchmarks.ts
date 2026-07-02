/**
 * Skill-level benchmarks for Strokes Gained.
 *
 * All values are per-round SG DIFFERENTIALS versus the PGA Tour baseline
 * (Tour average = 0.0 by definition). Negative = worse than tour.
 *
 * Approximate figures from Broadie's "Every Shot Counts" (Chap. 6) and
 * subsequent published amateur data. Round numbers, but directionally
 * accurate; useful as reference lines, not exact truth.
 */

export type SkillLevel = "tour" | "scratch" | "5hcp" | "10hcp" | "15hcp" | "20hcp";

export interface SGBenchmark {
  total: number;
  ott: number;
  app: number;
  arg: number;
  putt: number;
}

/** Per-round SG differential vs PGA Tour (Tour = 0). */
export const BENCHMARKS: Record<SkillLevel, SGBenchmark> = {
  tour:    { total:  0.0, ott:  0.0, app:  0.0, arg:  0.0, putt:  0.0 },
  scratch: { total: -3.0, ott: -0.5, app: -1.4, arg: -0.4, putt: -0.7 },
  "5hcp":  { total: -7.5, ott: -1.6, app: -3.0, arg: -1.2, putt: -1.7 },
  "10hcp": { total: -12.0, ott: -2.9, app: -4.5, arg: -1.9, putt: -2.7 },
  "15hcp": { total: -17.0, ott: -4.1, app: -6.1, arg: -2.7, putt: -4.1 },
  "20hcp": { total: -22.0, ott: -5.2, app: -7.7, arg: -3.6, putt: -5.5 },
};

export const LEVEL_LABEL: Record<SkillLevel, string> = {
  tour: "PGA Tour",
  scratch: "Scratch amateur",
  "5hcp": "5-handicap",
  "10hcp": "10-handicap",
  "15hcp": "15-handicap",
  "20hcp": "20-handicap",
};

/**
 * Categorise a raw SG differential vs Tour into a skill-level bucket.
 * "You're playing at X level."
 */
export function bucketByLevel(sgVsTour: number, key: keyof SGBenchmark): SkillLevel {
  const order: SkillLevel[] = ["tour", "scratch", "5hcp", "10hcp", "15hcp", "20hcp"];
  // Find the level whose benchmark is closest to (or better than) the observed value
  let best: SkillLevel = "20hcp";
  for (const lvl of order) {
    if (sgVsTour >= BENCHMARKS[lvl][key] - 0.001) {
      best = lvl;
      return best;
    }
  }
  return best;
}

/** Human summary comparing observed SG to nearest benchmark. */
export function describeVsBenchmarks(
  sgVsTour: number,
  key: keyof SGBenchmark,
): { level: SkillLevel; delta: number; direction: "above" | "below" | "at" } {
  const level = bucketByLevel(sgVsTour, key);
  const bench = BENCHMARKS[level][key];
  const delta = sgVsTour - bench;
  const direction = Math.abs(delta) < 0.1 ? "at" : delta > 0 ? "above" : "below";
  return { level, delta, direction };
}
