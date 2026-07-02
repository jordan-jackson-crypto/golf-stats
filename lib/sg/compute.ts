/**
 * Strokes Gained per-shot, per-hole, per-round computation.
 *
 * Per-shot SG = baseline(start) - baseline(end) - 1
 *
 *   - For a holed shot:        baseline(end) = 0
 *   - For a penalty shot:      we model it as ending where it began (drop in
 *                              same lie/distance) but with one extra stroke
 *                              counted, so sg = baseline(start) - baseline(end) - 2.
 *                              The caller must still record any subsequent
 *                              shot taken from the drop as a normal shot.
 *
 * Categorisation (Broadie convention):
 *   - OTT  (Off-the-Tee):   tee shots on par 4 / par 5
 *   - APP  (Approach):      shots not from the tee, not within 30 yds of green,
 *                           and not putts. Par 3 tee shots are APP.
 *   - ARG  (Around-the-Green): non-putt shots starting within 30 yds of green
 *                           (fairway / rough / sand / recovery)
 *   - PUTT (Putting):       any shot from the green
 *
 * Distance unit reminder: all lies use yards EXCEPT `green` which uses feet.
 * For the 30-yard ARG threshold, putts are excluded by lie, not by distance.
 */

import { strokesToHole } from "./baselines";
import type { Lie, SGCategory, ShotInput, ShotSG } from "./types";

/** Strokes Gained for a single shot. */
export function shotSG(shot: ShotInput): ShotSG {
  const startStrokes = strokesToHole(shot.startLie, shot.startDistance, shot.par);

  let endStrokes: number;
  if (shot.holed) {
    endStrokes = 0;
  } else {
    endStrokes = strokesToHole(shot.endLie, shot.endDistance, shot.par);
  }

  const penaltyAdj = shot.penalty ? 1 : 0;
  const sg = startStrokes - endStrokes - 1 - penaltyAdj;

  return {
    sg: round3(sg),
    category: categoriseShot(shot),
  };
}

/**
 * Categorise a shot per Broadie's convention.
 * - tee on par 4/5 → OTT
 * - tee on par 3   → APP
 * - green          → PUTT
 * - other lies, ≤ 30 yards from hole → ARG
 * - other lies, > 30 yards from hole → APP
 */
export function categoriseShot(shot: ShotInput): SGCategory {
  if (shot.startLie === "green") return "PUTT";
  if (shot.startLie === "tee") {
    return shot.par === 3 ? "APP" : "OTT";
  }
  if (shot.startDistance <= 30) return "ARG";
  return "APP";
}

/** Aggregate SG over an arbitrary set of shots. */
export function totalSG(shots: ShotInput[]): {
  total: number;
  ott: number;
  app: number;
  arg: number;
  putt: number;
  perShot: ShotSG[];
} {
  const perShot = shots.map(shotSG);
  let ott = 0;
  let app = 0;
  let arg = 0;
  let putt = 0;
  for (const s of perShot) {
    if (s.category === "OTT") ott += s.sg;
    else if (s.category === "APP") app += s.sg;
    else if (s.category === "ARG") arg += s.sg;
    else putt += s.sg;
  }
  return {
    total: round3(ott + app + arg + putt),
    ott: round3(ott),
    app: round3(app),
    arg: round3(arg),
    putt: round3(putt),
    perShot,
  };
}

/**
 * Aggregate SG for a hole. Returns category sums plus the hole score
 * (number of shots, including penalty strokes).
 */
export function holeSG(shots: ShotInput[]): {
  score: number;
  total: number;
  ott: number;
  app: number;
  arg: number;
  putt: number;
  perShot: ShotSG[];
} {
  const score = shots.length + shots.filter((s) => s.penalty).length;
  return { score, ...totalSG(shots) };
}

/** Round to 3 decimal places to keep storage compact. */
function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

// Re-export for ergonomics
export type { Lie, SGCategory, ShotInput, ShotSG };
