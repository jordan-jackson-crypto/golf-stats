import { describe, it, expect } from "vitest";
import { shotSG, categoriseShot, totalSG, holeSG } from "../compute";
import { baselines } from "../baselines";
import type { ShotInput } from "../types";

/**
 * Ground-truth SG for a single shot from the baseline tables:
 *   sg = baseline(start) - baseline(end) - 1 - (penalty ? 1 : 0)
 *   (baseline(end) = 0 if the shot was holed)
 *
 * These tests compute expected values inline from the baseline module so
 * that if a baseline value is later corrected, the expected SG updates too.
 * The intent under test is the *formula and dispatch*, not the specific
 * baseline numbers (those are covered in baselines.test.ts).
 */

describe("categoriseShot — Broadie convention", () => {
  it("par 4 tee shot is OTT", () => {
    expect(categoriseShot(mk({ startLie: "tee", startDistance: 420, par: 4 }))).toBe("OTT");
  });

  it("par 5 tee shot is OTT", () => {
    expect(categoriseShot(mk({ startLie: "tee", startDistance: 540, par: 5 }))).toBe("OTT");
  });

  it("par 3 tee shot is APP (not OTT)", () => {
    expect(categoriseShot(mk({ startLie: "tee", startDistance: 175, par: 3 }))).toBe("APP");
  });

  it("green shot is PUTT regardless of distance", () => {
    expect(categoriseShot(mk({ startLie: "green", startDistance: 3, par: 4 }))).toBe("PUTT");
    expect(categoriseShot(mk({ startLie: "green", startDistance: 60, par: 4 }))).toBe("PUTT");
  });

  it("non-tee, non-green shot > 30 yards is APP", () => {
    expect(categoriseShot(mk({ startLie: "fairway", startDistance: 150, par: 4 }))).toBe("APP");
    expect(categoriseShot(mk({ startLie: "rough", startDistance: 45, par: 4 }))).toBe("APP");
  });

  it("non-tee, non-green shot ≤ 30 yards is ARG", () => {
    expect(categoriseShot(mk({ startLie: "fairway", startDistance: 25, par: 4 }))).toBe("ARG");
    expect(categoriseShot(mk({ startLie: "sand", startDistance: 20, par: 4 }))).toBe("ARG");
    expect(categoriseShot(mk({ startLie: "rough", startDistance: 30, par: 4 }))).toBe("ARG");
  });
});

