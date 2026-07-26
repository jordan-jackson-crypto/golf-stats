import { describe, it, expect } from "vitest";
import { baselines, strokesToHole } from "../baselines";

describe("baselines — anchor points match published Broadie values", () => {
  it("fairway anchors", () => {
    expect(baselines.fairway(100)).toBeCloseTo(2.80, 3);
    expect(baselines.fairway(150)).toBeCloseTo(2.945, 3); // interp between 140 (2.91) & 160 (2.98)
    expect(baselines.fairway(200)).toBeCloseTo(3.19, 3);
    expect(baselines.fairway(300)).toBeCloseTo(3.78, 3);
  });

  it("rough anchors", () => {
    expect(baselines.rough(100)).toBeCloseTo(3.02, 3);
    expect(baselines.rough(200)).toBeCloseTo(3.42, 3);
  });

  it("sand anchors", () => {
    expect(baselines.sand(100)).toBeCloseTo(3.10, 3);
    expect(baselines.sand(60)).toBeCloseTo(2.92, 3);
  });

  it("green (feet) anchors", () => {
    expect(baselines.green(3)).toBeCloseTo(1.055, 3);
    expect(baselines.green(8)).toBeCloseTo(1.457, 3);
    expect(baselines.green(20)).toBeCloseTo(1.837, 3);
    expect(baselines.green(30)).toBeCloseTo(1.993, 3);
  });

  it("tee par-4/5 anchors — realistic tour scoring", () => {
    // Sanity: a 400y par 4 tee shot should give ~3.97 expected strokes,
    // reflecting tour averages of ~4.0 on medium par 4s.
    expect(baselines.teePar45(400)).toBeCloseTo(3.97, 3);
    expect(baselines.teePar45(300)).toBeCloseTo(3.79, 3);
    expect(baselines.teePar45(500)).toBeCloseTo(4.31, 3);
    expect(baselines.teePar45(550)).toBeCloseTo(4.51, 3);
  });

  it("tee par-3 anchors", () => {
    expect(baselines.teePar3(160)).toBeCloseTo(2.92, 3);
    expect(baselines.teePar3(200)).toBeCloseTo(3.06, 3);
  });
});

describe("baselines — sanity checks against tour reality", () => {
  it("400y par 4 tee expects near-par scoring (not near-birdie)", () => {
    // A tour pro shouldn't be expected to birdie every 400y par 4.
    // Expected strokes must be between par (4.0) - 0.1 and par + 0.1.
    const es = baselines.teePar45(400);
    expect(es).toBeGreaterThan(3.85);
    expect(es).toBeLessThan(4.05);
  });

  it("550y par 5 tee expects between-birdie-and-par scoring", () => {
    // Tour pros birdie ~40% of medium par 5s, so EX should be ~4.5.
    const es = baselines.teePar45(550);
    expect(es).toBeGreaterThan(4.35);
    expect(es).toBeLessThan(4.65);
  });

  it("10-foot putt make rate ≈ 40% (baseline ≈ 1.55)", () => {
    // 40% make → 60% two-putt → expected ≈ 0.4*1 + 0.6*2 = 1.6.
    // With some 3-putts subtracted, actual is ~1.55.
    const es = baselines.green(10);
    expect(es).toBeGreaterThan(1.50);
    expect(es).toBeLessThan(1.60);
  });
});

describe("baselines — interpolation", () => {
  it("linearly interpolates between fairway anchors", () => {
    // 130 yards is halfway between 120 (2.85) and 140 (2.91) → 2.88
    expect(baselines.fairway(130)).toBeCloseTo(2.88, 3);
  });

  it("linearly interpolates between green anchors", () => {
    // 13 ft is between 12 (1.628) and 15 (1.727)
    // 1/3 of the way → 1.628 + (1/3)*(1.727-1.628) = 1.661
    expect(baselines.green(13)).toBeCloseTo(1.661, 3);
  });
});

describe("baselines — clamping at boundaries", () => {
  it("clamps below minimum distance to min value", () => {
    expect(baselines.fairway(0)).toBeCloseTo(2.18, 3); // min anchor is 10 yd
    expect(baselines.green(0.5)).toBeCloseTo(1.001, 3);
  });

  it("clamps above maximum distance to max value", () => {
    expect(baselines.fairway(400)).toBeCloseTo(3.78, 3); // max anchor is 300
    expect(baselines.green(120)).toBeCloseTo(2.400, 3);
  });
});

describe("strokesToHole — dispatch", () => {
  it("uses par-3 table for tee lie on par 3", () => {
    expect(strokesToHole("tee", 160, 3)).toBeCloseTo(2.92, 3);
  });

  it("uses par-4/5 table for tee lie on par 4", () => {
    expect(strokesToHole("tee", 400, 4)).toBeCloseTo(3.97, 3);
  });

  it("uses par-4/5 table for tee lie on par 5", () => {
    expect(strokesToHole("tee", 550, 5)).toBeCloseTo(4.51, 3);
  });

  it("routes to correct tables for other lies", () => {
    expect(strokesToHole("fairway", 100)).toBeCloseTo(2.80, 3);
    expect(strokesToHole("rough", 100)).toBeCloseTo(3.02, 3);
    expect(strokesToHole("sand", 100)).toBeCloseTo(3.10, 3);
    expect(strokesToHole("recovery", 100)).toBeCloseTo(3.80, 3);
    expect(strokesToHole("green", 10)).toBeCloseTo(1.556, 3);
  });
});
