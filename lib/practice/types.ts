/**
 * Practice games — points-based drills you play and track over sessions.
 *
 * A GameDef is the static definition (rules, scoring, targets).
 * A GameSession is one recorded attempt with a final score.
 *
 * Three entry modes:
 *  - stations : per-station make counts (e.g. Clock Drill rings)
 *  - outcomes : tally shots into point buckets (e.g. Driver: fairway +1, miss -1)
 *  - flat     : a single number, usually total strokes (lower is better)
 */

export type GameArea = "putting" | "short-game" | "ball-striking";

export interface GameStation {
  key: string;
  label: string; // e.g. "3 ft"
  maxPer: number; // max points at this station
}

export interface GameOutcome {
  key: string;
  label: string; // e.g. "Fairway", "Inside 6 ft"
  points: number; // can be negative
  hint?: string; // short qualifier
}

export interface GameDef {
  id: string;
  area: GameArea;
  name: string;
  tagline: string;
  source?: string;
  description: string;
  howToScore: string;
  /** Theoretical ceiling — for progress bars / context. */
  maxPoints: number;
  /** A "good" target score for a scratch-level player. */
  targetPoints: number;
  /** Number of shots/reps in one round of the game (for outcome games). */
  shotsPerRound?: number;
  /** Per-station make counts. */
  stations?: GameStation[];
  /** Outcome buckets (tally mode). */
  outcomes?: GameOutcome[];
  /** Higher score is better (default true). Set false when lower wins. */
  higherIsBetter?: boolean;
  /** Why this game matters, tied to scoring / strokes gained. */
  whyItMatters?: string;
}

export interface GameSession {
  id: string;
  gameId: string;
  userId?: string;
  date: string; // YYYY-MM-DD
  createdAt: number;
  score: number;
  maxPoints: number;
  /** Per-station or per-outcome breakdown, keyed by station/outcome key. */
  stationScores?: Record<string, number>;
  notes?: string;
}