describe("shotSG — per-shot formula", () => {
  it("tee shot to fairway: sg = tee_baseline - fairway_baseline - 1", () => {
    // 420-yard par 4, drive to fairway 150 yards out
    const shot = mk({
      startLie: "tee", startDistance: 420, par: 4,
      endLie: "fairway", endDistance: 150,
    });
    const expected = baselines.teePar45(420) - baselines.fairway(150) - 1;
    expect(shotSG(shot).sg).toBeCloseTo(round3(expected), 3);
    expect(shotSG(shot).category).toBe("OTT");
  });

  it("approach shot from fairway to green: uses yards → feet conversion via caller", () => {
    // Fairway from 150 → green at 20 ft (caller responsible for unit)
    const shot = mk({
      startLie: "fairway", startDistance: 150, par: 4,
      endLie: "green", endDistance: 20,
    });
    const expected = baselines.fairway(150) - baselines.green(20) - 1;
    expect(shotSG(shot).sg).toBeCloseTo(round3(expected), 3);
    expect(shotSG(shot).category).toBe("APP");
  });

  it("holed putt: end baseline is 0", () => {
    // 8-foot putt made
    const shot = mk({
      startLie: "green", startDistance: 8, par: 4,
      endLie: "green", endDistance: 0, holed: true,
    });
    const expected = baselines.green(8) - 0 - 1;
    expect(shotSG(shot).sg).toBeCloseTo(round3(expected), 3);
    expect(shotSG(shot).category).toBe("PUTT");
  });

  it("holed approach (hole-out from fairway): end baseline is 0", () => {
    const shot = mk({
      startLie: "fairway", startDistance: 120, par: 4,
      endLie: "green", endDistance: 0, holed: true,
    });
    const expected = baselines.fairway(120) - 0 - 1;
    expect(shotSG(shot).sg).toBeCloseTo(round3(expected), 3);
  });

  it("penalty shot: subtracts an additional stroke", () => {
    // Tee shot OB, dropped where it went out (same distance, tee lie)
    const shot = mk({
      startLie: "tee", startDistance: 420, par: 4,
      endLie: "tee", endDistance: 420, penalty: true,
    });
    const expected = baselines.teePar45(420) - baselines.teePar45(420) - 1 - 1;
    expect(shotSG(shot).sg).toBeCloseTo(round3(expected), 3);
    expect(shotSG(shot).sg).toBeCloseTo(-2, 3); // start=end, sg = -2 for penalty
  });

  it("tap-in 1-footer has near-zero SG (baseline ≈ 1)", () => {
    const shot = mk({
      startLie: "green", startDistance: 1, par: 4,
      endLie: "green", endDistance: 0, holed: true,
    });
    // baseline(1 ft) = 1.001 → sg = 1.001 - 0 - 1 = 0.001
    expect(shotSG(shot).sg).toBeCloseTo(0.001, 3);
  });

  it("3-putt from 30 ft loses SG on the second putt", () => {
    // First putt from 30 ft to 6 ft: baseline 2.139 → 1.354, sg = 2.139 - 1.354 - 1 = -0.215
    const putt1 = mk({
      startLie: "green", startDistance: 30, par: 4,
      endLie: "green", endDistance: 6,
    });
    expect(shotSG(putt1).sg).toBeCloseTo(round3(baselines.green(30) - baselines.green(6) - 1), 3);
    // Second putt from 6 ft missed to 2 ft: baseline 1.354 → 1.009, sg = -0.655
    const putt2 = mk({
      startLie: "green", startDistance: 6, par: 4,
      endLie: "green", endDistance: 2,
    });
    expect(shotSG(putt2).sg).toBeCloseTo(round3(baselines.green(6) - baselines.green(2) - 1), 3);
    expect(shotSG(putt2).sg).toBeLessThan(0); // 3-putt-in-progress → clearly losing shots
  });
});

