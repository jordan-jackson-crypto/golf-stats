/**
 * Tiger 5 — the five costly mistakes to eliminate.
 * Sourced from the well-known "Tiger 5" framework: the five mistake types
 * that account for the largest chunk of avoidable strokes for scratch and
 * better amateurs.
 *
 * 1. Double bogeys (or worse)
 * 2. Par-5 bogeys or worse (par 5 is the scoring hole)
 * 3. Three-putts
 * 4. Bogeys from 150 yards or in (the "should-have-been-a-par" wedge shots)
 * 5. Blown par saves — inside 8 feet for par, missed
 */

import type { StoredRound, StoredShot } from "@/lib/storage/types";

export interface Tiger5Counts {
  doubleBogeys: number;
  par5BogeysOrWorse: number;
  threePutts: number;
  bogeysFrom150OrIn: number;
  blownParSaves: number;
}

/**
 * Default per-round thresholds for a 1-handicap.
 * These are targets — hitting the count below the threshold is "good".
 */
export const TIGER5_TARGETS_ONE_HCP: Tiger5Counts = {
  doubleBogeys: 0.5, // ≤1 every other round
  par5BogeysOrWorse: 0.25,
  threePutts: 0.75,
  bogeysFrom150OrIn: 0.5,
  blownParSaves: 1,
};

export function computeTiger5(
  round: Pick<StoredRound, "parPerHole" | "holeCount">,
  shots: StoredShot[],
): Tiger5Counts {
  const shotsByHole = new Map<number, StoredShot[]>();
  for (const s of shots) {
    if (!shotsByHole.has(s.holeNumber)) shotsByHole.set(s.holeNumber, []);
    shotsByHole.get(s.holeNumber)!.push(s);
  }

  const counts: Tiger5Counts = {
    doubleBogeys: 0,
    par5BogeysOrWorse: 0,
    threePutts: 0,
    bogeysFrom150OrIn: 0,
    blownParSaves: 0,
  };

  const holeCount = round.holeCount ?? 18;
  for (let hole = 1; hole <= holeCount; hole++) {
    const par = round.parPerHole[hole - 1];
    const holeShots = (shotsByHole.get(hole) ?? []).sort((a, b) => a.shotNumber - b.shotNumber);
    if (holeShots.length === 0) continue;

    const penalties = holeShots.filter((s) => s.penalty).length;
    const score = holeShots.length + penalties;

    // 1. Double bogey (or worse)
    if (score >= par + 2) counts.doubleBogeys++;

    // 2. Par-5 bogey or worse
    if (par === 5 && score >= par + 1) counts.par5BogeysOrWorse++;

    // 3. Three-putt: 3+ shots from the green
    const putts = holeShots.filter((s) => s.startLie === "green").length;
    if (putts >= 3) counts.threePutts++;

    // 4. Bogey from 150 or in — approach began within 150 yards of green and hole was bogeyed
    if (score === par + 1) {
      const approachIn150 = holeShots.some(
        (s) => s.startLie !== "tee" && s.startLie !== "green" && s.startDistance <= 150,
      );
      if (approachIn150) counts.bogeysFrom150OrIn++;
    }

    // 5. Blown par save: had a putt inside 8 ft for par, missed
    // Detected as: shot on green from ≤ 8 ft where score-so-far == par - 1 (i.e. this putt WOULD save par)
    // and the putt was not holed (or holed but resulted in bogey after further putts).
    let strokesSoFar = 0;
    for (const s of holeShots) {
      strokesSoFar++;
      if (s.penalty) strokesSoFar++;
      const isParPutt =
        s.startLie === "green" &&
        s.startDistance <= 8 &&
        strokesSoFar === par;
      if (isParPutt && !s.holed) {
        counts.blownParSaves++;
        break;
      }
    }
  }

  return counts;
}
