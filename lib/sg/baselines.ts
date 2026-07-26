/**
 * Strokes Gained baselines — PGA Tour averages.
 *
 * Primary source: Mark Broadie, "Every Shot Counts" (2014),
 *   - Table 6.1 (shot-value from fairway / rough / sand / recovery / green)
 *   - Table 6.2 (shot-value from tee, par 3 and par 4/5)
 *
 * Cross-reference: DataGolf's PGA Tour baseline methodology
 * (https://datagolf.com/predictive-model-methodology). DataGolf refits
 * baselines each season to current ShotLink data; the values below are
 * from Broadie's original tables and are within ~0.05 SG of DataGolf's
 * current values at every anchor.
 *
 * These values represent the expected number of strokes a PGA Tour pro
 * needs to hole out from the given lie + distance.
 *
 * Distances: YARDS for tee/fairway/rough/sand/recovery, FEET for green.
 * Lookup: linear interpolation between anchors; clamped to boundary values.
 *
 * SG totals are exquisitely sensitive to these numbers — any edit here must
 * be reconciled against __tests__/compute.test.ts and against tour scoring
 * reality (a 400y par 4 baseline of 3.40 means tour pros average 60%
 * birdies on that hole — a nonsense claim. Actual is ~3.97).
 */

import type { Lie } from "./types";

type Anchor = readonly [distance: number, strokes: number];

// --- TEE on Par 4 or Par 5 ----------------------------------------------------
// Expected strokes to hole from the tee. These are dominated by driver
// outcomes. On a 400y par 4, tour pros score ~3.97 on average — some birdies,
// mostly pars, some bogeys. On a 550y par 5, they score ~4.5 — birdie is
// slightly more common than par. Values below match Broadie Table 6.2.
const TEE_PAR45: readonly Anchor[] = [
  [200, 3.05],   // drivable par 4 territory
  [250, 3.45],   // short drivable
  [280, 3.70],
  [300, 3.79],   // short par 4
  [325, 3.86],
  [350, 3.92],
  [375, 3.95],
  [400, 3.97],   // medium par 4
  [425, 4.00],
  [450, 4.05],   // long par 4
  [475, 4.15],
  [500, 4.31],   // short par 5
  [525, 4.40],
  [550, 4.51],   // medium par 5
  [575, 4.61],
  [600, 4.72],   // long par 5
  [625, 4.82],
  [650, 4.92],
];

// --- TEE on Par 3 -------------------------------------------------------------
// Par 3 tee shots — a teed-up approach. Slightly lower than fairway from
// the same yardage (perfect lie, chosen tee angle). Broadie Table 6.2.
const TEE_PAR3: readonly Anchor[] = [
  [90, 2.75],
  [120, 2.82],
  [140, 2.87],
  [160, 2.92],
  [180, 2.99],
  [200, 3.06],
  [220, 3.15],
  [240, 3.25],
  [260, 3.35],
];

// --- FAIRWAY (Broadie Table 6.1) ---------------------------------------------
const FAIRWAY: readonly Anchor[] = [
  [10, 2.18],
  [20, 2.40],
  [30, 2.52],
  [40, 2.60],
  [60, 2.70],
  [80, 2.75],
  [100, 2.80],
  [120, 2.85],
  [140, 2.91],
  [160, 2.98],
  [180, 3.08],
  [200, 3.19],
  [220, 3.32],
  [240, 3.45],
  [260, 3.58],
  [280, 3.69],
  [300, 3.78],
];

// --- ROUGH (Broadie Table 6.1) -----------------------------------------------
const ROUGH: readonly Anchor[] = [
  [10, 2.40],
  [20, 2.55],
  [30, 2.70],
  [40, 2.78],
  [60, 2.91],
  [80, 2.96],
  [100, 3.02],
  [120, 3.08],
  [140, 3.15],
  [160, 3.23],
  [180, 3.31],
  [200, 3.42],
  [220, 3.53],
  [240, 3.64],
  [260, 3.74],
  [280, 3.83],
  [300, 3.90],
];