describe("holeSG — aggregate across a full hole", () => {
  it("par-4 played to par: drive → fairway 150 → green 20 ft → 2-putt", () => {
    const shots: ShotInput[] = [
      mk({ startLie: "tee", startDistance: 420, par: 4, endLie: "fairway", endDistance: 150 }),
      mk({ startLie: "fairway", startDistance: 150, par: 4, endLie: "green", endDistance: 20 }),
      mk({ startLie: "green", startDistance: 20, par: 4, endLie: "green", endDistance: 2 }),
      mk({ startLie: "green", startDistance: 2, par: 4, endLie: "green", endDistance: 0, holed: true }),
    ];
    const result = holeSG(shots);
    expect(result.score).toBe(4);
    // Telescoping sum: sum of (baseline(start_i) - baseline(end_i)) - n_shots
    // = baseline(start_0) - baseline(end_last) - n_shots
    // = teePar45(420) - 0 - 4
    const expectedTotal = round3(baselines.teePar45(420) - 4);
    expect(result.total).toBeCloseTo(expectedTotal, 3);
    // Broadie: 420y par 4 tee expects ~3.99 strokes. Making par is essentially
    // tour-average → SG total ≈ 0 (small negative around -0.01).
    expect(result.total).toBeGreaterThan(-0.15);
    expect(result.total).toBeLessThan(0.05);
  });

  it("par-4 birdied with a chip-in from 20 yards", () => {
    const shots: ShotInput[] = [
      mk({ startLie: "tee", startDistance: 420, par: 4, endLie: "fairway", endDistance: 150 }),
      mk({ startLie: "fairway", startDistance: 150, par: 4, endLie: "rough", endDistance: 20 }),
      mk({ startLie: "rough", startDistance: 20, par: 4, endLie: "green", endDistance: 0, holed: true }),
    ];
    const result = holeSG(shots);
    expect(result.score).toBe(3);
    // Telescoping again: teePar45(420) - 0 - 3
    const expectedTotal = round3(baselines.teePar45(420) - 3);
    expect(result.total).toBeCloseTo(expectedTotal, 3);
    expect(result.total).toBeGreaterThan(0); // birdie on a 420 par 4 gains shots
  });

  it("par-4 double bogey: drive OB, then bogey path", () => {
    // Shot 1: tee OB (penalty). Shot 2: re-tee to fairway. Shot 3: fairway to green. Shot 4-5: 2-putt.
    const shots: ShotInput[] = [
      mk({ startLie: "tee", startDistance: 420, par: 4, endLie: "tee", endDistance: 420, penalty: true }),
      mk({ startLie: "tee", startDistance: 420, par: 4, endLie: "fairway", endDistance: 150 }),
      mk({ startLie: "fairway", startDistance: 150, par: 4, endLie: "green", endDistance: 20 }),
      mk({ startLie: "green", startDistance: 20, par: 4, endLie: "green", endDistance: 2 }),
      mk({ startLie: "green", startDistance: 2, par: 4, endLie: "green", endDistance: 0, holed: true }),
    ];
    const result = holeSG(shots);
    // Score = 5 shots taken + 1 penalty = 6 strokes
    expect(result.score).toBe(6);
    expect(result.total).toBeLessThan(-1); // double bogey on a par 4 loses ≥ 1 shot vs tour avg
  });

  it("splits SG into OTT / APP / ARG / PUTT correctly", () => {
    const shots: ShotInput[] = [
      // OTT
      mk({ startLie: "tee", startDistance: 420, par: 4, endLie: "fairway", endDistance: 150 }),
      // APP
      mk({ startLie: "fairway", startDistance: 150, par: 4, endLie: "green", endDistance: 20 }),
      // PUTT
      mk({ startLie: "green", startDistance: 20, par: 4, endLie: "green", endDistance: 2 }),
      // PUTT
      mk({ startLie: "green", startDistance: 2, par: 4, endLie: "green", endDistance: 0, holed: true }),
    ];
    const result = holeSG(shots);
    expect(result.ott).not.toBe(0);
    expect(result.app).not.toBe(0);
    expect(result.putt).not.toBe(0);
    expect(result.arg).toBe(0);
    expect(round3(result.ott + result.app + result.arg + result.putt)).toBeCloseTo(result.total, 3);
  });
});

describe("totalSG — round-level aggregation", () => {
  it("sums SG across multiple holes", () => {
    const holeAShots: ShotInput[] = [
      mk({ startLie: "tee", startDistance: 420, par: 4, endLie: "fairway", endDistance: 150 }),
      mk({ startLie: "fairway", startDistance: 150, par: 4, endLie: "green", endDistance: 20 }),
      mk({ startLie: "green", startDistance: 20, par: 4, endLie: "green", endDistance: 2 }),
      mk({ startLie: "green", startDistance: 2, par: 4, endLie: "green", endDistance: 0, holed: true }),
    ];
    const holeBShots: ShotInput[] = [
      mk({ startLie: "tee", startDistance: 175, par: 3, endLie: "green", endDistance: 15 }),
      mk({ startLie: "green", startDistance: 15, par: 3, endLie: "green", endDistance: 3 }),
      mk({ startLie: "green", startDistance: 3, par: 3, endLie: "green", endDistance: 0, holed: true }),
    ];
    const allShots = [...holeAShots, ...holeBShots];
    const round = totalSG(allShots);
    const holeA = holeSG(holeAShots);
    const holeB = holeSG(holeBShots);
    expect(round.total).toBeCloseTo(round3(holeA.total + holeB.total), 3);
    expect(round.ott).toBeCloseTo(round3(holeA.ott + holeB.ott), 3);
    expect(round.app).toBeCloseTo(round3(holeA.app + holeB.app), 3);
    expect(round.putt).toBeCloseTo(round3(holeA.putt + holeB.putt), 3);
  });
});

// ------- helpers -------

function mk(partial: Partial<ShotInput> & Pick<ShotInput, "startLie" | "startDistance" | "par">): ShotInput {
  return {
    endLie: "green",
    endDistance: 0,
    holed: false,
    penalty: false,
    ...partial,
  } as ShotInput;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}
