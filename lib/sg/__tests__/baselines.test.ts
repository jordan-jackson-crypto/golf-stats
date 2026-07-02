import { describe, it, expect } from "vitest";
import { baselines, strokesToHole } from "../baselines";

describe("baselines — anchor points return published values", () => {
  it("fairway anchors match published table", () => {
    expect(baselines.fairway(100)).toBeCloseTo(2.80, 3);
    expect(baselines.fairway(150)).toBeCloseTo(2.945, 3); // interpolated between 140 (2.91) and 160 (2.98)
    expect(baselines.fairway(200)).toBeCloseTo(3.19, 3);
    expect(baselines.fairway(300)).toBeCloseTo(3.78, 3);
  });

  it("rough anchors match published table", () => {
    expect(baselines.rough(100)).toBeCloseTo(3.02, 3);
    expect(baselines.rough(200)).toBeCloseTo(3.42, 3);
  });

  it("sand anchors match published table", () => {
    expect(baselines.sand(100)).toBeCloseTo(3.10, 3);
    expect(baselines.sand(60)).toBeCloseTo(2.92, 3);
  });

  it("green (feet) anchors match published table", () => {
    expect(baselines.green(3)).toBeCloseTo(1.053, 3);
    expect(baselines.green(8)).toBeCloseTo(1.520, 3);
    expect(baselines.green(20)).toBeCloseTo(1.991, 3);
    expect(baselines.green(30)).toBeCloseTo(2.139, 3);
  });

  it("tee par-4/5 anchors match published table", () => {
    expect(baselines.teePar45(300)).toBeCloseTo(3.20, 3);
    expect(baselines.teePar45(450)).toBeCloseTo(3.51, 3);
  });

  it("tee par-3 anchors match published table", () => {
    expect(baselines.teePar3(160)).toBeCloseTo(2.95, 3);
    expect(baselines.teePar3(200)).toBeCloseTo(3.13, 3);
  });
});

describe("baselines — interpolation", () => {
  it("linearly interpolates between fairway anchors", () => {
    // 130 yards is halfway between 120 (2.85) and 140 (2.91) → 2.88
    expect(baselines.fairway(130)).toBeCloseTo(2.88, 3);
  });

  it("linearly interpolates between green anchors", () => {
    // 12.5 ft is halfway between 10 (1.651) and 15 (1.866) → 1.7585
    expect(baselines.green(12.5)).toBeCloseTo(1.7585, 3);
  });
});

describe("baselines — clamping at boundaries", () => {
  it("clamps below minimum distance to min value", () => {
    expect(baselines.fairway(0)).toBeCloseTo(2.40, 3); // min anchor is 20 yd = 2.40
    expect(baselines.green(0.5)).toBeCloseTo(1.001, 3);
  });

  it("clamps above maximum distance to max value", () => {
    expect(baselines.fairway(400)).toBeCloseTo(3.78, 3); // max anchor is 300 yd
    expect(baselines.green(120)).toBeCloseTo(2.578, 3);
  });
});

describe("strokesToHole — dispatches on lie and par", () => {
  it("uses par-3 table for tee lie on par 3", () => {
    expect(strokesToHole("tee", 160, 3)).toBeCloseTo(2.95, 3);
  });

  it("uses par-4/5 table for tee lie on par 4", () => {
    expect(strokesToHole("tee", 400, 4)).toBeCloseTo(3.39, 3);
  });

  it("uses par-4/5 table for tee lie on par 5", () => {
    expect(strokesToHole("tee", 550, 5)).toBeCloseTo(3.78, 3);
  });

  it("routes to fairway/rough/sand/recovery/green tables correctly", () => {
    expect(strokesToHole("fairway", 100)).toBeCloseTo(2.80, 3);
    expect(strokesToHole("rough", 100)).toBeCloseTo(3.02, 3);
    expect(strokesToHole("sand", 100)).toBeCloseTo(3.10, 3);
    expect(strokesToHole("recovery", 100)).toBeCloseTo(3.80, 3);
    expect(strokesToHole("green", 10)).toBeCloseTo(1.651, 3);
  });
});