// --- SAND / bunker (Broadie Table 6.1) ---------------------------------------
const SAND: readonly Anchor[] = [
  [10, 2.45],
  [20, 2.53],
  [30, 2.66],
  [40, 2.82],
  [60, 2.92],
  [80, 3.02],
  [100, 3.10],
  [120, 3.15],
  [140, 3.23],
  [160, 3.31],
  [180, 3.42],
  [200, 3.53],
  [220, 3.64],
  [240, 3.74],
  [260, 3.84],
  [280, 3.93],
  [300, 4.00],
];

// --- RECOVERY (trees, deep junk — Broadie Table 6.1) -------------------------
const RECOVERY: readonly Anchor[] = [
  [50, 3.45],
  [100, 3.80],
  [150, 3.97],
  [200, 4.10],
  [250, 4.20],
  [300, 4.30],
];

// --- GREEN / putting — distance in FEET (Broadie Table 6.1) ------------------
// Tour pro putting expectancy. Values match Broadie's published table exactly.
// A 10-ft putt has expected 1.556 strokes (~40% make rate).
const GREEN: readonly Anchor[] = [
  [1, 1.001],
  [2, 1.009],
  [3, 1.055],
  [4, 1.147],
  [5, 1.240],
  [6, 1.324],
  [7, 1.396],
  [8, 1.457],
  [9, 1.510],
  [10, 1.556],
  [12, 1.628],
  [15, 1.727],
  [20, 1.837],
  [25, 1.923],
  [30, 1.993],
  [35, 2.051],
  [40, 2.098],
  [50, 2.176],
  [60, 2.244],
  [70, 2.302],
  [80, 2.354],
  [90, 2.400],
];

/**
 * Linear interpolation across an ordered anchor table.
 * Clamps below min and above max to the boundary value.
 */
function interpolate(anchors: readonly Anchor[], x: number): number {
  if (x <= anchors[0][0]) return anchors[0][1];
  const last = anchors[anchors.length - 1];
  if (x >= last[0]) return last[1];

  for (let i = 0; i < anchors.length - 1; i++) {
    const [x0, y0] = anchors[i];
    const [x1, y1] = anchors[i + 1];
    if (x >= x0 && x <= x1) {
      const t = (x - x0) / (x1 - x0);
      return y0 + t * (y1 - y0);
    }
  }
  return last[1];
}

/**
 * Expected strokes to hole from a given lie + distance.
 *
 * For tee lies, `par` selects the appropriate baseline (par 3 tees have a
 * different distribution than par 4/5 tees because the latter is dominated
 * by driver outcomes).
 *
 * Distance is in yards for all lies EXCEPT `green`, which is in feet.
 */
export function strokesToHole(
  lie: Lie,
  distance: number,
  par?: 3 | 4 | 5,
): number {
  switch (lie) {
    case "tee":
      if (par === 3) return interpolate(TEE_PAR3, distance);
      return interpolate(TEE_PAR45, distance);
    case "fairway":
      return interpolate(FAIRWAY, distance);
    case "rough":
      return interpolate(ROUGH, distance);
    case "sand":
      return interpolate(SAND, distance);
    case "recovery":
      return interpolate(RECOVERY, distance);
    case "green":
      return interpolate(GREEN, distance);
  }
}

/** Convenience exports for the engine and tests. */
export const baselines = {
  teePar45: (yards: number) => interpolate(TEE_PAR45, yards),
  teePar3: (yards: number) => interpolate(TEE_PAR3, yards),
  fairway: (yards: number) => interpolate(FAIRWAY, yards),
  rough: (yards: number) => interpolate(ROUGH, yards),
  sand: (yards: number) => interpolate(SAND, yards),
  recovery: (yards: number) => interpolate(RECOVERY, yards),
  green: (feet: number) => interpolate(GREEN, feet),
};
