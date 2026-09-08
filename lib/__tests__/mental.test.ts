import { describe, it, expect } from "vitest";
import { buildMentalLibrary } from "../mental";
import type { StoredRound } from "@/lib/storage/types";

type RoundPatch = Partial<Omit<StoredRound, "holeCount">> & { holeCount?: number };

function round(patch: RoundPatch): StoredRound {
  return {
    id: "r1",
    createdAt: 0,
    updatedAt: 0,
    date: "2026-09-01",
    courseName: "Test",
    holeCount: 3,
    totalPar: 12,
    parPerHole: [4, 4, 4],
    parConfirmedHoles: [],
    status: "complete",
    ...patch,
  } as StoredRound;
}

describe("buildMentalLibrary", () => {
  const r = round({
    holeScores: [6, 4, 5],
    unforcedErrorsByHole: [
      { mentalMistake: true, mental: { tags: ["ego", "decision"], phase: "tee", note: "driver on a 3-wood hole" } },
      {},
      { mentalMistake: true, mental: { tags: ["ego"], phase: "approach" } },
    ],
  });

  it("collects every flagged hole, newest first", () => {
    const lib = buildMentalLibrary([r]);
    expect(lib.totalFlagged).toBe(2);
    expect(lib.entries.map((e) => e.hole)).toEqual([3, 1]);
    expect(lib.perRound).toBe(2);
  });

  it("sums the strokes given away on flagged holes, and the clean-hole baseline", () => {
    const lib = buildMentalLibrary([r]);
    expect(lib.strokesOverPar).toBe(3); // +2 on hole 1, +1 on hole 3
    expect(lib.baselineToPar).toBe(0); // hole 2 was a par
  });

  it("ranks tags by the strokes they cost", () => {
    const lib = buildMentalLibrary([r]);
    expect(lib.tagStats[0].tag).toBe("ego"); // 2 holes, +3
    expect(lib.tagStats[0].count).toBe(2);
    expect(lib.tagStats[0].strokesOverPar).toBe(3);
    expect(lib.tagStats[1].tag).toBe("decision");
    expect(lib.tagStats[0].share).toBe(1); // both flagged holes carried it
  });

  it("tracks where the mistakes happen", () => {
    const lib = buildMentalLibrary([r]);
    expect(lib.phaseCounts).toEqual([
      { phase: "approach", count: 1 },
      { phase: "tee", count: 1 },
    ]);
  });

  it("keeps untagged flags in the log and counts them separately", () => {
    const lib = buildMentalLibrary([
      round({ holeScores: [5, 4, 4], unforcedErrorsByHole: [{ mentalMistake: true }, {}, {}] }),
    ]);
    expect(lib.totalFlagged).toBe(1);
    expect(lib.totalTagged).toBe(0);
    expect(lib.tagStats).toEqual([]);
  });

  it("ignores holes with no score when computing the clean-hole baseline", () => {
    const lib = buildMentalLibrary([round({ holeScores: [0, 0, 0], unforcedErrorsByHole: [] })]);
    expect(lib.baselineToPar).toBeNull();
  });
});
