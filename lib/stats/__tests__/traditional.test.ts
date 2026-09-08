import { describe, it, expect } from "vitest";
import { deriveFromShots, roundTotals, withRates } from "../traditional";
import type { StoredRound, StoredShot } from "@/lib/storage/types";
import type { Lie } from "@/lib/sg/types";

let n = 0;
function shot(p: Partial<StoredShot> & { holeNumber: number; startLie: Lie; endLie: Lie }): StoredShot {
  return {
    id: `s${n++}`,
    shotNumber: p.shotNumber ?? 1,
    startDistance: p.startDistance ?? 400,
    endDistance: p.endDistance ?? 0,
    penalty: p.penalty ?? false,
    holed: p.holed ?? false,
    ...p,
  } as StoredShot;
}

/** Par 4: tee → fairway → green in 2, two putts. */
function textbookPar(hole = 1): StoredShot[] {
  return [
    shot({ holeNumber: hole, shotNumber: 1, startLie: "tee", endLie: "fairway", startDistance: 400, endDistance: 150 }),
    shot({ holeNumber: hole, shotNumber: 2, startLie: "fairway", endLie: "green", startDistance: 150, endDistance: 20 }),
    shot({ holeNumber: hole, shotNumber: 3, startLie: "green", endLie: "green", startDistance: 20, endDistance: 2 }),
    shot({ holeNumber: hole, shotNumber: 4, startLie: "green", endLie: "green", startDistance: 2, endDistance: 0, holed: true }),
  ];
}

describe("deriveFromShots", () => {
  it("reads fairway, GIR and putts off a textbook par", () => {
    expect(deriveFromShots(textbookPar(), 4)).toEqual({ fairway: "hit", gir: true, putts: 2 });
  });

  it("attributes a tee-shot miss to the recorded side", () => {
    const shots = [
      shot({ holeNumber: 1, shotNumber: 1, startLie: "tee", endLie: "rough", missDirection: "left" }),
      shot({ holeNumber: 1, shotNumber: 2, startLie: "rough", endLie: "green", holed: false }),
      shot({ holeNumber: 1, shotNumber: 3, startLie: "green", endLie: "green", holed: true }),
    ];
    expect(deriveFromShots(shots, 4).fairway).toBe("left");
  });

  it("records a miss with no side as a plain miss", () => {
    const shots = [shot({ holeNumber: 1, shotNumber: 1, startLie: "tee", endLie: "rough" })];
    expect(deriveFromShots(shots, 4).fairway).toBe("miss");
  });

  it("does not count a fairway on a par 3", () => {
    const shots = [shot({ holeNumber: 1, shotNumber: 1, startLie: "tee", endLie: "green", startDistance: 160 })];
    expect(deriveFromShots(shots, 3).fairway).toBeUndefined();
  });

  it("counts a penalty stroke against reaching the green in regulation", () => {
    const shots = [
      shot({ holeNumber: 1, shotNumber: 1, startLie: "tee", endLie: "rough", penalty: true }),
      shot({ holeNumber: 1, shotNumber: 2, startLie: "rough", endLie: "green", endDistance: 15 }),
      shot({ holeNumber: 1, shotNumber: 3, startLie: "green", endLie: "green", holed: true }),
    ];
    // Two strokes played + 1 penalty = on the green in 3 on a par 4 → not GIR.
    expect(deriveFromShots(shots, 4).gir).toBe(false);
  });

  it("treats a chip-in as reaching the green, with zero putts", () => {
    const shots = [
      shot({ holeNumber: 1, shotNumber: 1, startLie: "tee", endLie: "fairway" }),
      shot({ holeNumber: 1, shotNumber: 2, startLie: "fairway", endLie: "rough", endDistance: 20 }),
      shot({ holeNumber: 1, shotNumber: 3, startLie: "rough", endLie: "green", holed: true }),
    ];
    expect(deriveFromShots(shots, 4)).toEqual({ fairway: "hit", gir: false, putts: 0 });
  });

  it("won't guess a putt count on a half-entered hole", () => {
    const shots = [shot({ holeNumber: 1, shotNumber: 1, startLie: "tee", endLie: "fairway" })];
    expect(deriveFromShots(shots, 4).putts).toBeUndefined();
  });
});

type RoundPatch = Partial<Omit<StoredRound, "holeCount">> & { holeCount?: number };

function round(patch: RoundPatch): StoredRound {
  return {
    id: "r1",
    createdAt: 0,
    updatedAt: 0,
    date: "2026-09-01",
    courseName: "Test",
    holeCount: 18,
    totalPar: 72,
    parPerHole: Array(18).fill(4),
    parConfirmedHoles: [],
    status: "complete",
    ...patch,
  } as StoredRound;
}

describe("roundTotals", () => {
  it("works from tapped-in hole stats with no shot detail", () => {
    const r = round({
      holeCount: 2,
      holeScores: [4, 5],
      holeStatsByHole: [
        { fairway: "hit", gir: true, putts: 2 },
        { fairway: "right", gir: false, putts: 3 },
      ],
    });
    const t = withRates(roundTotals(r, []));
    expect(t.firPct).toBe(0.5);
    expect(t.girPct).toBe(0.5);
    expect(t.putts).toBe(5);
    expect(t.threePutts).toBe(1);
    expect(t.missRight).toBe(1);
    // Missed the green and made bogey — a scrambling opportunity, not a save.
    expect(t.scrambleOpps).toBe(1);
    expect(t.scrambleSaves).toBe(0);
  });

  it("counts an up-and-down as a scrambling save", () => {
    const r = round({
      holeCount: 1,
      holeScores: [4],
      holeStatsByHole: [{ gir: false, putts: 1 }],
    });
    const t = roundTotals(r, []);
    expect(t.scrambleOpps).toBe(1);
    expect(t.scrambleSaves).toBe(1);
  });

  it("prefers an explicit entry over the value implied by shot detail", () => {
    const r = round({
      holeCount: 1,
      holeScores: [4],
      holeStatsByHole: [{ fairway: "left" }],
    });
    const t = roundTotals(r, textbookPar()); // shots say the fairway was hit
    expect(t.fairwaysHit).toBe(0);
    expect(t.missLeft).toBe(1);
    // …while the untouched fields still come from the shots.
    expect(t.girHit).toBe(1);
    expect(t.putts).toBe(2);
  });

  it("normalises putts to 18 holes", () => {
    const r = round({
      holeCount: 9,
      parPerHole: Array(9).fill(4),
      holeScores: Array(9).fill(4),
      holeStatsByHole: Array(9).fill({ gir: true, putts: 2 }),
    });
    expect(withRates(roundTotals(r, [])).puttsPer18).toBe(36);
  });
});
