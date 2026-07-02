import type { StoredShot } from "@/lib/storage/types";
import { shotSG } from "@/lib/sg/compute";
import type { ShotInput } from "@/lib/sg/types";

/** Attach SG to a shot given the hole's par. */
export function scoreShot(shot: StoredShot, par: 3 | 4 | 5): StoredShot {
  const input: ShotInput = {
    startLie: shot.startLie,
    startDistance: shot.startDistance,
    endLie: shot.endLie,
    endDistance: shot.endDistance,
    holed: shot.holed,
    penalty: shot.penalty,
    par,
  };
  const { sg, category } = shotSG(input);
  return { ...shot, sg, sgCategory: category };
}

export function scoreShots(shots: StoredShot[], parPerHole: number[]): StoredShot[] {
  return shots.map((s) => scoreShot(s, parPerHole[s.holeNumber - 1] as 3 | 4 | 5));
}
