/**
 * Shot-level analysis for the Stats tab: SG by distance band, by lie, and
 * putting SG by distance. SG is recomputed fresh from the current baselines
 * (not read from the stored per-shot value) so a baseline correction is
 * reflected everywhere without needing to re-save every shot.
 *
 * This is the single most important diagnostic in the app — it tells you the
 * exact distances and lies where you're gaining or bleeding strokes.
 */

import type { StoredRound, StoredShot } from "@/lib/storage/types";
import { shotSG } from "@/lib/sg/compute";

export interface BandStat {
  key: string;
  label: string;
  shots: number;
  totalSG: number;
  avgSG: number; // per shot
}

export interface ShotAnalysis {
  approachByDistance: BandStat[];
  approachByLie: BandStat[];
  puttingByDistance: BandStat[];
  totalApproachShots: number;
  totalPutts: number;
}

// Approach distance bands (yards). Broadie's canonical diagnostic buckets.
const APP_BANDS: { key: string; label: string; min: number; max: number }[] = [
  { key: "50-75", label: "50-75", min: 50, max: 75 },
  { key: "75-100", label: "75-100", min: 75, max: 100 },
  { key: "100-125", label: "100-125", min: 100, max: 125 },
  { key: "125-150", label: "125-150", min: 125, max: 150 },
  { key: "150-175", label: "150-175", min: 150, max: 175 },
  { key: "175-200", label: "175-200", min: 175, max: 200 },
  { key: "200+", label: "200+", min: 200, max: Infinity },
];

// Putting distance bands (feet).
const PUTT_BANDS: { key: string; label: string; min: number; max: number }[] = [
  { key: "0-5", label: "0-5 ft", min: 0, max: 5 },
  { key: "5-10", label: "5-10 ft", min: 5, max: 10 },
  { key: "10-15", label: "10-15 ft", min: 10, max: 15 },
  { key: "15-20", label: "15-20 ft", min: 15, max: 20 },
  { key: "20-30", label: "20-30 ft", min: 20, max: 30 },
  { key: "30+", label: "30 ft+", min: 30, max: Infinity },
];

type ShotWithRound = StoredShot & { roundId: string };

export function analyzeShots(
  shots: ShotWithRound[],
  rounds: StoredRound[],
): ShotAnalysis {
  // Map roundId → parPerHole so we can supply par for SG (par 3 tee shots, etc.)
  const parByRound = new Map(rounds.map((r) => [r.id, r.parPerHole ?? []]));
  // Only analyze shots belonging to COMPLETE rounds, to avoid half-entered noise.
  const completeIds = new Set(rounds.filter((r) => r.status === "complete").map((r) => r.id));

  const appDist = APP_BANDS.map((b) => ({ ...b, shots: 0, totalSG: 0 }));
  const puttDist = PUTT_BANDS.map((b) => ({ ...b, shots: 0, totalSG: 0 }));
  const lieBuckets: Record<string, { shots: number; totalSG: number }> = {
    fairway: { shots: 0, totalSG: 0 },
    rough: { shots: 0, totalSG: 0 },
    "sand/recovery": { shots: 0, totalSG: 0 },
  };

  let totalApproachShots = 0;
  let totalPutts = 0;

  for (const shot of shots) {
    if (!completeIds.has(shot.roundId)) continue;
    const pars = parByRound.get(shot.roundId) ?? [];
    const par = (pars[shot.holeNumber - 1] ?? 4) as 3 | 4 | 5;

    const { sg, category } = shotSG({
      startLie: shot.startLie,
      startDistance: shot.startDistance,
      endLie: shot.endLie,
      endDistance: shot.endDistance,
      holed: shot.holed,
      penalty: shot.penalty,
      par,
    });

    if (category === "PUTT") {
      totalPutts++;
      const band = puttDist.find((b) => shot.startDistance >= b.min && shot.startDistance < b.max);
      if (band) { band.shots++; band.totalSG += sg; }
    } else if (category === "APP") {
      totalApproachShots++;
      const band = appDist.find((b) => shot.startDistance >= b.min && shot.startDistance < b.max);
      if (band) { band.shots++; band.totalSG += sg; }
      // By lie (exclude tee — par-3 tee shots have lie "tee")
      if (shot.startLie === "fairway") { lieBuckets.fairway.shots++; lieBuckets.fairway.totalSG += sg; }
      else if (shot.startLie === "rough") { lieBuckets.rough.shots++; lieBuckets.rough.totalSG += sg; }
      else if (shot.startLie === "sand" || shot.startLie === "recovery") {
        lieBuckets["sand/recovery"].shots++; lieBuckets["sand/recovery"].totalSG += sg;
      }
    }
  }

  const toBandStat = (b: { key: string; label: string; shots: number; totalSG: number }): BandStat => ({
    key: b.key,
    label: b.label,
    shots: b.shots,
    totalSG: round2(b.totalSG),
    avgSG: b.shots ? round3(b.totalSG / b.shots) : 0,
  });

  return {
    approachByDistance: appDist.map(toBandStat),
    puttingByDistance: puttDist.map(toBandStat),
    approachByLie: Object.entries(lieBuckets).map(([key, v]) => ({
      key,
      label: key === "sand/recovery" ? "Sand / Recovery" : key.charAt(0).toUpperCase() + key.slice(1),
      shots: v.shots,
      totalSG: round2(v.totalSG),
      avgSG: v.shots ? round3(v.totalSG / v.shots) : 0,
    })),
    totalApproachShots,
    totalPutts,
  };
}

function round2(n: number) { return Math.round(n * 100) / 100; }
function round3(n: number) { return Math.round(n * 1000) / 1000; }
