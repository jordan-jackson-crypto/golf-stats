/**
 * Compute the full SG + Tiger 5 summary for a round from its shots.
 * Shared by the entry flow (on finish) and the "recompute all" maintenance
 * action so both use identical logic and the current baselines.
 */

import type { StoredRound, StoredShot } from "@/lib/storage/types";
import { scoreShots } from "./scoreDraft";
import { totalSG } from "@/lib/sg/compute";
import { computeTiger5 } from "@/lib/tiger5";

export function finalizeRound(round: StoredRound, shots: StoredShot[]): StoredRound {
  const holeCount = round.holeCount ?? 18;
  const parPerHole = round.parPerHole ?? Array(holeCount).fill(4);
  const scored = scoreShots(shots, parPerHole);

  const sg = totalSG(
    scored.map((s) => ({
      startLie: s.startLie,
      startDistance: s.startDistance,
      endLie: s.endLie,
      endDistance: s.endDistance,
      holed: s.holed,
      penalty: s.penalty,
      par: (parPerHole[s.holeNumber - 1] ?? 4) as 3 | 4 | 5,
    })),
  );

  // Prefer explicit per-hole scores; fall back to shot count if absent.
  const holeScores = round.holeScores ?? [];
  const totalScore =
    holeScores.length > 0
      ? holeScores.slice(0, holeCount).reduce((a, b) => a + (b || 0), 0)
      : scored.length + scored.filter((s) => s.penalty).length;

  const tiger5 = computeTiger5(round, scored);

  return {
    ...round,
    totalScore,
    sgTotal: sg.total,
    sgOTT: sg.ott,
    sgAPP: sg.app,
    sgARG: sg.arg,
    sgPUTT: sg.putt,
    tiger5,
  };
}
