import type { Lie } from "@/lib/sg/types";

export interface UnforcedErrors {
  sixPlusOnPar5?: boolean;
  doubleOrWorse?: boolean;
  threePutt?: boolean;
  pwOrLessBogey?: boolean;
  shortSided?: boolean;
  penaltyObWater?: boolean;
  mentalMistake?: boolean;
}

export type ShotShape = "straight" | "draw" | "fade" | "pull" | "push";
export type MissDirection = "left" | "center" | "right";
export type PenaltyType = "ob" | "hazard" | "lost";

export interface StoredShot {
  id: string; // uuid
  holeNumber: number;
  shotNumber: number;
  startLie: Lie;
  startDistance: number; // yards, or feet if startLie === "green"
  endLie: Lie;
  endDistance: number;
  club?: string;
  shape?: ShotShape;
  missDirection?: MissDirection;
  penalty: boolean;
  penaltyType?: PenaltyType;
  holed: boolean;
  sg?: number;
  sgCategory?: "OTT" | "APP" | "ARG" | "PUTT";
}

export interface StoredRound {
  id: string;
  createdAt: number; // epoch ms
  updatedAt: number;
  date: string; // YYYY-MM-DD
  courseName: string;
  holeCount: 9 | 18; // 9 or 18 holes; default 18
  totalPar: number; // course total par (default 72 for 18, 36 for 9)
  courseRating?: number; // e.g. 71.4
  courseSlope?: number; // e.g. 125
  parPerHole: number[]; // length = holeCount; defaults to all 4s. Cycled per hole as you play.
  parConfirmedHoles: number[]; // hole numbers where the user explicitly confirmed par via the picker
  /** User-entered score per hole (independent from shot count — supports score-only fast entry). */
  holeScores?: number[];
  /** Unforced-error flags per hole. */
  unforcedErrorsByHole?: UnforcedErrors[];
  notes?: string;
  status: "draft" | "complete";
  totalScore?: number;
  sgTotal?: number;
  sgOTT?: number;
  sgAPP?: number;
  sgARG?: number;
  sgPUTT?: number;
  // Tiger 5 (computed on complete)
  tiger5?: {
    doubleBogeys: number;
    par5BogeysOrWorse: number;
    threePutts: number;
    bogeysFrom150OrIn: number;
    blownParSaves: number;
  };
}

export interface StoredCourse {
  name: string; // primary key (case-insensitive match; stored as entered)
  rating?: number;
  slope?: number;
  defaultPar: number; // total par
  lastUsedAt: number;
}

/** Instrumentation metrics captured during entry (dev overlay). */
export interface EntryMetrics {
  roundId: string;
  totalShots: number;
  totalTaps: number;
  totalSeconds: number;
  perShotSeconds: number[];
  perShotTaps: number[];
}
