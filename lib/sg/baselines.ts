/**
 * Strokes Gained baselines — PGA Tour averages.
 *
 * Source: Mark Broadie, "Every Shot Counts" (2014), Appendix tables.
 * These values represent the expected number of strokes a PGA Tour pro
 * needs to hole out from a given lie + distance. They are the canonical
 * reference for Strokes Gained calculations.
 *
 * Distances are in YARDS for tee/fairway/rough/sand/recovery, and in FEET
 * for green (putting).
 *
 * Lookup uses linear interpolation between defined anchor points.
 * Below the minimum anchor, the minimum value is returned.
 * Above the maximum anchor, the maximum value is returned (do not extrapolate
 * indefinitely — beyond the defined range is rare and unreliable).
 *
 * NOTE: Any errata between the encoded values and the published Broadie
 * tables should be corrected here as a single source of truth. SG totals
 * are exquisitely sensitive to baseline accuracy — verify against hand
 * computations in __tests__/compute.test.ts whenever these change.
 */

import type { Lie } from "./types";

type Anchor = readonly [distance: number, strokes: number];

// --- TEE on Par 4 or Par 5 ----------------------------------------------------
// "Strokes to hole from the tee" at the given hole yardage. Captures driver-
// like outcomes; longer holes have higher expected scores.
const TEE_PAR45: readonly Anchor[] = [
  [100, 2.92],
  [150, 2.99],
  [200, 3.08],
  [250, 3.15],
  [300, 3.20],
  [350, 3.27],
  [400, 3.39],
  [450, 3.51],
  [500, 3.63],
  [550, 3.78],
  [600, 3.93],
];

// --- TEE on Par 3 -------------------------------------------------------------
// Par 3 tee shots are effectively approach shots from a teed-up ball.
// Broadie publishes a separate baseline that runs slightly lower than the
// fairway baseline at the same yardage (the lie is perfect).
const TEE_PAR3: readonly Anchor[] = [
  [70, 2.69],
  [80, 2.72],
  [90, 2.75],
  [100, 2.78],
  [120, 2.84],
  [140, 2.89],
  [160, 2.95],
  [180, 3.04],
  [200, 3.13],
  [220, 3.24],
  [240, 3.35],
  [260, 3.46],
];

// --- FAIRWAY ------------------------------------------------------------------
const FAIRWAY: readonly Anchor[] = [
  [20, 2.40],
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

// --- ROUGH --------------------------------------------------------------------
const ROUGH: readonly Anchor[] = [
  [20, 2.59],
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

// --- SAND (bunker) ------------------------------------------------------------
const SAND: readonly Anchor[] = [
  [20, 2.53],
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

// --- RECOVERY (trees, deep junk) ---------------------------------------------
const RECOVERY: readonly Anchor[] = [
  [100, 3.80],
  [150, 3.97],
  [200, 4.10],
  [250, 4.20],
  [300, 4.30],
];

// --- GREEN (putting) — distance in FEET --------------------------------------
const GREEN: readonly Anchor[] = [
  [1, 1.001],
  [2, 1.009],
  [3, 1.053],
  [4, 1.147],
  [5, 1.256],
  [6, 1.354],
  [7, 1.443],
  [8, 1.520],
  [9, 1.589],
  [10, 1.651],
  [15, 1.866],
  [20, 1.991],
  [25, 2.075],
  [30, 2.139],
  [40, 2.244],
  [50, 2.331],
  [60, 2.405],
  [70, 2.470],
  [80, 2.527],
  [90, 2.578],
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
  // Unreachable due to bounds check above.
  return last[1];
}

/**
 * Expected strokes to hole from a given lie + distance.
 *
 * For tee lies, `par` selects the appropriate baseline (par 3 tees use a
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
