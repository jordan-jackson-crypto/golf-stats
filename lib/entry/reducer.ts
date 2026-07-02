/**
 * State reducer for the round-entry screen. Keeps the entry engine
 * decoupled from React so it can be unit-tested and reasoned about
 * independently of the UI.
 */

import type { Lie } from "@/lib/sg/types";
import type { StoredShot, MissDirection, PenaltyType } from "@/lib/storage/types";

export interface EntryState {
  currentHole: number; // 1..18
  shots: StoredShot[]; // all shots recorded so far (across all holes)
  /** In-progress next shot. */
  draft: DraftShot;
}

export interface DraftShot {
  startLie: Lie;
  startDistance: number; // 0 = unset
  endLie: Lie | null;
  endDistanceStr: string; // string while typing
  missDirection?: MissDirection;
  penalty: boolean;
  penaltyType?: PenaltyType;
  holed: boolean;
  club?: string;
}

export type EntryAction =
  | { type: "hydrate"; state: EntryState }
  | { type: "set-end-lie"; lie: Lie }
  | { type: "set-end-distance-str"; value: string }
  | { type: "toggle-penalty" }
  | { type: "set-penalty-type"; value: PenaltyType }
  | { type: "toggle-holed" }
  | { type: "set-direction"; value: MissDirection }
  | { type: "set-club"; value: string | undefined }
  | { type: "commit-shot"; id: string }
  | { type: "undo" }
  | { type: "next-hole" }
  | { type: "prev-hole" }
  | { type: "edit-start-lie"; lie: Lie }
  | { type: "edit-start-distance"; value: number };

/** Initial state for a fresh round or resumed draft. */
export function initEntryState(
  existingShots: StoredShot[],
  parPerHole: number[],
): EntryState {
  // Determine current hole: last incomplete hole, or the hole after the last holed shot.
  const currentHole = determineCurrentHole(existingShots, parPerHole);
  const draft = buildInitialDraft(existingShots, parPerHole, currentHole);
  return { currentHole, shots: existingShots, draft };
}

export function entryReducer(state: EntryState, action: EntryAction): EntryState {
  switch (action.type) {
    case "hydrate":
      return action.state;
    case "set-end-lie":
      return {
        ...state,
        draft: {
          ...state.draft,
          endLie: action.lie,
          holed: action.lie === "green" && state.draft.holed ? state.draft.holed : false,
        },
      };
    case "set-end-distance-str":
      return { ...state, draft: { ...state.draft, endDistanceStr: action.value } };
    case "toggle-penalty":
      return {
        ...state,
        draft: {
          ...state.draft,
          penalty: !state.draft.penalty,
          penaltyType: !state.draft.penalty ? (state.draft.penaltyType ?? "hazard") : undefined,
        },
      };
    case "set-penalty-type":
      return { ...state, draft: { ...state.draft, penalty: true, penaltyType: action.value } };
    case "set-direction":
      return { ...state, draft: { ...state.draft, missDirection: action.value } };
    case "set-club":
      return { ...state, draft: { ...state.draft, club: action.value } };
    case "toggle-holed":
      return {
        ...state,
        draft: {
          ...state.draft,
          holed: !state.draft.holed,
          endDistanceStr: !state.draft.holed ? "0" : state.draft.endDistanceStr,
        },
      };
    case "commit-shot": {
      const shot = commitDraft(state, action.id);
      if (!shot) return state;
      const shots = [...state.shots, shot];
      // If holed → auto-advance to next hole
      if (shot.holed) {
        const nextHole = Math.min(18, state.currentHole + 1);
        return {
          currentHole: nextHole,
          shots,
          draft: buildInitialDraft(shots, [], nextHole),
        };
      }
      // Otherwise, next shot pre-fills from this shot's end
      return {
        ...state,
        shots,
        draft: {
          startLie: shot.endLie,
          startDistance: shot.endDistance,
          endLie: null,
          endDistanceStr: "",
          missDirection: undefined,
          penalty: false,
          penaltyType: undefined,
          holed: false,
          club: undefined,
        },
      };
    }
    case "undo": {
      if (state.shots.length === 0) return state;
      const shots = state.shots.slice(0, -1);
      const removed = state.shots[state.shots.length - 1];
      // If removed shot was on a hole earlier than current, jump back to that hole
      const holeShotsRemain = shots.filter((s) => s.holeNumber === removed.holeNumber);
      const currentHole = removed.holeNumber;
      const draft: DraftShot = holeShotsRemain.length
        ? {
            startLie: holeShotsRemain[holeShotsRemain.length - 1].endLie,
            startDistance: holeShotsRemain[holeShotsRemain.length - 1].endDistance,
            endLie: null,
            endDistanceStr: "",
            penalty: false,
            holed: false,
          }
        : { startLie: "tee", startDistance: 0, endLie: null, endDistanceStr: "", penalty: false, holed: false };
      return { currentHole, shots, draft };
    }
    case "next-hole": {
      if (state.currentHole >= 18) return state;
      const nextHole = state.currentHole + 1;
      return { ...state, currentHole: nextHole, draft: buildInitialDraft(state.shots, [], nextHole) };
    }
    case "prev-hole": {
      if (state.currentHole <= 1) return state;
      const prevHole = state.currentHole - 1;
      return { ...state, currentHole: prevHole, draft: buildInitialDraft(state.shots, [], prevHole) };
    }
    case "edit-start-lie":
      return { ...state, draft: { ...state.draft, startLie: action.lie } };
    case "edit-start-distance":
      return { ...state, draft: { ...state.draft, startDistance: action.value } };
  }
}

// ---------- helpers ----------

function determineCurrentHole(shots: StoredShot[], parPerHole: number[]): number {
  if (shots.length === 0) return 1;
  const lastShot = shots[shots.length - 1];
  if (lastShot.holed) return Math.min(18, lastShot.holeNumber + 1);
  return lastShot.holeNumber;
}

function buildInitialDraft(
  shots: StoredShot[],
  _parPerHole: number[],
  hole: number,
): DraftShot {
  const holeShots = shots.filter((s) => s.holeNumber === hole).sort((a, b) => a.shotNumber - b.shotNumber);
  if (holeShots.length === 0) {
    // Fresh hole → tee shot, distance unset (user enters hole yardage)
    return {
      startLie: "tee",
      startDistance: 0,
      endLie: null,
      endDistanceStr: "",
      penalty: false,
      holed: false,
    };
  }
  const last = holeShots[holeShots.length - 1];
  return {
    startLie: last.endLie,
    startDistance: last.endDistance,
    endLie: null,
    endDistanceStr: "",
    penalty: false,
    holed: false,
  };
}

function commitDraft(state: EntryState, id: string): StoredShot | null {
  const { draft, currentHole } = state;
  if (draft.startDistance <= 0 && draft.startLie !== "green") return null;
  if (!draft.endLie) return null;
  const endDistance = draft.holed ? 0 : parseInt(draft.endDistanceStr || "0", 10);
  if (!draft.holed && !Number.isFinite(endDistance)) return null;

  const shotNumber =
    state.shots.filter((s) => s.holeNumber === currentHole).length + 1;

  return {
    id,
    holeNumber: currentHole,
    shotNumber,
    startLie: draft.startLie,
    startDistance: draft.startDistance,
    endLie: draft.endLie,
    endDistance,
    missDirection: draft.missDirection,
    penalty: draft.penalty,
    penaltyType: draft.penalty ? draft.penaltyType : undefined,
    holed: draft.holed,
    club: draft.club,
  };
}
