/**
 * Traditional ("vanilla") stats — fairways, greens, putts, scrambling.
 *
 * SG tells you how much a shot was worth; these tell you what actually
 * happened, in the language every other golf stat site speaks. They are also
 * the only numbers you can capture without logging shot detail, so they work
 * on the days you just tap in a score.
 *
 * Source of truth per hole:
 *   1. Explicit entry (`round.holeStatsByHole`) — what you tapped on the hole.
 *   2. Derived from shot detail, when shots were logged and nothing explicit
 *      was entered.
 * Explicit always wins, so correcting a value by hand sticks.
 */

import type { StoredRound, StoredShot, HoleStats, FairwayResult } from "@/lib/storage/types";

export interface TraditionalTotals {
  rounds: number;
  holes: number; // holes with a score entered
  fairwayOpps: number; // par 4/5 holes with a fairway result
  fairwaysHit: number;
  missLeft: number;
  missRight: number;
  girHoles: number; // holes with a green result
  girHit: number;
  puttHoles: number; // holes with a putt count
  putts: number;
  threePutts: number;
  onePutts: number;
  girPuttHoles: number;
  girPutts: number;
  scrambleOpps: number; // missed green, with a score
  scrambleSaves: number; // …and still made par or better
}

export interface TraditionalStats extends TraditionalTotals {
  firPct: number | null;
  girPct: number | null;
  puttsPer18: number | null;
  puttsPerGIR: number | null;
  threePuttPct: number | null;
  onePuttPct: number | null;
  scramblingPct: number | null;
}

const EMPTY: TraditionalTotals = {
  rounds: 0, holes: 0,
  fairwayOpps: 0, fairwaysHit: 0, missLeft: 0, missRight: 0,
  girHoles: 0, girHit: 0,
  puttHoles: 0, putts: 0, threePutts: 0, onePutts: 0,
  girPuttHoles: 0, girPutts: 0,
  scrambleOpps: 0, scrambleSaves: 0,
};

/**
 * What we know about one hole, after merging explicit entry with shot detail.
 */
export function resolveHoleStats(
  explicit: HoleStats | undefined,
  holeShots: StoredShot[],
  par: number,
): HoleStats {
  const derived = holeShots.length > 0 ? deriveFromShots(holeShots, par) : {};
  return {
    fairway: explicit?.fairway ?? derived.fairway,
    gir: explicit?.gir ?? derived.gir,
    putts: explicit?.putts ?? derived.putts,
  };
}

/** Fairway / green / putts implied by a hole's logged shots. */
export function deriveFromShots(holeShots: StoredShot[], par: number): HoleStats {
  const shots = [...holeShots].sort((a, b) => a.shotNumber - b.shotNumber);
  if (shots.length === 0) return {};

  // Fairway — par 4/5 only, from where the tee shot finished.
  let fairway: FairwayResult | undefined;
  if (par >= 4) {
    const tee = shots[0];
    if (tee.endLie === "fairway" && !tee.penalty) fairway = "hit";
    else if (tee.missDirection === "left") fairway = "left";
    else if (tee.missDirection === "right") fairway = "right";
    else fairway = "miss"; // missed, side not recorded
  }

  // Putts — shots played from the green.
  const putts = shots.filter((s) => s.startLie === "green").length;

  // Green in regulation — on the putting surface in (par − 2) strokes or fewer,
  // counting penalty strokes. Holing out from off the green counts as reaching it.
  let strokes = 0;
  let strokesToGreen: number | null = null;
  for (const s of shots) {
    strokes += 1 + (s.penalty ? 1 : 0);
    if (s.startLie === "green") break; // already on the green before this stroke
    if (s.endLie === "green" || s.holed) {
      strokesToGreen = strokes;
      break;
    }
  }
  const gir = strokesToGreen != null ? strokesToGreen <= par - 2 : undefined;

  // Only trust a putt count when the hole was actually holed out (a chip-in is
  // a legitimate zero; a half-entered hole is not).
  const holedOut = shots[shots.length - 1]?.holed === true;
  return { fairway, gir, putts: holedOut ? putts : putts > 0 ? putts : undefined };
}

export function roundTotals(round: StoredRound, shots: StoredShot[]): TraditionalTotals {
  const t: TraditionalTotals = { ...EMPTY, rounds: 1 };
  const holeCount = round.holeCount ?? 18;
  const pars = round.parPerHole ?? [];
  const scores = round.holeScores ?? [];
  const explicit = round.holeStatsByHole ?? [];

  const byHole = new Map<number, StoredShot[]>();
  for (const s of shots) {
    if (!byHole.has(s.holeNumber)) byHole.set(s.holeNumber, []);
    byHole.get(s.holeNumber)!.push(s);
  }

  for (let i = 0; i < holeCount; i++) {
    const hole = i + 1;
    const par = pars[i] ?? 4;
    const holeShots = byHole.get(hole) ?? [];
    const score = scores[i] || (holeShots.length ? holeShots.length + holeShots.filter((s) => s.penalty).length : 0);
    const st = resolveHoleStats(explicit[i], holeShots, par);
    const anyData = st.fairway != null || st.gir != null || st.putts != null;
    if (!score && !anyData) continue;
    if (score) t.holes++;

    if (par >= 4 && st.fairway) {
      t.fairwayOpps++;
      if (st.fairway === "hit") t.fairwaysHit++;
      else if (st.fairway === "left") t.missLeft++;
      else if (st.fairway === "right") t.missRight++;
    }

    if (st.gir != null) {
      t.girHoles++;
      if (st.gir) t.girHit++;
      if (st.putts != null) {
        if (st.gir) { t.girPuttHoles++; t.girPutts += st.putts; }
      }
      // Scrambling — missed the green in regulation but still made par or better.
      if (!st.gir && score) {
        t.scrambleOpps++;
        if (score <= par) t.scrambleSaves++;
      }
    }

    if (st.putts != null) {
      t.puttHoles++;
      t.putts += st.putts;
      if (st.putts >= 3) t.threePutts++;
      if (st.putts === 1) t.onePutts++;
    }
  }

  return t;
}

export function aggregateTraditional(
  rounds: StoredRound[],
  shots: (StoredShot & { roundId: string })[],
): TraditionalStats {
  const shotsByRound = new Map<string, StoredShot[]>();
  for (const s of shots) {
    if (!shotsByRound.has(s.roundId)) shotsByRound.set(s.roundId, []);
    shotsByRound.get(s.roundId)!.push(s);
  }

  const sum = { ...EMPTY };
  for (const r of rounds) {
    const t = roundTotals(r, shotsByRound.get(r.id) ?? []);
    for (const k of Object.keys(sum) as (keyof TraditionalTotals)[]) sum[k] += t[k];
  }

  return withRates(sum);
}

export function withRates(t: TraditionalTotals): TraditionalStats {
  return {
    ...t,
    firPct: t.fairwayOpps ? t.fairwaysHit / t.fairwayOpps : null,
    girPct: t.girHoles ? t.girHit / t.girHoles : null,
    // Normalised to 18 holes so 9-hole rounds don't drag the average down.
    puttsPer18: t.puttHoles ? (t.putts / t.puttHoles) * 18 : null,
    puttsPerGIR: t.girPuttHoles ? t.girPutts / t.girPuttHoles : null,
    threePuttPct: t.puttHoles ? t.threePutts / t.puttHoles : null,
    onePuttPct: t.puttHoles ? t.onePutts / t.puttHoles : null,
    scramblingPct: t.scrambleOpps ? t.scrambleSaves / t.scrambleOpps : null,
  };
}
